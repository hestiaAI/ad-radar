let extensionName = 'MyWorth';

// Makes the extension compatible with Chrome
if (typeof browser === 'undefined') {
  var browser = chrome;
}

browser.browserAction.setBadgeBackgroundColor({
  color: 'orange'
});

// Listen for browser action clicks and sends a message requesting ad data
browser.browserAction.onClicked.addListener(tab => {
  browser.tabs.sendMessage(tab.id, {
    app: extensionName,
    destination: 'content',
    type: 'request'
  });
});

// Listen for messages coming from content_script.js (which sometimes relays messages from injected_script.js)
browser.runtime.onMessage.addListener((data, sender) => {
  if (data?.app === extensionName && data?.destination === 'background') {
    if (data.type === 'result') {
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

// Listen to tab change events (ex: tab started loading)
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Restore the icon to the default values
  if (changeInfo.status === 'loading') {
    browser.browserAction.setTitle({
      tabId: tabId,
      title: 'Waiting for the webpage to load'
    });
    browser.browserAction.setBadgeText({
      tabId: tabId,
      text: '?'
    });
  }
});
