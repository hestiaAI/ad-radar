import {Accessors, JsObject, JsValue} from '../Core/types';
import {EXTENSION_NAME} from '../Core';
import {accessorEngine} from '../Core/accessors';

interface WindowWithLibraries extends Window {
  pbjs: {
    adUnits: JsObject[];
    onEvent: (name: string, event: JsValue) => void;
    [key: string]: JsValue;
  };
  googletag: {
    pubads: () => {
      addEventListener: (name: string, event: JsValue) => void;
      getSlots: () => {getAdUnitPath: () => string}[];
    };
    [key: string]: JsValue;
  };
  apstag: {[key: string]: JsValue};

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  [key: string]: JsValue;
}

declare let window: WindowWithLibraries;

console.info(`[${EXTENSION_NAME}] script injected!`);

/**
 * A wrapper for messages to be sent to content or background scripts.
 * @param {object} message the message to be sent when it is not malformed
 * @throws {string} when the message is malformed
 */
function sendMessage(message: {
  app?: string;
  content: JsObject;
  destination: string;
  type: string;
}): void {
  if (message.destination && message.content) {
    const {hostname} = new URL(window.location.href);
    message.app = EXTENSION_NAME;
    message.content.time = new Date().toISOString();
    message.content.hostname = hostname;
    window.postMessage(message, '*');
  } else {
    throw new Error(`[${EXTENSION_NAME}] Malformed message`);
  }
}

let accessors: Accessors;
sendMessage({destination: 'content', type: 'getAccessors', content: {}});
window.addEventListener('message', (event: MessageEvent) => {
  const message = event.data;
  if (
    message.app === EXTENSION_NAME &&
    message.destination === 'injected' &&
    message.type === 'accessors'
  ) {
    accessors = message.content;
  }
});

/**
 * Extracts information from an object, and executes getter functions that don't expect arguments.
 * @param object the object to extract information from
 * @param maxDepth the maximum depth that we will go to in order to extract information
 * @returns {Object} a copy of the given object, but serializable
 */
function getAllFields(object: JsObject, maxDepth = 7): JsObject {
  function recurse(val: JsValue, depth: number, key = ''): JsValue {
    if (depth >= maxDepth || val === null) {
      return JSON.parse(JSON.stringify(val));
    }
    if (typeof val === 'function') {
      const result: {result?: JsValue; error?: string} = {};
      if (val.length === 0 && key.startsWith('get')) {
        try {
          const f = val as () => JsValue;
          result.result = recurse(f(), depth + 1);
        } catch (error) {
          result.error = error.message;
        }
      }
      return result;
    }
    if (Array.isArray(val)) {
      return val.map((e) => recurse(e, depth + 1));
    }
    if (typeof val === 'object') {
      return Object.fromEntries(
        Object.entries(val).map(([k, v]) => [k, recurse(v, depth + 1, k)])
      );
    }
    return {};
  }

  return Object.fromEntries(
    Object.entries(object).map(([k, v]) => [k, recurse(v, 0, k)])
  );
}

/**
 * A wrapper that sends a message with the content of the given bid.
 * @param {object} bid the bid to send
 */
function sendBid(bid: {original: JsObject; extracted: JsObject}): void {
  if (bid.extracted.cpm) {
    sendMessage({
      destination: 'content',
      type: 'bid',
      content: {
        extracted: {
          ...bid.extracted,
          outdated: false,
        },
        original: bid.original,
      },
    });
  }
}

/**
 * A wrapper that sends a message with the content of the given slot.
 * @param {object} slot the slot to send
 */
function sendSlotInfo(slot: JsObject): void {
  sendMessage({
    destination: 'content',
    type: 'slot',
    content: slot,
  });
}

/**
 * A wrapper that takes a pbjs bid object and sends the relevant fields to the content script.
 * @param {object} bid the pbjs bid object
 * @param {boolean} won extra information regarding whether the bid won or not
 */
function sendPbjsBid(bid: JsObject, won: boolean): void {
  sendBid({
    extracted: accessorEngine.accessAll({won, ...bid}, accessors.pbjs),
    original: getAllFields(bid),
  });
}

/**
 * A wrapper that takes a winning googletag slot/bid object and sends the relevant fields to the content script.
 * @param {object} bid the 'slot' of a slotOnload event
 */
function sendGoogletagWinningBid(bid: JsObject): void {
  sendBid({
    extracted: accessorEngine.accessAll(bid, accessors.googletag),
    original: getAllFields(bid),
  });
}

/**
 * A wrapper that takes a winning apstag bid object and sends the relevant fields to the content script.
 * @param {object} bid the 3rd argument of apstag.renderImp
 */
function sendApstagWinningBid(bid: JsObject): void {
  sendBid({
    extracted: accessorEngine.accessAll(bid, accessors.apstag),
    original: getAllFields(bid),
  });
}

/**
 * A wrapper that takes a pbjs slot object and sends the relevant fields to the content script.
 * @param {object} slot one ad unit object or an actual pbjs bid
 */
function sendPbjsSlotInfo(slot: JsObject): void {
  sendSlotInfo({
    id: slot.code,
    unitCode: slot.code,
    lib: 'pbjs',
  });
}

/**
 * A wrapper that takes a googletag slot object and sends the relevant fields to the content script.
 * If all slot unitPaths are unique, they are used as unitCode, otherwise the slot id is used.
 * @param {object} slot the 'slot' of a slotResponseReceived or slotOnload event
 */
function sendGoogletagSlotInfo(slot: JsObject): void {
  const paths: string[] = window.googletag
    .pubads()
    .getSlots()
    .map((s: {getAdUnitPath: () => string}) => s.getAdUnitPath());
  const nDistinctPaths = new Set(paths).size;
  sendSlotInfo({
    id: (slot as {getSlotElementId: () => string}).getSlotElementId(),
    unitCode:
      paths.length === nDistinctPaths
        ? (slot as {getAdUnitPath: () => string}).getAdUnitPath()
        : (slot as {getSlotId: () => {getId: () => string}})
            .getSlotId()
            .getId(),
    lib: 'googletag',
  });
}

/**
 * A wrapper that takes an apstag slot object and sends the relevant fields to the content script.
 * @param {object} slot the object given to the callback of apstag.fetchBids
 */
function sendApstagSlotInfo(slot: JsObject): void {
  sendSlotInfo({
    id: slot.slotID,
    unitCode: slot.amznp ?? (slot.targeting as {amznp: string}).amznp,
    lib: 'apstag',
    extra: slot.targeting,
  });
}

// For each library, specify a condition function that should be verified when applied to its object
const conditionsToVerify: {[key: string]: (obj: JsObject) => boolean} = {
  pbjs: (obj: JsObject): boolean =>
    !!obj.getBidResponses && !!obj.getAllWinningBids,
  googletag: (obj: JsObject): boolean =>
    !!(obj as {pubads: () => JsObject}).pubads()?.getSlots,
  apstag: (obj: JsObject): boolean => !!obj._getSlotIdToNameMapping,
};

/**
 * Searches the current window for a variable whose name contains some string and that verifies some conditions.
 * @param {string} lib the name of the object we are looking for
 * @returns {object} the object when it is found
 * @throws {string} when the object is not found
 */
function findLibraryObject(lib: string): JsObject {
  // Regex matching a string containing the name of the library (or variations)
  const re = new RegExp(`[\\S]*${lib}[\\S]*`);
  // Get all variable names in window, and keep those matching regex and verifying the properties function
  const candidates: string[] = Object.keys(window).filter(
    (varName: string) =>
      re.test(varName) && conditionsToVerify[lib](window[varName] as JsObject)
  );
  // Return a variable when at least one candidate is found, otherwise throw an error
  const [name] = candidates;
  if (name) {
    return window[name] as JsObject;
  }
  throw new Error(`${lib} not found`);
}

/**
 * Listen to the given library's hooks and events in order to retrieve ad information.
 * @param {string} lib the name of the library we are instrumenting
 */
function instrumentLibrary(lib: string): void {
  if (lib === 'pbjs') {
    window.pbjs.adUnits.forEach((unit: JsObject) => sendPbjsSlotInfo(unit));
    window.pbjs.onEvent('bidResponse', (bid: JsObject) =>
      sendPbjsBid(bid, false)
    );
    window.pbjs.onEvent('bidWon', (bid: JsObject) => sendPbjsBid(bid, true));
    window.pbjs.onEvent('addAdUnits', () =>
      window.pbjs.adUnits.forEach((unit: JsObject) => sendPbjsSlotInfo(unit))
    );
  } else if (lib === 'googletag') {
    window.googletag
      .pubads()
      .addEventListener('slotResponseReceived', (event: {slot: JsObject}) =>
        sendGoogletagSlotInfo(event.slot)
      );
    window.googletag
      .pubads()
      .addEventListener('slotOnload', (event: {slot: JsObject}) => {
        sendGoogletagSlotInfo(event.slot);
        sendGoogletagWinningBid(event.slot);
      });
  } else if (lib === 'apstag') {
    const originalFetchBids = window.apstag.fetchBids as (
      cfg: JsValue,
      callback: (bids: JsObject[], info: unknown) => unknown
    ) => unknown;
    window.apstag.fetchBids = (
      cfg: JsValue,
      callback: (bids: JsObject[], info: unknown) => unknown
    ): unknown => {
      const newCallback = (bids: JsObject[], info: unknown): unknown => {
        bids.forEach((bid) => sendApstagSlotInfo(bid));
        return callback(bids, info);
      };
      return originalFetchBids(cfg, newCallback);
    };
    const originalRenderImp = window.apstag.renderImp as (
      ...args: JsObject[]
    ) => unknown;
    window.apstag.renderImp = (...args: JsObject[]): unknown => {
      if (args[2]) {
        sendApstagWinningBid(args[2]);
      }
      return originalRenderImp(...args);
    };
  }
}

/**
 * Creates an interval to search for a library in the current window, and then instrument it if found.
 * @param {string} lib the name of the library to search for and to instrument if found
 * @returns {number} the number of the created interval
 */
function createSearchAndInstrumentInterval(lib: string): NodeJS.Timeout {
  const intervalTimeout = 2;
  const interval = setInterval(() => {
    try {
      window[lib] = findLibraryObject(lib);
      console.info(`[${EXTENSION_NAME}] found ${lib}`);
      clearInterval(interval);
      instrumentLibrary(lib);
      // eslint-disable-next-line no-empty
    } catch (_) {}
  }, intervalTimeout);
  return interval;
}

// Start searching for the libraries that we rely on
const librariesOfInterest = ['pbjs', 'googletag', 'apstag'];
const searchIntervals = librariesOfInterest.map((lib) =>
  createSearchAndInstrumentInterval(lib)
);
console.info(`[${EXTENSION_NAME}] started searching for libraries !`);

/**
 * This function sets a timeout to stop searching for libraries after {delay} milliseconds.
 */
function stopSearchingLibrariesSoon(): void {
  const delay = 2000;
  setTimeout(() => {
    searchIntervals.forEach((interval) => clearInterval(interval));
    console.info(`[${EXTENSION_NAME}] stopped searching for libraries !`);
  }, delay);
}

// If some needed libraries are not yet available once the page finished loading,
// then we have no hope of finding them, so we stop looking.
if (document.readyState === 'complete') {
  stopSearchingLibrariesSoon();
} else {
  window.addEventListener('load', stopSearchingLibrariesSoon);
}
