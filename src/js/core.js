// Makes the extension compatible with Chrome
if (typeof browser === 'undefined') {
  var browser = chrome;
}

/**
 * A Map where values are collections and getting a non-existing key returns an empty collection.
 * @returns {Map<any, Iterable<any>>}
 * @constructor creates an empty map
 */
class MapWithCollectionValues {
  constructor() {
    this.map = new Map();
  }
  emptyElement() {
    throw new Error('emptyElement not implemented');
  }
  addOperation(collection, element) {
    throw new Error('addOperation not implemented');
  }
  get(key) {
    return this.map.has(key) ? this.map.get(key) : this.emptyElement();
  }
  add(key, value) {
    this.map.set(key, this.addOperation(this.get(key), value));
  }
  set(key, values) {
    this.map.set(key, values);
  }
  entries() {
    return [...this.map.entries()];
  }
  keys () {
    return [...this.map.keys()];
  }
  values() {
    return [...this.map.values()];
  }
  mapValues(key, func) {
    this.set(key, this.get(key).map(func));
  }
}

/**
 * A Map where values are sets and getting a non-existing key returns an empty set.
 * @returns {Map<any, Set<any>>}
 * @constructor creates an empty map
 */
class MapWithSetValues extends MapWithCollectionValues {
  constructor() {
    super();
  }
  emptyElement() {
    return new Set();
  }
  addOperation(set, element) {
    return set.add(element);
  }
}

/**
 * A Map where values are arrays and getting a non-existing key returns an empty array.
 * @returns {Map<any, Array<any>>}
 * @constructor creates an empty map
 */
class MapWithArrayValues extends MapWithCollectionValues {
  constructor() {
    super();
  }
  emptyElement() {
    return [];
  }
  addOperation(array, element) {
    return array.concat([element]);
  }
}


function bannerHTML(bannerText, iframeWidth) {
  return `
    <div class='${bannerClass}' style='all: unset; display: table; text-align: center; margin: 0 auto; min-width: ${iframeWidth}'>
      <p style='all: unset; background-color: red; color: black; display: inline-block; margin: auto; line-height: normal; font-size: medium; height: auto; width: 100%'>
        ${bannerText}
        <a href='https://github.com/hestiaAI/my-worth-extension/blob/main/README.md#understanding-the-banners'>[?]</a>
      </p>
    </div>
    `;
}


let bannerClass = 'my-worth-ad-information';

let winningBidText = (winner) => `CPM of ${(winner.cpm).toFixed(3)} ${winner.currency} paid via ${winner.bidder}`;
let nonWinningBidText = (bid) => `CPM of at least ${(bid.cpm).toFixed(3)} ${bid.currency}`;
let TEXT_NO_INFORMATION = 'No information found for this ad';let extensionName = 'MyWorth';

let TIME_TO_OUTDATE_BID_MS = 2000;


function initData() {
  browser.storage.local.set({'ads': []})
}