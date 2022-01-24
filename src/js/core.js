const extensionName = "Ad Radar"
// Makes the extension compatible with Chrome
if (typeof browser === "undefined") {
  var browser = chrome
}

const librariesOfInterest = ["pbjs", "googletag", "apstag"]
const requiredFields = ["bidder", "cpm", "currency", "unitCode", "won"]
const bannerClass = "hestia-ad-radar-banner"
function bannerHTML(bannerText, iframeWidth) {
  return `
    <div class='${bannerClass}' style='all: unset display: table text-align: center margin: 0 auto min-width: ${iframeWidth}'>
      <p style='all: unset background-color: red color: black display: inline-block margin: auto line-height: normal font-size: medium height: auto width: 100%'>
        ${bannerText}
        <a href='https://github.com/hestiaAI/ad-radar/blob/main/README.md#understanding-the-banners'>[?]</a>
      </p>
    </div>
    `
}

function winningBidText(bid) {
  return `CPM of ${bid.cpm.toFixed(3)} ${bid.currency} paid via ${bid.bidder}`
}

function nonWinningBidText(bid) {
  return `CPM of at least ${bid.cpm.toFixed(3)} ${bid.currency}`
}

const TEXT_NO_INFORMATION = "No information found for this ad"

const TIME_TO_OUTDATE_BID_MS = 2000

const accessorEngine = {
  constant(value) {
    return (object) => value
  },
  getAttribute(name) {
    return (object) => object[name]
  },
  tryGetAttribute(name) {
    return (object) => object?.[name]
  },
  callMethod(name) {
    return (object) => object[name]()
  },
  applyFunction(name) {
    return (object) => window[name](object)
  }
}
const validAccessorKeys = new Set(Object.keys(accessorEngine) + ["then"])

function validateAccessor(accessor) {}

async function initAds() {
  return await browser.storage.local.set({ ads: [] })
}

async function initAccessors() {
  return await browser.storage.local.set(initialAccessors)
}
