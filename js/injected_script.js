function injected() {
  let extensionName = 'MyWorth';

  /**
   * Searches the current window for a variable whose name contains 'pbjs' and that contains all properties we expect.
   * @return {object} If pbjs found, return it, otherwise throw an error.
   */
  function findPbjs() {
    // Matches any variable name that contains 'pbjs'
    let re = new RegExp(`[\s\S]*pbjs[\s\S]*`);
    // Finds all variables with 'pbjs' in their name, that have all the properties we expect to find in pbjs
    let candidates = Object.keys(window).filter(v => re.test(v) && window[v].adUnits
      && window[v].getBidResponses && window[v].getAllWinningBids);
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
    let re = new RegExp(`[\s\S]*googletag[\s\S]*`);
    // Finds all variables with 'googletag' in their name, that have all the properties we expect to find
    let candidates = Object.keys(window).filter(v => re.test(v) && window[v].pubads && window[v].pubads().getSlots);
    // Returns correctly when at least one candidate was found, otherwise throw error
    if (candidates.length > 0) return window[candidates[0]];
    else throw 'googletag not found';
  }

  /**
   * Searches for the pbjs and googletag objects, and add them to the window with these names when they exist.
   * Then, sends a message to the background to inform the extension of whether they were found on the webpage or not.
   */
  function sendScoutMessage() {
    let scoutResult = false;
    try {
      let my_worth_pbjs = findPbjs();
      let my_worth_googletag = findGoogleTag();
      window.pbjs = my_worth_pbjs;
      window.googletag = my_worth_googletag;
      scoutResult = true;
    } catch (error) {
      console.error(error);
    }

    window.postMessage({
      app: extensionName,
      destination: 'background',
      type: 'scout',
      detectableAds: scoutResult
    }, '*');
  }

  /**
   * Should only be called after sendScoutMessage.
   * Sends a message to the background with relevant information from pbjs and googletag.
   */
  function sendAdDataMessage() {
    window.postMessage({
      app: extensionName,
      destination: 'content',
      type: 'ad-data',
      winningPrebids: JSON.parse(JSON.stringify(Object.fromEntries(pbjs.getAllWinningBids().map(bid => [bid.adUnitCode, bid])))),
      allPrebids: JSON.parse(JSON.stringify(pbjs.getBidResponses())),
      adUnits: pbjs.adUnits.map(ad => ad.code),
      adUnitToSlotId: Object.fromEntries(googletag.pubads().getSlots().map(slot => [slot.getAdUnitPath(), slot.getSlotElementId()]))
    }, '*');
  }

  // Check if page is loaded, and if not, add listener for load event to send a scout message
  let loaded = false;
  if (document.readyState === 'complete') {
    sendScoutMessage();
    loaded = true;
  }
  else {
    window.addEventListener('load', () => {
      sendScoutMessage();
      loaded = true;
    });
  }

  // When the page changes, tell extension to reset the browser action properties
  window.addEventListener('beforeunload', () => {
    window.postMessage({
      app: extensionName,
      destination: 'background',
      type: 'reset'
    });
  });

  // Set up an event listener to reply to the message requesting pbjs and googletag data by sending it
  window.addEventListener('message', (message) => {
    let data = message.data;
    if (data !== null && typeof data === 'object' && data.app === extensionName) {
      if (data.destination === 'injected') {
        if (data.type === 'request') {
          if (loaded) {
            sendAdDataMessage();
          }
        }
      }
    }
  });
}
