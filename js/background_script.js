let extensionName = 'MyWorth';

// Makes the extension compatible with Chrome
if (typeof browser === 'undefined') {
  var browser = chrome;
}

// Listen for browser action clicks and sends a message requesting ad data
browser.browserAction.onClicked.addListener(tab => {
  browser.tabs.sendMessage(tab.id, {
    app: extensionName,
    destination: 'injected',
    type: 'request'
  });
});

// Listen for messages coming from content_script.js (which sometimes relays messages from injected_script.js)
browser.runtime.onMessage.addListener((data, sender) => {
  if (data?.app === extensionName && data?.destination === 'background') {
    // Change the Browser Action based on whether pbjs is loaded into the mainpage
    if (data.type === 'scout') {
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
    }
    else if (data.type === 'result') {
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
});

// Listn to tab change events (tab started loading or finished loading)
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Restore the icon to the default values
  if (changeInfo.status === 'loading') {
    browser.browserAction.setIcon({
      tabId: tabId,
      path: {
        64: 'icons/icon_color.png'
      }
    });
    browser.browserAction.setTitle({
      tabId: tabId,
      title: 'Waiting for the webpage to load'
    });
    browser.browserAction.setBadgeText({
      tabId: tabId,
      text: '?'
    });
    browser.browserAction.setBadgeBackgroundColor({
      tabId: tabId,
      color: 'orange'
    });
  }
  // Send a scout message to the page to check if pbjs and googletag are detected
  else if (changeInfo.status === 'complete') {
    browser.tabs.sendMessage(tabId, {
      app: extensionName,
      destination: 'injected',
      type: 'scout'
    });
  }
});
