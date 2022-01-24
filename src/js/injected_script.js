function injected(accessors, methods) {
  const extensionName = "Ad Radar"
  console.info(`[${extensionName}] script injected!`)

  /**
   * Extracts information from an object, and executes getter functions that don't expect arguments.
   * @param val the object to extract information from
   * @param maxDepth the maximum depth that we will go to in order to extract information
   * @returns {Object} a copy of the given object, but serializable
   */
  function getAllFields(val, maxDepth = 7) {
    function recurse(val, depth, key = "") {
      if (depth >= maxDepth || val === null) {
        return JSON.parse(JSON.stringify(val))
      } else if (typeof val === "function") {
        const obj = { code: val.toString() }
        if (val.length === 0 && key.startsWith("get")) {
          try {
            obj.result = recurse(val(), depth + 1)
          } catch (error) {}
        }
        return obj
      } else if (Array.isArray(val)) {
        return val.map((e) => recurse(e, depth + 1))
      } else if (typeof val === "object") {
        return Object.fromEntries(
          Object.entries(val).map(([k, v]) => [k, recurse(v, depth + 1, k)])
        )
      } else {
        return val
      }
    }

    return recurse(val, 0, "")
  }

  /**
   * A wrapper for messages to be sent to content or background scripts.
   * @param {object} message the message to be sent when it is not malformed
   * @throws {string} when the message is malformed
   */
  function sendMessage(message) {
    if (message?.destination && message?.content) {
      const { hostname } = new URL(window.location.href)
      message["app"] = extensionName
      message[message.content].time = new Date().toISOString()
      message[message.content].hostname = hostname
      window.postMessage(message, "*")
    } else {
      throw `Malformed Ad Radar message`
    }
  }

  /**
   * A wrapper that sends a message with the content of the given bid.
   * @param {object} bid the bid to send
   */
  function sendBid({ extracted, original }) {
    if (extracted.cpm) {
      sendMessage({
        destination: "content",
        content: "bid",
        bid: {
          extracted: {
            ...extracted,
            outdated: false,
          },
          original,
        },
      })
    }
  }

  /**
   * A wrapper that sends a message with the content of the given slot.
   * @param {object} slot the slot to send
   */
  function sendSlotInfo(slot) {
    sendMessage({
      destination: "content",
      content: "slot",
      slot: slot,
    })
  }

  /**
   * A wrapper that takes a pbjs bid object and sends the relevant fields to the content script.
   * @param {object} bid the pbjs bid object
   * @param {boolean} won extra information regarding whether the bid won or not
   */
  function sendPbjsBid(bid, won) {
    sendBid({
      extracted: {
        unitCode: bid.adUnitCode,
        bidder: bid.bidder,
        cpm: bid.cpm,
        currency: bid.currency,
        won: won,
        lib: "pbjs",
      },
      original: getAllFields(bid),
    })
  }

  /**
   * A wrapper that takes a winning googletag slot/bid object and sends the relevant fields to the content script.
   * @param {object} slot the 'slot' of a slotOnload event
   */
  function sendGoogletagWinningBid(slot) {
    const bid = slot.getTargetingMap()
    sendBid({
      extracted: {
        unitCode: slot.getSlotId().getId(),
        bidder: bid.hb_bidder?.[0],
        cpm: parseFloat(bid.hb_pb?.[0]),
        currency: "USD", // TODO find if actual currency can be different
        won: true,
        lib: "googletag",
      },
      original: getAllFields(slot),
    })
  }

  /**
   * A wrapper that takes a winning apstag bid object and sends the relevant fields to the content script.
   * @param {object} bid the 3rd argument of apstag.renderImp
   */
  function sendApstagWinningBid(bid) {
    sendBid({
      extracted: {
        unitCode: bid.kvMap.amznp[0],
        bidder: bid.kvMap.hb_bidder[0],
        cpm: parseFloat(bid.kvMap.hb_pb[0]),
        currency: "USD", // TODO find if actual currency can be different
        won: true,
        lib: "apstag",
      },
      original: getAllFields(bid),
    })
  }

  /**
   * A wrapper that takes a pbjs slot object and sends the relevant fields to the content script.
   * @param {object} slot one ad unit object or an actual pbjs bid
   */
  function sendPbjsSlotInfo(slot) {
    sendSlotInfo({
      id: slot.code,
      unitCode: slot.code,
      lib: "pbjs",
    })
  }

  /**
   * A wrapper that takes a googletag slot object and sends the relevant fields to the content script.
   * If all slot unitPaths are unique, they are used as unitCode, otherwise the slot id is used.
   * @param {object} slot the 'slot' of a slotResponseReceived or slotOnload event
   */
  function sendGoogletagSlotInfo(slot) {
    const paths = window.googletag
      .pubads()
      .getSlots()
      .map((s) => s.getAdUnitPath())
    const nDistinctPaths = new Set(paths).size
    sendSlotInfo({
      id: slot.getSlotElementId(),
      unitCode:
        paths.length === nDistinctPaths
          ? slot.getAdUnitPath()
          : slot.getSlotId().getId(),
      lib: "googletag",
    })
  }

  /**
   * A wrapper that takes an apstag slot object and sends the relevant fields to the content script.
   * @param {object} slot the object given to the callback of apstag.fetchBids
   */
  function sendApstagSlotInfo(slot) {
    sendSlotInfo({
      id: slot.slotID,
      unitCode: slot.amznp ?? slot.targeting.amznp,
      lib: "apstag",
      extra: slot.targeting,
    })
  }

  // For each library, specify a condition function that should be verified when applied to its object
  const conditionsToVerify = {
    pbjs: (obj) => obj.getBidResponses && obj.getAllWinningBids,
    googletag: (obj) => obj.pubads?.()?.getSlots,
    apstag: (obj) => obj._getSlotIdToNameMapping,
  }

  /**
   * Searches the current window for a variable whose name contains some string and that verifies some conditions.
   * @param {string} libName the name of the object we are looking for
   * @returns {object} the object when it is found
   * @throws {string} when the object is not found
   */
  function findLibraryObject(libName) {
    // Regex matching a string containing the name of the library (or variations)
    const re = new RegExp(`[\s\S]*${libName}[\s\S]*`)
    // Get all variable names in window, and keep those matching regex and verifying the properties function
    const candidates = Object.keys(window).filter(
      (varName) =>
        re.test(varName) && conditionsToVerify[libName](window[varName])
    )
    // Return a variable when at least one candidate is found, otherwise throw an error
    if (candidates.length > 0) {
      return window[candidates[0]]
    } else {
      throw `${libName} not found`
    }
  }

  /**
   * Listen to the given library's hooks and events in order to retrieve ad information.
   * @param {string} libName the name of the library we are instrumenting
   */
  function instrumentLibrary(libName) {
    if (libName === "pbjs") {
      window.pbjs.adUnits.forEach((unit) => sendPbjsSlotInfo(unit))
      window.pbjs.onEvent("bidResponse", (bid) => sendPbjsBid(bid, false))
      window.pbjs.onEvent("bidWon", (bid) => sendPbjsBid(bid, true))
      window.pbjs.onEvent("addAdUnits", () =>
        window.pbjs.adUnits.forEach((unit) => sendPbjsSlotInfo(unit))
      )
    } else if (libName === "googletag") {
      window.googletag
        .pubads()
        .addEventListener("slotResponseReceived", (event) =>
          sendGoogletagSlotInfo(event.slot)
        )
      window.googletag.pubads().addEventListener("slotOnload", (event) => {
        sendGoogletagSlotInfo(event.slot)
        sendGoogletagWinningBid(event.slot)
      })
    } else if (libName === "apstag") {
      const original_fetchBids = window.apstag.fetchBids
      window.apstag.fetchBids = function (cfg, callback) {
        const new_callback = (bids, info) => {
          bids.forEach((bid) => sendApstagSlotInfo(bid))
          return callback(bids, info)
        }
        return original_fetchBids(cfg, new_callback)
      }
      const original_renderImp = window.apstag.renderImp
      window.apstag.renderImp = function () {
        if (arguments[2]) {
          sendApstagWinningBid(arguments[2])
        }
        return original_renderImp(...arguments)
      }
    }
  }

  /**
   * Creates an interval to search for a library in the current window, and then instrument it if found.
   * @param {string} lib the name of the library to search for and to instrument if found
   * @returns {number} the number of the created interval
   */
  function createSearchAndInstrumentInterval(lib) {
    const intervalTimeout = 2
    const interval = setInterval(() => {
      try {
        window[lib] = findLibraryObject(lib)
        console.info(`[${extensionName}] found ${lib}`)
        clearInterval(interval)
        instrumentLibrary(lib)
      } catch (error) {}
    }, intervalTimeout)
    return interval
  }

  /**
   * This function sets a timeout to stop searching for libraries after {delay} milliseconds.
   */
  function stopSearchingLibrariesSoon() {
    const delay = 2000
    setTimeout(() => {
      searchIntervals.forEach((interval) => clearInterval(interval))
      console.info(`[${extensionName}] stopped searching for libraries !`)
    }, delay)
  }

  // Start searching for the libraries that we rely on
  const librariesOfInterest = ["pbjs", "googletag", "apstag"]
  const searchIntervals = librariesOfInterest.map((lib) =>
    createSearchAndInstrumentInterval(lib)
  )
  console.info(`[${extensionName}] started searching for libraries !`)

  // If some of the needed libraries are not yet available once the page finished loading,
  // then we have no hope of finding them so we stop looking.
  if (document.readyState === "complete") {
    stopSearchingLibrariesSoon()
  } else {
    window.addEventListener("load", stopSearchingLibrariesSoon)
  }
}
