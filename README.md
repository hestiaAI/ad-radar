# My Worth - Browser extension

## About
My Worth is a browser extension that allows you to better understand how advertisers target you and how much they are willing to pay for you to see their ad.

## How does My Worth work?
My Worth relies on an Ad Tech technology known as *Header Bidding*.

Usually, when you go to a webpage that displays ads, the ads that are shown to you are determined almost instantaneously through a real time auction, and **your personal data is used by the advertisers** to determine how much they are willing to pay for a particular ad impression.
Most of the time, this auction for your attention takes place outside of the browser, in a network of complicated Ad Tech entities such as Supply Side Platforms, Ad Exchanges, and Demand Side Platforms.
The only thing that the browser sees are the ads that won the auction, and we can't really know how much a particular ad impression cost.

With *Header Bidding*, an auction for the different ad spaces of the webpage also take place in real time, but all the bids coming from the advertisers are gathered in the browser.
In this case, My Worth can observe the bids that were received for each ad space, and display the value of these bids.

My Worth checks if the visited webpage uses an open-source library called *Prebid.js* (often imported as `pbjs`) that implements Header Bidding, and thus only works on webpages that do.

## Installation
Download the files of this repository into a folder called `My Worth`.

The next steps are depend on your web browser:
### Mozilla Firefox
Go to `Settings (upper right) > Extensions & Themes (bottom left) > Tools for all add-ons (upper right) > Load Temporary Add-on` and choose the file `My Worth/manifest.json`.
Note that My Worth will be uninstalled whenever you close the browser.
### Google Chrome
Go to `Settings (upper right) > Extensions (bottom left)`.
Activate developer mode by clicking on `Developer mode (upper right)`.
Click on `Load unpacked` and select the `My Worth` folder.

To uninstall My Worth, on the installation screen, click `Remove` under `My Worth`.


## How to use My Worth
0. If you have an ad blocker, deactivate it temporarily
1. Go to one of the webpages in our [list of compatible webpages](##list-of-compatible-webpages)
2. Wait for the page and its ads to finish loading
3. If the extension icon shows a green exclamation mark, click on it
4. My Worth shows a red banner next to the ads that it detected and show the prices that were paid for them


## List of compatible webpages
Our browser extension is known to work on the following webpages:

### International
- https://espn.com
- https://cnn.com
- https://accuweather.com

### Switzerland
- https://20min.ch
- https://blick.ch
- https://ricardo.ch
- https://tutti.ch
- https://autoscout24.ch
- https://bluewin.ch

### France
- https://latribune.fr
- https://telestar.fr
- https://valeursactuelles.com
- https://varmatin.com
- https://ledauphine.com
- https://vosgesmatin.fr

### Belgium
- https://standaard.be
- https://levif.be

### Finland
- https://aamuposti.fi
- https://kraatti.fi
- https://esaimaa.fi
- https://forssanlehti.fi
- https://hs.fi
- https://hameensanomat.fi
- https://iltalehti.fi
- https://ita-savo.fi
- https://kouvolansanomat.fi
- https://loviisansanomat.fi
- https://lansi-savo.fi
- https://maaseuduntulevaisuus.fi
- https://savonsanomat.fi
- https://is.fi
- https://uusisuomi.fi
- https://uusimaa.fi


## License
My Worth is under the GNU Affero General Public License.
