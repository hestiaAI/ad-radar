let extensionName = 'MyWorth';

// Makes the extension compatible with Chrome
if (typeof browser === 'undefined') {
  var browser = chrome;
}

/**
 * Function to be called when the browser action button is clicked.
 * Sends a message to the main page requesting pbjs and googletag data.
 * @param tab - the tab where the action was clicked
 */
function askForPageData(tab) {
  browser.tabs.sendMessage(tab.id, {
    app: extensionName,
    destination: 'injected',
    type: 'request'
  });
}
browser.browserAction.onClicked.addListener(askForPageData);

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
      } else if (data.type === 'result') {
        browser.browserAction.setTitle({
          tabId: sender.tab.id,
          title: `Analysed ${data.numberOfAds} ads on this page`
        });
        browser.browserAction.setBadgeText({
          tabId: sender.tab.id,
          text: data.numberOfAds.toString()
        });
      } else if (data.type === 'reset') {
        browser.browserAction.setIcon({
          tabId: sender.tab.id,
          path: {
            64: 'icons/icon_color.png'
          }
        });
        browser.browserAction.setTitle({
          tabId: sender.tab.id,
          title: 'Waiting for the webpage to load'
        });
        browser.browserAction.setBadgeText({
          tabId: sender.tab.id,
          text: null
        });
        browser.browserAction.setBadgeBackgroundColor({
          tabId: sender.tab.id,
          color: 'gray'
        });
      }
    }
  }
});
