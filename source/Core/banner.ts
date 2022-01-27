import {Bid} from './types';

export const BANNER_CLASS = 'hestia-ad-radar-banner';

export function makeWinningBidText(bid: Bid): string {
  return `CPM of ${bid.cpm.toFixed(3)} ${bid.currency} paid via ${bid.bidder}`;
}

export function makeNonWinningBidText(bid: Bid): string {
  return `CPM of at least ${bid.cpm.toFixed(3)} ${bid.currency}`;
}

export function noInformationText(): string {
  return 'No information found for this ad';
}

export function htmlBanner(text: string, iframeWidth: string): string {
  return `
    <div class='${BANNER_CLASS}' style='all: unset; display: table; text-align: center; margin: 0 auto; min-width: ${iframeWidth}'>
      <p style='all: unset; background-color: red; color: black; display: inline-block; margin: auto; line-height: normal; font-size: medium; height: auto; width: 100%'>
        ${text}
        <a href='https://github.com/hestiaAI/ad-radar/blob/main/README.md#understanding-the-banners'>[?]</a>
      </p>
    </div>
    `;
}
