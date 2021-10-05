function injected() {
  let extensionName = 'MyWorth';

  /**
   * Searches the current window for a variable whose name contains 'name' and
   * and that contains all properties from the list 'properties'.
   * @param  {string}   name                     string name to search for
   * @param  {[string]} properties               array of string properties
   * @return {object}   If variable found, return it, otherwise throw an error.
   */
  function findObjectWithProperties(name, properties) {
    // Matches any variable name that contains 'name'
    let re = new RegExp(`[\s\S]*${name}[\s\S]*`);
    // Finds all variables with 'name' in their name, that have all the properties in 'properties'
    let candidates = Object.keys(window).filter(v => re.test(v) && properties.map(p => window[v][p]).reduce((a, b) => a && b));
    // Returns correctly when at least one candidate was found, otherwise throw error
    if (candidates.length > 0 ) return window[candidates[0]];
    else throw `${name} not found`;
  }

  /**
   * Searches for the pbjs and googletag objects, and add them to the window with these names when they exist.
   * Then, sends a message to the background to inform the extension of whether they were found on the webpage or not.
   */
  function sendScoutMessage() {
    let scoutResult = false;
    try {
      window.pbjs = findObjectWithProperties('pbjs', ['adUnits', 'getBidResponses', 'getAllPrebidWinningBids']);
      window.googletag = findObjectWithProperties('googletag', ['pubads']);
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
      winningPrebids: JSON.parse(JSON.stringify(Object.fromEntries(pbjs.getAllPrebidWinningBids().map(bid => [bid.adUnitCode, bid])))),
      allPrebids: JSON.parse(JSON.stringify(pbjs.getBidResponses())),
      adUnits: pbjs.adUnits.map(ad => ad.code),
      adUnitToSlotId: Object.fromEntries(googletag.pubads().getSlots().map(slot => [slot.getAdUnitPath(), slot.getSlotElementId()]))
    }, '*');
  }

  // Check if page is loaded, and if not, add listener for load event to send a scout message
  if (document.readyState === 'complete') sendScoutMessage();
  else window.addEventListener('load', sendScoutMessage);

  // Set up an event listener to reply to the message requesting pbjs and googletag data by sending it
  window.addEventListener('message', (message) => {
    let data = message.data;
    if (data !== null && typeof data === 'object' && data.app === extensionName) {
      if (data.destination === 'injected') {
        if (data.type === 'request') {
          sendAdDataMessage();
        }
      }
    }
  });
}
