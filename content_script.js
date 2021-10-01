let extensionName = 'MyWorth';
let bannerClass = 'my-worth-ad-information';

// Injects the function 'injected' from the file injected_script.js into the environment of the main page.
let script = document.createElement('script');
script.appendChild(document.createTextNode('(' + injected + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);


window.addEventListener('message', (message) => {
  if (typeof message.data === 'object' && message.data !== null && message.data.app === extensionName) {
    // relays messages from the main execution environment to the background script
    if (message.data.destination === 'background') {
      console.debug('content received message to background');
      browser.runtime.sendMessage(message.data);
      console.debug('content relayed message to background');
    }
    else if (message.data.destination === 'content') {
      // catches the message with pbjs and googletag data
      if (message.data.type === 'ad-data') {
        try {
          showAdPrices(message.data.adUnitToDivs, message.data.allPrebids, message.data.winningPrebids);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
});

browser.runtime.onMessage.addListener((data, sender) => {
  // relays messages from the background execution environment to the injected script
  if (typeof data === 'object' && data !== null && data.app === extensionName) {
    if (data.destination === 'injected') {
      console.debug('content received message to injected');
      window.postMessage(data);
      console.debug('content received message to injected');
      return Promise.resolve('');
    }
  }
  return false;
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
  // remove any previously added banners
  document.querySelectorAll(`.${bannerClass}`).forEach(banner => banner.remove());
  let numberOfAds = addAdBanners(adDivs, allPrebids, winningPrebids);

  browser.runtime.sendMessage({
    app: extensionName,
    destination: 'background',
    type: 'result',
    numberofAds: numberOfAds
  });

  console.debug('content relayed message to injected');
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
  let numberOfAds = 0;
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

    let bannerText = '';

    let winningBid = winningPrebids[adUnitCode];
    if (winningBid) {
      bannerText = `CPM of ${(winningBid.cpm).toFixed(4)} ${winningBid.currency} paid via ${winningBid.bidder}`;
    } else if (allPrebids[adUnitCode]) {
      let bidToShow = (numberOfCurrencies(allPrebids[adUnitCode].bids) > 1) ?
        allPrebids[adUnitCode].bids[0] : // show first bid for this ad if the currencies are not comparable
        allPrebids[adUnitCode].bids.reduce((prev, curr) => (prev.cpm > curr.cpm) ? prev : curr); // show the ad with the highest bid (albeit not winner)

      bannerText = `CPM of at least ${(bidToShow.cpm).toFixed(4)} ${bidToShow.currency}`;
    } else {
      bannerText = `No information`;
    }

    adDiv.insertAdjacentHTML('afterbegin', `
    <div class='${bannerClass}' style='all: unset; text-color: black; text-align:center; width: ${adIframe.width};'>
      <p style='background-color: red;'>${bannerText}</p>
    </div>
    `);
    Object.assign(adDiv.style, {
      'height': 'auto'
    });
    numberOfAds ++;
  });
  return numberOfAds;
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
