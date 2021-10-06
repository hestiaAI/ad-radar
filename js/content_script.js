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

// We stock the information retrieved from the injected script here
let allBids = {};
let winningBids = {};
let adUnitPathToId = {};
let adUnits = new Set();

// Catches messages coming from the injected script
window.addEventListener('message', (message) => {
  let data = message.data;
  if (data?.app !== extensionName) return;
  if (data.destination === 'content') {
    if (data.content === 'bid') {
      if (data.bid.adUnitCode in allBids) allBids[data.bid.adUnitCode].push(data.bid);
      else allBids[data.bid.adUnitCode] = [data.bid];
      if (data.type === 'winningBid') {
        winningBids[data.bid.adUnitCode] = data.bid;
      }
    }
    else if (data.content === 'adUnits') {
      adUnits = new Set(data.adUnits);
    }
    else if (data.content === 'slot') {
      adUnitPathToId[data.slot.adUnitPath] = data.slot.id;
    }
    showMyWorth();
  }
  // relays messages from the main execution environment to the background script
  else if (data.destination === 'background') {
    browser.runtime.sendMessage(message.data);
  }
});

// Catches messages coming from the background script
browser.runtime.onMessage.addListener((data) => {
  if (data?.app === extensionName) {
    // Relays messages from the background execution environment to the injected script
    if (data.destination === 'injected') {
      window.postMessage(data, '*');
    }
    else if (data.destination === 'content') {
      if (data.type === 'request') {
        showMyWorth();
      }
    }
  }
});


/**
 * The main function of the extension.
 * From the found pbjs / googletag data, finds the DOM elements that contain the ads,
 * and add banners that show information about the ads' prices.
 */
function showMyWorth() {
  let adDivs = findAdUnitDivs(allBids, adUnitPathToId, adUnits);
  // remove any previously added banners
  document.querySelectorAll(`.${bannerClass}`).forEach(banner => banner.remove());
  let numberOfAds = addAdBanners(adDivs, allBids, winningBids, adUnitPathToId, adUnits);

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
 * @return {object} a mapping from adUnitCode to DOM element
 */
function findAdUnitDivs(allBids, adUnitPathToId, adUnits) {
  // Combine codes from getBidResponses() and adUnits (either can be empty)
  let adUnitCodes = [...new Set([...adUnits, ...Object.keys(allBids)])];
  return Object.fromEntries(
    adUnitCodes.flatMap(adUnitCode => {
      // First search for a node whose id contains the ad unit code
      let nodes = document.querySelectorAll(`[id*='${adUnitCode}']`);
      if (nodes.length === 1) {
        return [[adUnitCode, nodes[0]]];
      }
      console.debug(`${adUnitCode}: did not find div with this id`)
      // Then search for a node whose id matches exactly the googletag slot id
      if (adUnitCode in adUnitPathToId) {
        let divId = adUnitPathToId[adUnitCode];
        nodes = document.querySelectorAll(`[id='${divId}']`);
        if (nodes.length === 1) {
          return [[adUnitCode, nodes[0]]];
        }
        console.debug(`${adUnitCode}: did not find div with id ${divId} (${nodes.length} cands)`)
      }
      console.debug(`${adUnitCode}: failed`)
      return [];
    })
  );
}


/**
 * Modifies the DOM by adding a red banner above ads, indicating the price paid for an ad, or a lower bound estimate.
 * @return {number} number of ads banners that were injected into the page
 */
function addAdBanners(adDivs, allBids, winningBids, adUnitPathToId, adUnits) {
  let numberOfAds = 0;
  Object.keys(adDivs).forEach((adUnitCode, i) => {
    // We look for the div immediately parent to the ad iframe
    let adIframe = adDivs[adUnitCode]?.querySelector('iframe');
    let adDiv = adIframe?.parentNode;
    if (!adDiv) return;

    // We choose the text to show based on the information we have available
    let bannerText = '';
    if (adUnitCode in winningBids) {
      let winningBid = winningBids[adUnitCode];
      bannerText = `CPM of ${(winningBid.cpm).toFixed(4)} ${winningBid.currency} paid via ${winningBid.bidder}`;
    }
    else if (adUnitCode in allBids) {
      let bidToShow = (numberOfCurrencies(allBids[adUnitCode]) > 1) ?
        allBids[adUnitCode][0] : // show first bid for this ad if the currencies are not comparable
        allBids[adUnitCode].reduce((prev, curr) => (prev.cpm > curr.cpm) ? prev : curr); // show the ad with the highest bid (albeit not winner)
      bannerText = `CPM of at least ${(bidToShow.cpm).toFixed(4)} ${bidToShow.currency}`;
    }
    else bannerText = 'No information';

    // We insert the red banner and its text inside the div containing the iframe ad
    let iframeWidth = adIframe.style.width ? adIframe.style.width : `${adIframe.width}px`;
    adDiv.insertAdjacentHTML('afterbegin', `
    <div class='${bannerClass}' style='all: unset; display: table; text-align: center; margin: 0 auto; min-width: ${iframeWidth}'>
      <p style='all: unset; background-color: red; color: black; display: inline-block; margin: auto; line-height: normal; font-size: medium; height: auto; width: 100%'>
        ${bannerText}
        <a href='https://github.com/hestiaAI/my-worth-extension/blob/main/README.md#understanding-the-banners'>[?]</a>
      </p>
    </div>
    `);
    Object.assign(adDiv.style, {'height': 'auto'});
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
