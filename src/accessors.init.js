const initialAccessors = {
  "accessors": {
    "pbjs": {
      "unitCode": {
        "getAttribute": "adUnitCode"
      },
      "bidder": {
        "getAttribute": "bidder"
      },
      "cpm": {
        "getAttribute": "cpm"
      },
      "currency": {
        "getAttribute": "currency"
      },
      "won": null
    },
    "googletag": {
      "unitCode": {
        "callMethod": "getSlotId",
          "then": {
          "callMethod": "getId"
        }
      },
      "bidder": {
        "callMethod": "getTargetingMap",
          "then": {
          "getAttribute": "hb_bidder",
            "then": {
            "tryGetAttribute": 0
          }
        }
      },
      "cpm": {
        "callMethod": "getTargetingMap",
          "then": {
          "getAttribute": "hb_pb",
            "then": {
            "tryGetAttribute": 0,
              "then": {
              "applyFunction": "parseFloat"
            }
          }
        }
      },
      "currency": {
        "constant": "USD"
      },
      "won": {
        "constant": true
      }
    },
    "apstag": {
      "unitCode": {
        "getAttribute": "bid",
          "then": {
          "getAttribute": "kvMap",
            "then": {
            "getAttribute": "amznp",
              "then": {
              "getAttribute": 0
            }
          }
        }
      },
      "bidder": {
        "getAttribute": "bid",
          "then": {
          "getAttribute": "kvMap",
            "then": {
            "getAttribute": "hb_bidder",
              "then": {
              "getAttribute": 0
            }
          }
        }
      },
      "cpm": {
        "getAttribute": "bid",
          "then": {
          "getAttribute": "kvMap",
            "then": {
            "getAttribute": "hb_pb",
              "then": {
              "getAttribute": 0,
                "then": {
                "applyFunction": "parseFloat"
              }
            }
          }
        }
      },
      "currency": {
        "constant": "USD"
      },
      "won": {
        "constant": true
      }
    }
  }
}
