import {browser} from 'webextension-polyfill-ts';
import {initialAccessors} from './accessors';

export function initAds(): void {
  browser.storage.local.set({ads: []});
}

export function initAccessors(): void {
  browser.storage.local.set(initialAccessors);
}
