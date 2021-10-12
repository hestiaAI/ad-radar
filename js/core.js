let extensionName = 'MyWorth';
let bannerClass = 'my-worth-ad-information';

let TIME_TO_OUTDATE_BID_MS = 2000;

// Makes the extension compatible with Chrome
if (typeof browser === 'undefined') {
  var browser = chrome;
}

/**
 * A pseudo-class similar to Map but where values are sets and getting a non-existing key returns an empty set.
 * @returns {Map<any, Set<any>>}
 * @constructor creates an empty map
 */
class MapWithSetValues {
  constructor() {
    this.map = new Map();
  }
  get(key) {
    return this.map.has(key) ? this.map.get(key) : new Set();
  }
  add(key, value) {
    this.map.set(key, this.get(key).add(value));
  }
  entries() {
    return [...this.map.entries()];
  }
}

/**
 * A pseudo-class similar to Map but where values are arrays and getting a non-existing key returns an empty array.
 * @returns {Map<any, Array<any>>}
 * @constructor creates an empty map
 */
class MapWithArrayValues {
  constructor() {
    this.map = new Map();
  }
  get(key) {
    return this.map.has(key) ? this.map.get(key) : [];
  }
  add(key, value) {
    this.map.set(key, this.get(key).concat([value]));
  }
  set(key, values) {
    this.map.set(key, values);
  }
  mapValues(key, func) {
    this.set(key, this.get(key).map(func));
  }
  entries() {
    return [...this.map.entries()];
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