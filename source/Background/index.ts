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

  browser.storage.local.get((store: {ads: unknown, accessors: unknown}) => {
    // Initiate empty array of ads but don't reset the data if it already exists
    if (!store.ads) {
      initAds();
    }
    if (!store.accessors) {
      initAccessors();
    }
  });
});

// Listen for messages coming from content_script.js (which sometimes relays messages from injected_script.js)
browser.runtime.onMessage.addListener((message, sender) => {
  if (
    message?.app === EXTENSION_NAME &&
    message?.destination === 'background'
  ) {
    if (message.content === 'numberOfAds') {
      setProperties({
        tabId: sender.tab.id,
        title: `Analysed ${message.numberOfAds} ads on this page`,
        text: message.numberOfAds.toString(),
      });
    } else if (message.content === 'ad') {
      browser.storage.local.get('ads', (data) =>
        browser.storage.local.set({ads: data.ads.concat([message.ad])}),
      );
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
      text: '',
    });
  }
  // If the page has finished loading and no ad was detected, inform it
  if (changeInfo.status === 'complete') {
    browser.browserAction.getBadgeText({tabId}, (text: string) => {
      if (text === '') {
        setProperties({
          tabId: tabId,
          text: '0',
          title: 'No ads detected',
        });
      }
    });
  }
});
