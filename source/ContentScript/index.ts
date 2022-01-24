import {browser} from 'webextension-polyfill-ts';
import {EXTENSION_NAME, TIME_TO_OUTDATE_BID_MS} from '../Core';
import {injected} from '../Core/injected';
import {
  MapWithArrayValues,
  MapWithSetValues,
} from '../Core/map-with-collection';
import {Bid} from '../Core/types';
import {
  BANNER_CLASS,
  htmlBanner,
  makeNonWinningBidText,
  makeWinningBidText,
  noInformationText,
} from '../Core/banner';

// Injects the function 'injected' from the injected_script.js into the environment of the main page
const script = document.createElement('script');
script.appendChild(document.createTextNode(`(${injected})()`));
(document.body || document.head || document.documentElement).appendChild(
  script
);

// We store the information retrieved from the injected script here
const id2units = new MapWithSetValues<string, string>();
const unit2bids = new MapWithArrayValues<string, Bid>();

/**
 * Given a string that potentially matches the id of some div, searches inside the div for an iframe with an ad inside,
 * and returns the id of the div parent to this iframe.
 * @param {string} id the id of some div
 * @returns {string} the id of the parent of the iframe inside the id parameter
 */
function findIframeParentIdInDiv(id: string): string {
  return document.getElementById(id)?.querySelector('iframe')?.parentNode?.id;
}

/**
 * Modifies the DOM by adding a red banner above the ad inside the div with this id,
 * indicating the price paid for an ad, or a lower bound estimate.
 * Then, sends the number of ads banners that were injected into the page to the background script.
 * @param {string} id the identifier of the div to show information for
 */
function showBanner(id: string): void {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const units = id2units.get(id);

  const adDiv = document.getElementById(id);
  const adIframe = adDiv?.querySelector('iframe');
  if (!adDiv || !adIframe) {
    return;
  }

  // Remove previously added banners
  adDiv
    .querySelectorAll(`.${BANNER_CLASS}`)
    .forEach((banner) => banner.remove());

  // Retrieve all bids associated to units for this div id
  const allBids: Bid[] = Array.from(units).flatMap((unitCode) =>
    unit2bids.get(unitCode).filter((bid: Bid) => bid.cpm && !bid.outdated)
  );
  const winningBids = allBids.filter((bid: Bid) => bid.won);

  // We choose the text to show based on the information we have available
  let bannerText = '';
  if (winningBids.length > 0) {
    // Sort bids from most recent to least recent
    winningBids.sort((a: Bid, b: Bid) => b.time - a.time);
    bannerText = makeWinningBidText(winningBids[0]);
  } else if (allBids.length > 0) {
    const numberOfCurrencies = allBids.reduce(
      (set, bid) => set.add(bid.currency),
      new Set()
    ).size;
    const bidToShow: Bid =
      numberOfCurrencies > 1
        ? allBids[0] // show first bid for this ad if the currencies are not comparable
        : allBids.reduce((prev: Bid, curr: Bid) =>
            prev.cpm > curr.cpm ? prev : curr
          ); // show the ad with the highest bid (albeit not winner)
    bannerText = makeNonWinningBidText(bidToShow);
  } else {
    bannerText = noInformationText();
  }

  // We insert the red banner and its text inside the div containing the iframe ad
  const iframeWidth = adIframe.style.width
    ? adIframe.style.width
    : `${adIframe.width}px`;
  adDiv.insertAdjacentHTML('afterbegin', htmlBanner(bannerText, iframeWidth));
  Object.assign(adDiv.style, {height: 'auto'});

  // Inform the extension of the number of detected ads
  browser.runtime.sendMessage({
    app: EXTENSION_NAME,
    destination: 'background',
    content: 'numberOfAds',
    numberOfAds: document.querySelectorAll(`.${BANNER_CLASS}`).length,
  });
}

/**
 * Tries to find the ad iframe inside the given div, and if found, add slot information to id2units and show banner.
 * @param {string} id the id of the div where we want to look for an ad iframe
 * @param {object} slot the object with slot information
 * @returns {boolean} whether the iframe was found in the div or not
 */
function findIframeInDivAndShowBanner(
  id: string,
  slot: {unitCode: string; id: string}
): boolean {
  const adId = findIframeParentIdInDiv(id);
  if (adId) {
    id2units.add(adId, slot.unitCode);
    id2units.add(adId, slot.id);
    id2units.add(adId, adId);
    showBanner(adId);
    return true;
  }
  return false;
}

// Catches messages coming from the injected script
window.addEventListener('message', (event) => {
  const message = event.data;
  if (message?.app !== EXTENSION_NAME) {
    return;
  }
  if (message.destination === 'content') {
    if (message.content === 'bid') {
      const bidInfo = message.bid.extracted;
      // Outdate old bids from previous auctions for the same slot (as in wired.com)
      unit2bids.mapValues(bidInfo.unitCode, (bid) =>
        bidInfo.time - bid.time > TIME_TO_OUTDATE_BID_MS
          ? {...bid, outdated: true}
          : bid
      );
      unit2bids.add(bidInfo.unitCode, bidInfo);
      id2units.keys().forEach((id) => showBanner(id));

      if (bidInfo.won) {
        browser.runtime.sendMessage({
          ...message,
          destination: 'background',
          content: 'ad',
          ad: message.bid,
        });
      }
    } else if (message.content === 'slot') {
      if (!findIframeInDivAndShowBanner(message.slot.id, message.slot)) {
        const candidates = document.querySelectorAll(
          `[id*='${message.slot.unitCode}']`
        );
        if (candidates?.length === 1) {
          findIframeInDivAndShowBanner(candidates[0].id, message.slot);
        }
      }
    }
  }
});

// Catches messages coming from the background script
browser.runtime.onMessage.addListener((message) => {
  if (
    message?.app === EXTENSION_NAME &&
    message.destination === 'content' &&
    message.type === 'request'
  ) {
    id2units.keys().forEach((id) => showBanner(id));
  }
});
