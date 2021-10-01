function injected() {
  let extensionName = 'MyWorth';
  // When the page loads, tell the extension whether the button should be clickable
  window.addEventListener('load', () => {
    try {
      pbjs.adUnits[0];
      googletag.pubads().getSlots();
      window.postMessage({
        app: extensionName,
        destination: 'background',
        type: 'scout',
        detectableAds: true
      });
      console.debug('injected sent scout message');
    } catch (error) {
      window.postMessage({
        app: extensionName,
        destination: 'background',
        type: 'scout',
        detectableAds: false
      });
      console.debug('injected sent scout message');
    }
  });

  // receive message requesting pbjs and googletag data, and send it
  window.addEventListener('message', (message) => {
    if (typeof message.data === 'object' && message.data !== null && message.data.app === extensionName) {
      if (message.data.destination === 'injected') {
        if (message.data.type === 'request') {
          console.debug('injected received request message');
          window.postMessage({
            app: extensionName,
            destination: 'content',
            type: 'ad-data',
            winningPrebids: JSON.parse(JSON.stringify(Object.fromEntries(pbjs.getAllPrebidWinningBids().map(bid => [bid.adUnitCode, bid])))),
            allPrebids: JSON.parse(JSON.stringify(pbjs.getBidResponses())),
            adUnitToDivs: Object.fromEntries(googletag.pubads().getSlots().map(slot => [slot.getAdUnitPath(), slot.getSlotElementId()]))
          });
          console.debug('injected sent ad-data message');
        }
      }
    }
  });
}
