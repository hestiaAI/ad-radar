let extensionName = 'MyWorth';

browser.browserAction.setBadgeBackgroundColor({
  color: 'orange'
});

browser.runtime.onMessage.addListener((data, sender) => {
  if (typeof data === 'object' && data !== null && data.app === extensionName) {
    if (data.destination === 'background') {
      if (data.type === 'scout') {
        console.debug('background received scout message');
        browser.browserAction.setIcon({
          path: {
            64: `icons/icon${data.detectableAds ? '' : '_bw'}.png`
          },
          tabId: sender.tab.id
        });
      }
      else if (data.type === 'result') {
        console.debug('background received result message');
        browser.browserAction.setBadgeText({
          text: data.numberofAds.toString(),
          tabId: sender.tab.id
        });
        browser.browserAction.setTitle({
          title: `Analysed ${data.numberofAds} ads on this page`,
          tabId: sender.tab.id
        });
      }
    }
  }
});

browser.browserAction.onClicked.addListener((tab) => {
  browser.tabs.sendMessage(tab.id, {
    app: extensionName,
    destination: 'injected',
    type: 'request'
  });
  console.debug('background sent request message');
});
