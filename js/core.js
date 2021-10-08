let extensionName = 'MyWorth';
let bannerClass = 'my-worth-ad-information';

// Makes the extension compatible with Chrome
if (typeof browser === 'undefined') {
  var browser = chrome;
}
/**
 * A pseudo-class similar to Map but where values are Sets and getting a non-existing key returns an empty set.
 * @returns {Map<any, any>}
 * @constructor
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
  size() {
    return this.map.size;
  }
  keys() {
    return [...this.map.keys()];
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