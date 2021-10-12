// Injects the function 'injected' from the injected_script.js into the environment of the main page
let script = document.createElement('script');
script.appendChild(document.createTextNode('(' + injected + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);


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
        console.debug('[My Worth] received bid');
        console.debug(message.bid);
        unit2bids.mapValues(message.bid.unitCode,
            bid => message.bid.time - bid.time > TIME_TO_OUTDATE_BID_MS ? {...bid, outdated: true} : bid
        );
        unit2bids.add(message.bid.unitCode, message.bid);
      },
      slot: () => {
        console.debug('[My Worth] received slot');
        console.debug(message.slot);
        if (message.slot.id && document.getElementById(message.slot.id) !== null) {
          id2units.add(message.slot.id, message.slot.id);
          id2units.add(message.slot.id, message.slot.unitCode);
          return;
        }
        let candidates = document.querySelectorAll(`[id*='${message.slot.unitCode}']`);
        if (candidates?.length === 1) {
          id2units.add(candidates[0].id, message.slot.unitCode);
        }
      }
    };
    actionFor[message.content]();
    showMyWorth();
  }
});

// Catches messages coming from the background script
browser.runtime.onMessage.addListener((message) => {
  if (message?.app === extensionName && message.destination === 'content' && message.type === 'request') {
    showMyWorth();
  }
});

/**
 * Modifies the DOM by adding a red banner above ads, indicating the price paid for an ad, or a lower bound estimate.
 * Then, sends the number of ads banners that were injected into the page to the background script.
 */
function showMyWorth() {
  // Remove previously added banners
  document.querySelectorAll(`.${bannerClass}`).forEach(banner => banner.remove());

  // Counts the number of ads detected
  let numberOfAds = 0;

  // Ad one banner per detected ad space
  id2units.entries().forEach(([id, units]) => {
    // We look for the div immediately parent to the ad iframe
    let adIframe = document.getElementById(id).querySelector('iframe');
    let adDiv = adIframe?.parentNode;
    if (!adDiv) return;
    if (adDiv.querySelectorAll(`[class=${bannerClass}]`).length > 0) return; // ensures one banner per ad div

    let allBids = [...units].flatMap(unitCode => unit2bids.get(unitCode).filter(bid => bid.cpm && !bid.outdated));
    let winningBids = allBids.filter(bid => bid.won);

    // We choose the text to show based on the information we have available
    let bannerText = '';
    if (winningBids.length > 0) {
      // Sort bids from most recent to least recent
      winningBids.sort((a, b) => b.time - a.time);
      let winner = winningBids[0];
      bannerText = `CPM of ${(winner.cpm).toFixed(3)} ${winner.currency} paid via ${winner.bidder}`;
    }
    else if (allBids.length > 0) {
      let numberOfCurrencies = allBids.reduce((set, bid) => set.add(bid.currency), new Set()).size;
      let bidToShow = (numberOfCurrencies > 1) ?
        allBids[0] : // show first bid for this ad if the currencies are not comparable
        allBids.reduce((prev, curr) => (prev.cpm > curr.cpm) ? prev : curr); // show the ad with the highest bid (albeit not winner)
      bannerText = `CPM of at least ${(bidToShow.cpm).toFixed(3)} ${bidToShow.currency}`;
    }
    else bannerText = 'No information found for this ad';

    // We insert the red banner and its text inside the div containing the iframe ad
    let iframeWidth = adIframe.style.width ? adIframe.style.width : `${adIframe.width}px`;
    adDiv.insertAdjacentHTML('afterbegin', bannerHTML(bannerText, iframeWidth));
    Object.assign(adDiv.style, {'height': 'auto'});

    numberOfAds++;
  });

  // Inform the extension of the number of detected ads
  browser.runtime.sendMessage({
    app: extensionName,
    destination: 'background',
    type: 'result',
    numberOfAds: numberOfAds
  });
}
