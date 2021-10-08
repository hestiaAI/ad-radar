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
      window.postMessage(message, '*');
    }
    else throw `Malformed My Worth message`;
  }

  function sendAdUnits() {
    sendMyWorthMessage({
      destination: 'content',
      content: 'adUnits',
      adUnits: window.pbjs.adUnits.map(ad => ad.code)
    });
  }

  function sendPbjsBid(bid, won) {
    sendMyWorthMessage({
      destination: 'content',
      content: 'bid',
      bid: {
        adUnitCode: bid.adUnitCode,
        bidder: bid.bidder,
        cpm: bid.cpm,
        currency: bid.currency,
        lib: 'pbjs',
        time: new Date().getTime(),
        won: won,
      }
    });
  }

  function sendGoogletagSlotInfo(slot) {
    sendMyWorthMessage({
      destination: 'content',
      content: 'slot',
      slot: {
        id: slot.getSlotElementId(),
        unitCode: slot.getAdUnitPath()
      }
    });
  }

  function sendApstagSlotInfo(bid) {
    sendMyWorthMessage({
      destination: 'content',
      content: 'slot',
      slot: {
        id: bid.slotID,
        unitCode: bid.targeting.amznbid
      }
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
      window.pbjs.onEvent('addAdUnit', () => sendAdUnits());
      window.pbjs.onEvent('bidResponse', (bid) => sendPbjsBid(bid, false));
      window.pbjs.onEvent('bidWon', (bid) => sendPbjsBid(bid, true));
      window.pbjs.onEvent('adUnitAdded', (adUnit) => console.debug(adUnit));
    }
    else if (libName === 'googletag') {
      window.googletag.pubads().addEventListener('slotResponseReceived', (event) => sendGoogletagSlotInfo(event.slot));
      window.googletag.pubads().addEventListener('slotRenderEnded', (event) => sendGoogletagSlotInfo(event.slot));
    }
    else if (libName === 'apstag') {
      let original_fetchBids = apstag.fetchBids;
      window.apstag.fetchBids = function(cfg, callback) {
        let new_callback = (bids, info) => {
          console.debug('[My Worth] apstag received bids');
          console.debug(bids);
          console.debug(info);
          bids.forEach(bid => sendApstagSlotInfo(bid));
          return callback(bids, info);
        }
        return original_fetchBids(cfg, new_callback);
      }
      let original_renderImp = apstag.renderImp;
      window.apstag.renderImp = function(doc, adUnitCode) {
        // sendWinningApstagBidCode(adUnitCode);
        return original_renderImp(doc, adUnitCode);
      }
    }
  }

  /**
   * Creates an interval to search for a library in the current window, and then instrument it if found.
   * @param {object} lib the library to search for and to instrument if found
   * @returns {number} the number of the created interval
   */
  function createSearchAndInstrumentInterval(lib) {
    let intervalTimeout = 1;
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


  // Start searching for the libraries that we rely on
  let librariesOfInterest = ['pbjs', 'googletag', 'apstag'];
  let searchIntervals = librariesOfInterest.map(lib => createSearchAndInstrumentInterval(lib));
  console.debug('[My Worth] started searching for libraries !');

  // If some of the needed libraries are not yet available once the page finished loading,
  // then we have no hope of finding them so we stop looking.
  if (document.readyState === 'complete') {
    setTimeout(() => {
      searchIntervals.forEach(interval => clearInterval(interval));
      console.debug('[My Worth] stopped searching for libraries !');
    }, 2);
  }
  else {
    window.addEventListener('load', () => {
      searchIntervals.forEach(interval => clearInterval(interval));
      console.debug('[My Worth] stopped searching for libraries !');
    });
  }
}
