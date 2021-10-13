// Injects the function 'injected' from the injected_script.js into the environment of the main page
let script = document.createElement('script');
script.appendChild(document.createTextNode('(' + injected + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);

/**
 * Given a string that potentially matches the id of some div, searches inside the div for an iframe with an ad inside,
 * and returns the id of the div parent to this iframe.
 * @param {string} id the id of some div
 * @returns {string} the id of the parent of the iframe inside the id parameter
 */
function findIframeParentIdInDiv(id) {
  return document.getElementById(id)?.querySelector('iframe')?.parentNode?.id;
}

/**
 * Tries to find the ad iframe inside the given div, and if found, add slot information to id2units and show worth.
 * @param {string} id the id of the div where we want to look for an ad iframe
 * @param {object} slot the object with slot information
 * @returns {boolean} whether the iframe was found in the div or not
 */
function findIframeInDivAndShowMyWorth(id, slot) {
  let adId = findIframeParentIdInDiv(id);
  if (adId) {
    id2units.add(adId, slot.unitCode);
    id2units.add(adId, slot.id);
    id2units.add(adId, adId);
    showMyWorth(adId);
    return true;
  }
  return false;
}

/**
 * Modifies the DOM by adding a red banner above the ad inside the div with this id,
 * indicating the price paid for an ad, or a lower bound estimate.
 * Then, sends the number of ads banners that were injected into the page to the background script.
 * @param {string} id the identifier of the div to show information for
 */
function showMyWorth(id) {
  let units = id2units.get(id);

  let adDiv = document.getElementById(id);
  let adIframe = adDiv.querySelector('iframe');
  if (adIframe === null) return;

  // Remove previously added banners
  adDiv.querySelectorAll(`.${bannerClass}`).forEach(banner => banner.remove());

  // Retrieve all bids associated to units for this div id
  let allBids = [...units].flatMap(unitCode => unit2bids.get(unitCode).filter(bid => bid.cpm && !bid.outdated));
  let winningBids = allBids.filter(bid => bid.won);

  // We choose the text to show based on the information we have available
  let bannerText = '';
  if (winningBids.length > 0) {
    // Sort bids from most recent to least recent
    winningBids.sort((a, b) => b.time - a.time);
    bannerText = winningBidText(winningBids[0]);
  }
  else if (allBids.length > 0) {
    let numberOfCurrencies = allBids.reduce((set, bid) => set.add(bid.currency), new Set()).size;
    let bidToShow = (numberOfCurrencies > 1) ?
      allBids[0] : // show first bid for this ad if the currencies are not comparable
      allBids.reduce((prev, curr) => (prev.cpm > curr.cpm) ? prev : curr); // show the ad with the highest bid (albeit not winner)
    bannerText = nonWinningBidText(bidToShow);
  }
  else bannerText = TEXT_NO_INFORMATION;

  // We insert the red banner and its text inside the div containing the iframe ad
  let iframeWidth = adIframe.style.width ? adIframe.style.width : `${adIframe.width}px`;
  adDiv.insertAdjacentHTML('afterbegin', bannerHTML(bannerText, iframeWidth));
  Object.assign(adDiv.style, {'height': 'auto'});

  // Inform the extension of the number of detected ads
  browser.runtime.sendMessage({
    app: extensionName,
    destination: 'background',
    type: 'result',
    numberOfAds: document.querySelectorAll(`.${bannerClass}`).length
  });
}

// We store the information retrieved from the injected script here
let id2units = new MapWithSetValues();
let unit2bids = new MapWithArrayValues();

// Catches messages coming from the injected script
window.addEventListener('message', (event) => {
  let message = event.data;
  if (message?.app !== extensionName) return;
  if (message.destination === 'content') {
    let actionFor = {
      bid: () => {
        // Outdates old bids from previous auctions for the same slot (as in wired.com)
        unit2bids.mapValues(message.bid.unitCode,
          bid => message.bid.time - bid.time > TIME_TO_OUTDATE_BID_MS ? {...bid, outdated: true} : bid
        );
        unit2bids.add(message.bid.unitCode, message.bid);
        id2units.keys().forEach(id => showMyWorth(id));
      },
      slot: () => {
        if (!findIframeInDivAndShowMyWorth(message.slot.id, message.slot)) {
          let candidates = document.querySelectorAll(`[id*='${message.slot.unitCode}']`);
          if (candidates?.length === 1) {
            findIframeInDivAndShowMyWorth(candidates[0].id, message.slot);
          }
        }
      }
    };
    actionFor[message.content]();
  }
});

// Catches messages coming from the background script
browser.runtime.onMessage.addListener((message) => {
  if (message?.app === extensionName && message.destination === 'content' && message.type === 'request') {
    id2units.keys().forEach(id => showMyWorth(id));
  }
});

