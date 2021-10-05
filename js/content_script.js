let extensionName = 'MyWorth';
let bannerClass = 'my-worth-ad-information';

// Makes the extension compatible with Chrome
if (typeof browser === 'undefined') {
  var browser = chrome;
}

// Injects the function 'injected' from the injected_script.js into the environment of the main page
let script = document.createElement('script');
script.appendChild(document.createTextNode('(' + injected + ')();'));
(document.body || document.head || document.documentElement).appendChild(script);


window.addEventListener('message', (message) => {
  let data = message.data;
  if (data !== null && typeof data === 'object' && data.app === extensionName) {
    // relays messages from the main execution environment to the background script
    if (data.destination === 'background') {
      browser.runtime.sendMessage(message.data);
    } else if (data.destination === 'content') {
      // catches the message with pbjs and googletag data and tries to show ad banners
      if (data.type === 'ad-data') {
        try {
          showMyWorth(data);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
});

browser.runtime.onMessage.addListener((data) => {
  if (data !== null && typeof data === 'object' && data.app === extensionName) {
    // Relays messages from the background execution environment to the injected script
    if (data.destination === 'injected') {
      window.postMessage(data, '*');
    }
  }
});


/**
 * The main function of the extension.
 * From the found pbjs / googletag data, finds the DOM elements that contain the ads,
 * and add banners that show information about the ads' prices.
 * @param {object} adData - object containing fields adUnits, adUnitToSlotId, allPrebids, winningPrebids
 */
function showMyWorth(adData) {
  let adDivs = findAdUnitDivs(adData);
  // remove any previously added banners
  document.querySelectorAll(`.${bannerClass}`).forEach(banner => banner.remove());
  let numberOfAds = addAdBanners(adDivs, adData);

  browser.runtime.sendMessage({
    app: extensionName,
    destination: 'background',
    type: 'result',
    numberOfAds: numberOfAds
  });
}

/**
 * Returns an object with the DOM elements associated to the ad units found in the data.
 * Note that this function does not always find the dom element corresponding to a particular ad unit code.
 * @param {object} adData - object containing fields adUnits, adUnitToSlotId, allPrebids, winningPrebids
 * @return {object} a mapping from adUnitCode to DOM element
 */
function findAdUnitDivs(adData) {
  return Object.fromEntries(
    adData.adUnits.flatMap(adUnitCode => {
      // First search for a node whose id contains the ad unit code
      let nodes = document.querySelectorAll(`[id*='${adUnitCode}']`);
      if (nodes.length === 1) {
        return [[adUnitCode, nodes[0]]];
      }
      // Then search for a node whose id matches exactly the googletag slot id
      if (adUnitCode in adData.adUnitToSlotId) {
        let divId = adData.adUnitToSlotId[adUnitCode];
        nodes = document.querySelectorAll(`[id='${divId}']`);
        if (nodes.length === 1) {
          return [[adUnitCode, nodes[0]]];
        }
      }
      return [];
    })
  );
}


/**
 * Modifies the DOM by adding a red banner above ads, indicating the price paid for an ad, or a lower bound estimate.
 * @param {object} adDivs - an object mapping adUnitCode to DOM element
 * @param {object} adData - object containing fields adUnits, adUnitToSlotId, allPrebids, winningPrebids
 * @return {number} number of ads banners that were injected into the page
 */
function addAdBanners(adDivs, adData) {
  let numberOfAds = 0;
  Object.keys(adDivs).forEach((adUnitCode, i) => {
    // We look for the div immediately parent to the ad iframe
    let div = adDivs[adUnitCode]; if (div === null) return;
    let adIframe = div.querySelector('iframe'); if (adIframe === null) return;
    let adDiv = adIframe.parentNode;

    // We choose the text to show based on the information we have available
    let bannerText = '';
    if (adUnitCode in adData.winningPrebids) {
      let winningBid = adData.winningPrebids[adUnitCode];
      bannerText = `CPM of ${(winningBid.cpm).toFixed(4)} ${winningBid.currency} paid via ${winningBid.bidder}`;
    } else if (adUnitCode in adData.allPrebids) {
      let bidToShow = (numberOfCurrencies(adData.allPrebids[adUnitCode].bids) > 1) ?
        adData.allPrebids[adUnitCode].bids[0] : // show first bid for this ad if the currencies are not comparable
        adData.allPrebids[adUnitCode].bids.reduce((prev, curr) => (prev.cpm > curr.cpm) ? prev : curr); // show the ad with the highest bid (albeit not winner)
      bannerText = `CPM of at least ${(bidToShow.cpm).toFixed(4)} ${bidToShow.currency}`;
    } else {
      bannerText = 'No information';
    }

    // We insert the red banner and its text inside the div containing the iframe ad
    adDiv.insertAdjacentHTML('afterbegin', `
    <div class='${bannerClass}' style='all: unset; text-color: black; text-align:center; width: ${adIframe.width};'>
      <p style='background-color: red; line-height: normal;'>
        ${bannerText}
        <a href='https://github.com/hestiaAI/my-worth-extension/blob/main/README.md#understanding-the-banners'>[?]</a>
      </p>
    </div>
    `);
    Object.assign(adDiv.style, {
      'height': 'auto',
      'display': adDiv.style.display === 'none' ? null : adDiv.style.display // TODO check if this makes sense ? sometimes an ad div will have display:none although an ad is there
    });
    numberOfAds++;
  });
  return numberOfAds;
}

/**
 * Counts the number of different currencies amongst the given array of bids.
 * @param  {[object]} bids - an array of bids (e.g. one entry of pbjs.getAllPrebidWinningBids())
 * @return {number} the number of distinct currencies
 */
function numberOfCurrencies(bids) {
  return bids.reduce((set, bid) => set.add(bid.currency), new Set()).size;
}
