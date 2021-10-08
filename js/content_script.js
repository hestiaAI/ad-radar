// Injects the function 'injected' from the injected_script.js into the environment of the main page
let script = document.createElement('script');
script.appendChild(document.createTextNode('(' + injected + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);


// We store the information retrieved from the injected script here
let id2units = new MapWithSetValues();
let unit2bids = new MapWithSetValues();

// Catches messages coming from the injected script
window.addEventListener('message', (event) => {
  let message = event.data;
  if (message?.app !== extensionName) return;
  if (message.destination === 'content') {
    let actionFor = {
      bid: () => unit2bids.add(message.bid.adUnitCode, message.bid),
      adUnits: () => message.adUnits.forEach(code => unit2bids.add(code, {adUnitCode: code})),
      slot: () => {
        let div = document.getElementById(message.slot.id);
        if (div) {
          id2units.add(message.slot.id, message.slot.unitCode);
        }
        else {
          let nodes = document.querySelectorAll(`[id*='${message.slot.unitCode}']`);
          if (nodes.length === 1) {
            id2units.add(nodes[0].id, message.slot.unitCode);
          }
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
  id2units.keys().forEach((id) => {
    // We look for the div immediately parent to the ad iframe
    let adIframe = document.getElementById(id).querySelector('iframe');
    let adDiv = adIframe?.parentNode;
    if (!adDiv) return;

    let allBids = [...id2units.get(id)].flatMap(adUnitCode => [...unit2bids.get(adUnitCode)].filter(bid => bid.cpm));
    let winningBids = allBids.filter(bid => bid.won);

    console.debug(`[My Worth] all bids for slot with id ${id}`);

    // We choose the text to show based on the information we have available
    let bannerText = '';
    if (winningBids.length > 0) {
      winningBids.sort((a, b) => a.time > b.time ? 1 : -1);
      let winner = winningBids[0];
      bannerText = `CPM of ${(winner.cpm).toFixed(3)} ${winner.currency} paid via ${winner.bidder}`;
    }
    else if (allBids.length > 0) {
      let numberOfCurrencies = allBids.reduce((set, bid) => set.add(bid.currency), new Set()).size;
      let bidToShow = (numberOfCurrencies > 1) ?
        allBids[0] : // show first bid for this ad if the currencies are not comparable
        allBids.reduce((prev, curr) => (prev.cpm > curr.cpm) ? prev : curr); // show the ad with the highest bid (albeit not winner)
      bannerText = `CPM of at least ${(bidToShow.cpm).toFixed(4)} ${bidToShow.currency}`;
    }
    else bannerText = 'No information';

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
