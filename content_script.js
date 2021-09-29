
// Injects the function sendPbjsFromPageToContent into the environment of the main page.
let injectedScript = document.createElement('script');
injectedScript.appendChild(document.createTextNode('('+ sendPbjsFromPageToContent +')();'));
(document.body || document.head || document.documentElement).appendChild(injectedScript);

/**
 * This function is injected into the main page script,
 * and sends pbjs information to our extension environment.
 */
function sendPbjsFromPageToContent() {
  console.debug('[MyWorth] script injected');
  try { pbjs; } catch (error) {
    console.debug('[MyWorth] pbjs not detected');
    return;
  }
  try { googletag; } catch (error) {
      console.debug('[MyWorth] googletag not detected');
      return;
  }
  pbjs.onEvent('auctionEnd', auction => {
    window.postMessage({
      type: 'pbjs',
      winningPrebids: JSON.parse(JSON.stringify(Object.fromEntries(pbjs.getAllPrebidWinningBids().map(bid => [bid.adUnitCode, bid])))),
      allPrebids: JSON.parse(JSON.stringify(pbjs.getBidResponses())),
      adUnitToDivs: Object.fromEntries(googletag.pubads().getSlots().map(slot => [slot.getAdUnitPath(), slot.getSlotElementId()]))
    });
    console.debug('[MyWorth] pbjs sent');
  });
}

// Our extension listens to the incoming messages and catches the pbjs one.
window.addEventListener('message', (event) => {
  let data = event.data;
  if (typeof data === 'object' && data !== null && data.type === 'pbjs') {
    console.debug('[MyWorth] pbjs received');
    console.debug(data);
    try {
      showAdPrices(data.adUnitToDivs, data.allPrebids, data.winningPrebids);
    }
    catch (error) {
      console.error(error);
    }
  }
});


/**
 * The main function of the extension.
 * From the pbjs data, finds the DOM elements that contain the ads,
 * and add banners that show information about the ads' prices.
 * @param {[type]} adUnitToDivs   - optional mapping of adUnitCode to div id
 * @param {[type]} allPrebids     - the result of pbjs.getBidResponses()
 * @param {[type]} winningPrebids - the result of pbjs.getAllPrebidWinningBids() but in the same format as allPrebids
 */
function showAdPrices(adUnitToDivs, allPrebids, winningPrebids) {
  let adDivs = findDivsForAdUnits(adUnitToDivs);
  addAdBanners(adDivs, allPrebids, winningPrebids);
}


/**
 * Returns an object with the divs associated to the given ad units.
 * @param  {[type]} adUnitToDivs - optional mapping of adUnitCode to div id
 * @return {[type]} an object mapping adUnitCode to DOM element
 */
function findDivsForAdUnits(adUnitToDivs) {
  let adDivs = {};
  Object.keys(adUnitToDivs).forEach((adUnitCode, i) => {
    let div = document.getElementById(adUnitToDivs[adUnitCode])
    if (div != null) {
      adDivs[adUnitCode] = div;
    }
  });
  console.debug(`[MyWorth] found ${Object.keys(adDivs).length} / ${Object.keys(adUnitToDivs).length} ad slots.`)
  console.debug(adDivs);

  return adDivs;
}


/**
 * Modifies the DOM by adding a red banner on top of ads,
 * indicating the price paid for an ad, or a lower bound estimate.
 * @param {[type]} adSlots        - an object mapping adUnitCode to DOM element
 * @param {[type]} allPrebids     - the result of pbjs.getBidResponses()
 * @param {[type]} winningPrebids - the result of pbjs.getAllPrebidWinningBids() but in the same format as allPrebids
 */
function addAdBanners(adDivs, allPrebids, winningPrebids) {
  Object.keys(adDivs).forEach((adUnitCode, i) => {
    let div = adDivs[adUnitCode];
    if (div == null) {
      console.debug(`[MyWorth] ${adUnitCode} div not found`);
      return;
    }
    let adIframe = div.querySelector('iframe');
    if (adIframe == null) {
      console.debug(`[MyWorth] ${adUnitCode} iframe not found`);
      return;
    }
    let adDiv = adIframe.parentNode;

    let bannerDiv = document.createElement('div');
    bannerDiv.style = 'background-color: red;';

    let winningBid = winningPrebids[adUnitCode];
    if (winningBid) {
      bannerDiv.innerHTML = `<p>CPM of ${(winningBid.cpm).toFixed(4)} ${winningBid.currency} paid via ${winningBid.bidder}</p>`;
    }
    else if (allPrebids[adUnitCode]) {
      let bidToShow = (numberOfCurrencies(allPrebids[adUnitCode].bids) > 1)
        ? allPrebids[adUnitCode].bids[0]
        : allPrebids[adUnitCode].bids.reduce((prev, curr) => (prev.cpm > curr.cpm) ? prev : curr);

      bannerDiv.innerHTML = `<p>CPM of at least ${(bidToShow.cpm).toFixed(4)} ${bidToShow.currency}</p>`;
    }
    else {
      bannerDiv.innerHTML = `<p>No information</p>`;
    }

    adDiv.prepend(bannerDiv);
    Object.assign(adDiv.style, {'height': 'auto'});
  });
}

/**
 * Counts the number of different currencies amongst the given array of bids.
 * @param  {[type]} bids - an array of bids (e.g. one entry of pbjs.getAllPrebidWinningBids())
 * @return {[type]} an integer, the number of distinct currencies
 */
function numberOfCurrencies(bids) {
  return bids.reduce(
    (set, bid) => set.add(bid.currency),
    new Set()
  ).size;
}
