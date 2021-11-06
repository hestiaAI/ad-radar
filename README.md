# Ad Radar

## About
Ad Radar is a browser extension that allows you to better understand how advertisers target you and how much they are willing to pay for you to see their ad.

## How does Ad Radar work?
Ad Radar relies on an Ad Tech technology known as *Header Bidding*, or *Pre-Bidding*.

Usually, when you go to a webpage that displays ads, the ads that are shown to you are determined almost instantaneously through a real time auction, and **your personal data is used by the advertisers** to determine how much they are willing to pay for a particular ad impression.
This is often called [Real-Time Bidding](https://en.wikipedia.org/wiki/Real-time_bidding).
Most of the time, this auction for your attention takes place outside the browser, in a network of complicated Ad Tech entities such as [Supply Side Platforms](https://en.wikipedia.org/wiki/Supply-side_platform), [Ad Exchanges](https://en.wikipedia.org/wiki/Ad_exchange), and [Demand Side Platforms](https://en.wikipedia.org/wiki/Demand-side_platform).
The only thing that the browser sees are the ads that won the auction, and we can't really know how much a particular ad impression cost.

With *Header Bidding*, an auction for the different ad spaces of the webpage also takes place in real time, but all the bids coming from the advertisers are gathered in the browser.
In this case, Ad Radar can observe the (pre)bids that were received for each ad space, and display the value of these bids.

Ad Radar checks if the visited webpage uses an open-source library called *Prebid.js* (often imported as `pbjs`) that implements Header Bidding, and thus only works on webpages that do.

## Installation
Download the files of this repository into a folder called `Ad Radar`.
To do this, you can go to [`Code > Download ZIP`](https://github.com/hestiaAI/ad-radar/archive/refs/heads/main.zip) and then unzip the file on your computer.

The next steps depend on your web browser:
### Mozilla Firefox
Go to `Settings > Extensions & Themes > Tools for all add-ons > Debug Add-ons > Load Temporary Add-on` and choose the file `Ad Radar/src/manifest.json`.
Note that Ad Radar will be uninstalled whenever you close the browser.
### Google Chrome
Go to `Settings > Extensions`.
Activate developer mode by clicking on `Developer mode`.
Click on `Load unpacked` and select the `Ad Radar/src` folder.

To uninstall Ad Radar, on the installation screen, click `Remove` under `Ad Radar`.


## How to use Ad Radar
First, if you have an ad blocker, consider deactivating it temporarily.
Also, make sure that you can see the icon of the extension on the top bar of your browser (on Chrome, you have to pin the icon).
Then:
1. Go to one of the webpages in our [list of compatible webpages](#list-of-compatible-webpages)
2. Wait for the page and its ads to finish loading
3. Ad Radar shows:
   1. a red banner next to the ads that it detected and show the prices that were paid for them
   2. the number of detected ads on the icon of the extension

## Understanding the banners
Ad Radar shows a red banner next to the ads that it detected, showing the cost of the ad in CPM (cost per mille, e.g. the price paid for a thousand impressions).

There are 3 possibilities when Ad Radar detects an ad:
1. Ad Radar couldn't find any information about the ad cost. The banner shows `No information found for this ad`.
2. Ad Radar observed the prebid that won the auction for this ad space and knows exactly how much was paid, and through which advertiser network. The banner shows `CPM of {price} paid via {network}`.
3. Ad Radar observed prebids but the auction was won through another ad channel, so it retrieves the prebid with the highest cost. The banner shows `CPM of at least {price}`.

## List of compatible webpages
Our browser extension is likely to work on the following webpages:

| country | webpage |
|:-------:|---------|
| International | https://espn.com |
| International | https://cnn.com |
| International | https://accuweather.com |
| International | https://theguardian.com |
| 🇧🇪 Belgium | https://standaard.be |
| Belgium | https://levif.be |
| ------- | ----------------------  |
| 🇨🇦 Canada | https://www.lapresse.ca |
| ------- | ----------------------  |
| 🇫🇷 France | https://actu.fr |
| France | https://www.aufeminin.com |
| France | https://www.capital.fr |
| France | https://www.courrierinternational.com |
| France | https://www.courrier-picard.fr |
| France | https://fr.euronews.com |
| France | https://www.futura-sciences.com |
| France | https://www.gala.fr |
| France | https://www.hbrfrance.fr |
| France | https://www.iphon.fr |
| France | https://latribune.fr |
| France | https://www.lamontagne.fr |
| France | https://ledauphine.com |
| France | https://www.lejdc.fr |
| France | https://www.leprogres.fr |
| France | https://www.lessorsavoyard.fr |
| France | https://www.letelegramme.fr |
| France | https://www.numerama.com |
| France | https://www.psychologies.com |
| France | https://www.republicain-lorrain.fr |
| France | https://www.sudouest.fr  |
| France | https://telestar.fr |
| France | https://www.telerama.fr |
| France | https://www.varmatin.com |
| France | https://www.vosgesmatin.fr |
| ------- | ----------------------  |
| 🇫🇮 Finland | https://aamuposti.fi |
| Finland | https://kraatti.fi |
| Finland | https://esaimaa.fi |
| Finland | https://forssanlehti.fi |
| Finland | https://hs.fi |
| Finland | https://hameensanomat.fi |
| Finland | https://iltalehti.fi |
| Finland | https://ita-savo.fi |
| Finland | https://kouvolansanomat.fi |
| Finland | https://loviisansanomat.fi |
| Finland | https://lansi-savo.fi |
| Finland | https://maaseuduntulevaisuus.fi |
| Finland | https://savonsanomat.fi |
| Finland | https://is.fi |
| Finland | https://uusisuomi.fi |
| Finland | https://uusimaa.fi |
| ------- | ----------------------  |
| 🇪🇸 Spain | https://www.abc.es  |
| Spain | https://as.com |
| Spain | https://cadenaser.com |
| Spain | https://www.eldiario.es  |
| Spain | https://www.elmundo.es  |
| Spain | https://elpais.com |
| Spain | https://www.lavanguardia.com   |
| Spain | https://www.marca.com |
| ------- | ----------------------  |
|  🇨🇭Switzerland | https://20min.ch |
| Switzerland | https://ricardo.ch |


Conspiracy websites  (from https://archive.is/vvpf9 )
| Languages | webpage |
|:-------:|---------|
| French | https://wikistrike.com |




## License
Ad Radar is under the GNU Affero General Public License.

## Partners
Ad Radar was built under the banner of [_The Eyeballs_](https://eyeballs.hestialabs.org), a project that is part of the [HestiaLabs](https://www.hestialabs.org) project.
We can anticipate multiple opportunities for further collaboration with groups of people who want to use technology to better understand the ways attention is monetized online.
Please email [eyeballs@hestialabs.org](mailto:eyeballs@hestialabs.org).
