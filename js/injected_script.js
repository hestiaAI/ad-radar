function injected() {
  let extensionName = 'MyWorth';

  /**
   * Searches the current window for a variable whose name contains 'pbjs' and that contains all properties we expect.
   * @return {object} If pbjs found, return it, otherwise throw an error.
   */
  function findPbjs() {
    // Matches any variable name that contains 'pbjs'
    let re = new RegExp('[\s\S]*pbjs[\s\S]*');
    // Finds all variables with 'pbjs' in their name, that have all the properties we expect to find in pbjs
    let candidates = Object.keys(window).filter(
      v => re.test(v) && window[v].adUnits && window[v].getBidResponses && window[v].getAllWinningBids
    );
    // Returns correctly when at least one candidate was found, otherwise throw error
    if (candidates.length > 0) return window[candidates[0]];
    else throw 'pbjs not found';
  }

  /**
   * Searches the current window for a variable whose name contains 'googletag' and that contains all properties we expect.
   * @return {object} If googletag found, return it, otherwise throw an error.
   */
  function findGoogleTag() {
    // Matches any variable name that contains 'googletag'
    let re = new RegExp('[\s\S]*googletag[\s\S]*');
    // Finds all variables with 'googletag' in their name, that have all the properties we expect to find
    let candidates = Object.keys(window).filter(
      v => re.test(v) && window[v].pubads && window[v].pubads().getSlots
    );
    // Returns correctly when at least one candidate was found, otherwise throw error
    if (candidates.length > 0) return window[candidates[0]];
    else throw 'googletag not found';
  }

  function sendAdUnits() {
    window.postMessage({
      app: extensionName,
      destination: 'content',
      content: 'adUnits',
      adUnits: pbjs.adUnits.map(ad => ad.code)
    }, '*');
  }

  function sendBidInfo(bid, winner) {
    window.postMessage({
      app: extensionName,
      destination: 'content',
      content: 'bid',
      type: winner ? 'winningBid': 'bid',
      bid: {
        adUnitCode: bid.adUnitCode,
        cpm: bid.cpm,
        currency: bid.currency,
        bidder: bid.bidder
      }
    }, '*');
  }

  function sendSlotInfo(slot) {
    window.postMessage({
      app: extensionName,
      destination: 'content',
      content: 'slot',
      type: 'rendered',
      slot: {
        id: slot.getSlotElementId(),
        adUnitPath: slot.getAdUnitPath()
      }
    }, '*');
  }


  let searchPbjsInterval = setInterval(() => {
    try {
      findPbjs();

      clearInterval(searchPbjsInterval);

      sendAdUnits();
      pbjs.onEvent('addAdUnit', () => sendAdUnits());
      pbjs.onEvent('bidResponse', (bid) => sendBidInfo(bid, false));
      pbjs.onEvent('bidWon', (bid) => sendBidInfo(bid, true));
      pbjs.onEvent('adUnitAdded', (adUnit) => console.debug(adUnit));
    } catch (error) {}
  }, 1);

  let searchGoogleTagInterval = setInterval(() => {
    try {
      findGoogleTag();

      clearInterval(searchGoogleTagInterval);
      googletag.pubads().getSlots().forEach((slot) => sendSlotInfo(slot));
      googletag.pubads().addEventListener('slotOnload', (event) => sendSlotInfo(event.slot));
    } catch (error) {}
  }, 1);

  if (document.readyState === 'complete') {
    setTimeout(() => {
      clearInterval(searchPbjsInterval);
      clearInterval(searchGoogleTagInterval);
    }, 2);
  }
  else {
    window.addEventListener('load', () => {
      clearInterval(searchPbjsInterval);
      clearInterval(searchGoogleTagInterval);
    });
  }
}
