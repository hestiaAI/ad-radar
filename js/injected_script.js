function injected() {
  let extensionName = 'MyWorth';
  console.debug('[My Worth] script injected!');

  /**
   * A wrapper for messages to be sent to content or background scripts.
   * @param {object} message the message to be sent when it is not malformed
   * @throws {string} when the message is malformed
   */
  function sendMyWorthMessage(message) {
    if (message?.destination && message?.content) {
      message['app'] = extensionName;
      message[message.content].time = new Date().getTime();
      window.postMessage(message, '*');
    }
    else throw `Malformed My Worth message`;
  }

  function sendBid(bid) {
    sendMyWorthMessage({
      destination: 'content',
      content: 'bid',
      bid: {...bid, outdated: false}
    });
  }

  function sendPbjsBid(bid, won) {
    console.debug(`[My Worth] pbjs ${won ? 'winning' : 'losing'} bid`);
    console.debug(bid);
    sendBid({
      unitCode: bid.adUnitCode,
      bidder: bid.bidder,
      cpm: bid.cpm,
      currency: bid.currency,
      won: won,
      lib: 'pbjs',
    })
  }

  function sendGoogletagWinningBid(slot) {
    console.debug('[My Worth] googletag winning bid');
    console.debug(slot);
    let bid = slot.getTargetingMap();
    console.debug(bid);
    sendBid({
      unitCode: slot.getAdUnitPath(),
      bidder: bid.hb_bidder[0],
      cpm: parseFloat(bid.hb_pb[0]),
      currency: 'USD', // TODO find if actual currency can be different
      won: true,
      lib: 'googletag'
    });
  }

  function sendApstagWinningBid(bid) {
    console.debug('[My Worth] apstag winning bid');
    console.debug(bid);
    sendBid({
      unitCode: bid.kvMap.amznp[0],
      bidder: bid.kvMap.hb_bidder[0],
      cpm: parseFloat(bid.kvMap.hb_pb[0]),
      currency: 'USD', // TODO find if actual currency can be different
      won: true,
      lib: 'apstag',
    });
  }

  function sendSlotInfo(slot) {
    sendMyWorthMessage({
      destination: 'content',
      content: 'slot',
      slot: slot
    });
  }

  function sendPbjsSlotInfo(slot) {
    console.debug('[My Worth] pbjs slot info');
    console.debug(slot);
    sendSlotInfo({
      id: slot.adUnitCode,
      unitCode: slot.adUnitCode,
      lib: 'pbjs'
    });
  }

  function sendGoogletagSlotInfo(slot) {
    console.debug('[My Worth] googletag slot info');
    console.debug(slot);
    console.debug(slot.getTargetingMap());
    sendSlotInfo({
      id: slot.getSlotElementId(),
      unitCode: slot.getSlotId().getId(),
      lib: 'googletag'
    });
  }

  function sendApstagSlotInfo(bid) {
    console.debug('[My Worth] apstag slot info');
    console.debug(bid);
    sendSlotInfo({
      id: bid.slotID,
      unitCode: bid.amznp ?? bid.targeting.amznp,
      //size: bid.size ?? bid.amznsz ?? bid.targeting.amznsz ?? '?x?',
      lib: 'apstag'
    });
  }

  // For each library, specify a condition function that should be verified when applied to its object
  let conditionsToVerify = {
    'pbjs': obj => obj.adUnits && obj.getBidResponses && obj.getAllWinningBids,
    'googletag': obj => obj.pubads?.()?.getSlots(),
    'apstag': obj => obj._getSlotIdToNameMapping
  };
  /**
   * Searches the current window for a variable whose name contains some string and that verifies some conditions.
   * @param {string} libName the name of the object we are looking for
   * @returns {object} the object when it is found
   * @throws {string} when the object is not found
   */
  function findLibraryObject(libName) {
    // Regex matching a string containing the name of the library (or variations)
    let re = new RegExp(`[\s\S]*${libName}[\s\S]*`);
    // Get all variable names in window, and keep those matching regex and verifying the properties function
    let candidates = Object.keys(window).filter(varName => re.test(varName) && conditionsToVerify[libName](window[varName]));
    // Return a variable when at least one candidate is found, otherwise throw an error
    if (candidates.length > 0) return window[candidates[0]];
    else throw `${libName} not found`;
  }

  /**
   * Listen to the given library's hooks and events in order to retrieve ad information.
   * @param libName the name of the library we are instrumenting
   */
  function instrumentLibrary(libName) {
    if (libName === 'pbjs') {
      window.pbjs.adUnits.forEach(unit => sendPbjsSlotInfo(unit));
      window.pbjs.onEvent('bidResponse', (bid) => sendPbjsBid(bid, false));
      window.pbjs.onEvent('bidWon', (bid) => sendPbjsBid(bid, true));
      window.pbjs.onEvent('addAdUnits', () => window.pbjs.adUnits.forEach(unit => sendPbjsSlotInfo(unit)));

    }
    else if (libName === 'googletag') {
      window.googletag.pubads().addEventListener('slotResponseReceived', (event) => {
        console.debug('[My Worth] googletag slotResponseReceived');
        sendGoogletagSlotInfo(event.slot);
      });
      window.googletag.pubads().addEventListener('slotOnload', (event) => {
        console.debug('[My Worth] googletag slotOnload');
        console.debug(event);
        sendGoogletagSlotInfo(event.slot);
        sendGoogletagWinningBid(event.slot);
      });
    }
    else if (libName === 'apstag') {
      let original_fetchBids = window.apstag.fetchBids;
      window.apstag.fetchBids = function(cfg, callback) {
        let new_callback = (bids, info) => {
          bids.forEach(bid => sendApstagSlotInfo(bid));
          return callback(bids, info);
        }
        return original_fetchBids(cfg, new_callback);
      }
      let original_renderImp = window.apstag.renderImp;
      window.apstag.renderImp = function() {
        if (arguments[2]) {
          sendApstagWinningBid(arguments[2]);
        }
        return original_renderImp(...arguments);
      }
    }
  }

  /**
   * Creates an interval to search for a library in the current window, and then instrument it if found.
   * @param {string} lib the name of the library to search for and to instrument if found
   * @returns {number} the number of the created interval
   */
  function createSearchAndInstrumentInterval(lib) {
    let intervalTimeout = 5;
    let interval = setInterval(() => {
      try {
        window[lib] = findLibraryObject(lib);
        console.debug(`[My Worth] found ${lib}`)
        clearInterval(interval);
        instrumentLibrary(lib);
      } catch (error) {}
    }, intervalTimeout);
    return interval;
  }

  /**
   * This function sets a timeout to stop searching for libraries after {delay} milliseconds.
   */
  function stopSearchingLibrariesSoon() {
    let delay = 2000;
    setTimeout(() => {
      searchIntervals.forEach(interval => clearInterval(interval));
      console.debug('[My Worth] stopped searching for libraries !');
    }, delay);
  }


  // Start searching for the libraries that we rely on
  let librariesOfInterest = ['pbjs', 'googletag', 'apstag'];
  let searchIntervals = librariesOfInterest.map(lib => createSearchAndInstrumentInterval(lib));
  console.debug('[My Worth] started searching for libraries !');

  // If some of the needed libraries are not yet available once the page finished loading,
  // then we have no hope of finding them so we stop looking.
  if (document.readyState === 'complete') {
    stopSearchingLibrariesSoon();
  }
  else {
    window.addEventListener('load', stopSearchingLibrariesSoon);
  }
}
