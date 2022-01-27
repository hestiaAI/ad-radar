import {browser} from 'webextension-polyfill-ts';
import {EXTENSION_NAME} from '../Core';
import {initAccessors, initAds} from '../Core/storage';

function setProperties(properties: {
  tabId: number;
  title: string;
  text: string;
}): void {
  if (properties.title) {
    browser.browserAction.setTitle({
      tabId: properties.tabId,
      title: properties.title,
    });
  }
  if (properties.text) {
    browser.browserAction.setBadgeText({
      tabId: properties.tabId,
      text: properties.text,
    });
  }
}

// Actions to take when extension is initialized
browser.runtime.onInstalled.addListener(() => {
  browser.browserAction.setBadgeBackgroundColor({
    color: 'orange',
  });

  browser.storage.local.get().then((store) => {
    // Initiate empty array of ads but don't reset the data if it already exists
    if (!store.ads) {
      initAds();
    }
    if (!store.accessors) {
      initAccessors();
    }
  });
});

// Listen for messages coming from ContentScript (which sometimes relays messages from Injected)
browser.runtime.onMessage.addListener((message, sender) => {
  if (
    message?.app === EXTENSION_NAME &&
    message?.destination === 'background'
  ) {
    if (message.type === 'numberOfAds') {
      setProperties({
        tabId: sender.tab?.id ?? 0,
        title: `Analysed ${message.content} ads on this page`,
        text: message.content.toString(),
      });
    } else if (message.type === 'ad') {
      browser.storage.local
        .get('ads')
        .then((data) =>
          browser.storage.local.set({ads: data.ads.concat([message.content])})
        );
    }
  }
});

// Listen to tab change events (ex: tab started loading)
browser.tabs.onUpdated.addListener((tabId: number, changeInfo) => {
  // Restore the icon to the default values
  if (changeInfo.status === 'loading') {
    setProperties({
      tabId,
      title: 'Waiting for the webpage to load',
      text: '',
    });
  }
  // If the page has finished loading and no ad was detected, inform it
  if (changeInfo.status === 'complete') {
    browser.browserAction.getBadgeText({tabId}).then((text: string) => {
      if (text === '') {
        setProperties({
          tabId,
          text: '0',
          title: 'No ads detected',
        });
      }
    });
  }
});
