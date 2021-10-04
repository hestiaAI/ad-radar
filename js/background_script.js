let extensionName = 'MyWorth';

// Makes the extension compatible with Chrome
if (typeof browser === 'undefined') {
  var browser = chrome;
}

// Listen for messages coming from content_script.js
browser.runtime.onMessage.addListener((data, sender) => {
  if (data !== null && typeof data === 'object' && data.app === extensionName) {
    if (data.destination === 'background') {
      if (data.type === 'scout') {
        // Change the Browser Action based on whether pbjs is loaded into the mainpage
        browser.browserAction.setIcon({
          tabId: sender.tab.id,
          path: {
            64: `icons/icon_${data.detectableAds ? 'color' : 'bw'}.png`
          }
        });
        browser.browserAction.setTitle({
          tabId: sender.tab.id,
          title: data.detectableAds ? 'Click to find your worth!' : 'No ads detected on this page'
        });
        browser.browserAction.setBadgeText({
          tabId: sender.tab.id,
          text: '!'
        });
        browser.browserAction.setBadgeBackgroundColor({
          tabId: sender.tab.id,
          color: data.detectableAds ? 'green' : 'red'
        });
        // If ads are detectable, add a behaviour to the click of the button
        if (data.detectableAds) {
          browser.browserAction.onClicked.addListener((tab) => {
            browser.tabs.sendMessage(tab.id, {
              app: extensionName,
              destination: 'injected',
              type: 'request'
            });
          });
        }
      } else if (data.type === 'result') {
        browser.browserAction.setTitle({
          tabId: sender.tab.id,
          title: `Analysed ${data.numberOfAds} ads on this page`
        });
        browser.browserAction.setBadgeText({
          tabId: sender.tab.id,
          text: data.numberOfAds.toString()
        });
      }
    }
  }
});
