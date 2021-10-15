browser.browserAction.setBadgeBackgroundColor({
  color: 'orange'
});

browserStorage.local.set({bids: []})

function setProperties(properties) {
  if (properties.title) {
    browser.browserAction.setTitle({tabId: properties.tabId, title: properties.title});
  }
  if (properties.text) {
    browser.browserAction.setBadgeText({tabId: properties.tabId, text: properties.text});
  }
}

browser.browserAction.onClicked.addListener(tab => {
  browser.tabs.create({
    url: 'main.html'
  });
});

// Listen for messages coming from content_script.js (which sometimes relays messages from injected_script.js)
browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.app === extensionName && message?.destination === 'background') {
    if (message.content === 'numberOfAds') {
      setProperties({
        tabId: sender.tab.id,
        title: `Analysed ${message.numberOfAds} ads on this page`,
        text: message.numberOfAds.toString()
      });
    }
    else if (message.content === 'bid') {
      browser.storage.local.get('bids', bids => browser.storage.local.set('bids', bids.concat([message.bid])));
    }
  }
});

// Listen to tab change events (ex: tab started loading)
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Restore the icon to the default values
  if (changeInfo.status === 'loading') {
    setProperties({
      tabId: tabId,
      title: 'Waiting for the webpage to load',
      text: ''
    });
  }
  // If the page has finished loading and no ad was detected, inform it
  if (changeInfo.status === 'complete') {
    browser.browserAction.getBadgeText({tabId: tabId}, text => {
      if (text === '') {
        setProperties({
          tabId: tabId,
          text: '0',
          title: 'No ads detected'
        });
      }
    });
  }
});
