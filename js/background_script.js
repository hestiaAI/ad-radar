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
browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.app === extensionName && message?.destination === 'background') {
    if (message.type === 'result') {
      browser.browserAction.setTitle({
        tabId: sender.tab.id,
        title: `Analysed ${message.numberOfAds} ads on this page`
      });
      browser.browserAction.setBadgeText({
        tabId: sender.tab.id,
        text: message.numberOfAds.toString()
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
      text: ''
    });
  }
  // If the page has finished loading and no ad was detected, inform it
  if (changeInfo.status === 'complete') {
    browser.browserAction.getBadgeText({tabId: tabId}, text => {
      if (text === '') {
        browser.browserAction.setBadgeText({
          tabId: tabId,
          text: '0'
        });
        browser.browserAction.setTitle({
          tabId: tabId,
          title: 'No ads detected'
        });
      }
    });
  }
});
