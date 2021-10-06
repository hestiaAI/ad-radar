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

  /**
   * Searches for the pbjs and googletag objects, and adds them to the window with these names when they exist.
   */
  function findAdData() {
    try {
      let my_worth_pbjs = findPbjs();
      let my_worth_googletag = findGoogleTag();
      window.pbjs = my_worth_pbjs;
      window.googletag = my_worth_googletag;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Sends a message to the background to inform the extension of whether pbjs and googletag were found on the webpage or not.
   * It only makes sense to call this function after findAdData.
   */
  function sendScoutMessage() {
    window.postMessage({
      app: extensionName,
      destination: 'background',
      type: 'scout',
      detectableAds: !!(pbjs && googletag)
    }, '*');
  }

  /**
   * Sends a message to the background with relevant information from pbjs and googletag.
   * It only makes sense to call this function after findAdData.
   */
  function sendAdDataMessage() {
    try {
      window.postMessage({
        app: extensionName,
        destination: 'content',
        type: 'ad-data',
        winningPrebids: JSON.parse(JSON.stringify(Object.fromEntries(pbjs.getAllWinningBids().map(bid => [bid.adUnitCode, bid])))),
        allPrebids: JSON.parse(JSON.stringify(pbjs.getBidResponses())),
        adUnits: pbjs.adUnits.map(ad => ad.code),
        adUnitToSlotId: Object.fromEntries(googletag.pubads().getSlots().map(slot => [slot.getAdUnitPath(), slot.getSlotElementId()]))
      }, '*');
    } catch (error) {
      window.postMessage({
        app: extensionName,
        destination: 'background',
        type: 'scout',
        detectableAds: false
      });
    }
  }

  // Set up an event listener to reply to the message requesting pbjs and googletag data by sending it
  window.addEventListener('message', (message) => {
    let data = message.data;
    if (data?.app === extensionName && data?.destination === 'injected') {
      if (data.type === 'request') {
        findAdData();
        sendAdDataMessage();
      }
      else if (data.type === 'scout') {
        findAdData();
        sendScoutMessage();
      }
    }
  });
}
