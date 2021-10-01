let extensionName = 'MyWorth';

if (typeof browser === 'undefined') {
  var browser = chrome;
}

browser.runtime.onMessage.addListener((data, sender) => {
  if (typeof data === 'object' && data !== null && data.app === extensionName) {
    if (data.destination === 'background') {
      if (data.type === 'scout') {
        console.debug('background received scout message');
        browser.browserAction.setIcon({
          path: {
            64: `icons/icon_${data.detectableAds ? 'color' : 'bw'}.png`
          },
          tabId: sender.tab.id
        });
        browser.browserAction.setBadgeText({
          text: '!',
          tabId: sender.tab.id
        });
        browser.browserAction.setTitle({
          title: data.detectableAds ? 'Click to find your worth!' : 'No ads detected on this page',
          tabId: sender.tab.id
        });
        browser.browserAction.setBadgeBackgroundColor({
          color: data.detectableAds ? 'green' : 'red',
          tabId: sender.tab.id
        });
        if (data.detectableAds) {
          browser.browserAction.onClicked.addListener((tab) => {
            browser.tabs.sendMessage(tab.id, {
              app: extensionName,
              destination: 'injected',
              type: 'request'
            });
            console.debug('background sent request message');
          });
        }
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
