import * as React from 'react';
import {browser} from 'webextension-polyfill-ts';
import {saveAs} from 'file-saver';
import {initData} from '../Core/storage';

import './styles.scss';

function goToHistory(): void {
  // Try to find a tab in this window already containing the history.html page, if found switch to it, if not create it
  browser.tabs
    .query({
      url: browser.runtime.getURL('/history.html'),
      windowId: browser.windows.WINDOW_ID_CURRENT,
    })
    .then((tabs) => {
      if (tabs.length > 0) {
        browser.tabs.update(tabs[0].id, {active: true});
        window.close();
      } else {
        browser.tabs.create({url: '/visualization.html'});
      }
    });
}

function downloadData(): void {
  browser.storage.local.get().then((data) => {
    const fileToSave = new Blob([JSON.stringify(data, undefined, 2)], {
      type: 'application/json',
    });
    saveAs(fileToSave, 'ad-radar-data.json');
  });
}

async function clearData(): Promise<void> {
  await browser.storage.local.clear();
  await initData();
  // eslint-disable-next-line no-alert
  window.alert('Your data has been cleared');
}

const Popup: React.FC = () => {
  return (
    <section id="popup">
      <h1>Ad Radar browser extension</h1>
      <button type="button" id="popup-ad-history-button" onClick={goToHistory}>
        See my ad price history!
      </button>
      <button
        type="button"
        id="popup-download-data-button"
        onClick={downloadData}
      >
        Download my data
      </button>
      <button type="button" id="popup-clear-data-button" onClick={clearData}>
        Clear my data
      </button>

      <p>
        Built by{' '}
        <a
          href="https://hestialabs.org/en/"
          target="_blank"
          rel="noopener noreferrer"
        >
          HestiaLabs
        </a>
      </p>
    </section>
  );
};

export default Popup;
