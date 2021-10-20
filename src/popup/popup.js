document.getElementById('popup-ad-history-button').addEventListener('click', () => {
  // Try to find a tab in this window already containing the history.html page, if found switch to it, if not create it
  browser.tabs.query({
    url: browser.runtime.getURL('/history.html'),
    windowId: browser.windows.WINDOW_ID_CURRENT
  }, tabs => {
    if (tabs.length > 0) {
      browser.tabs.update(tabs[0].id, {active: true});
      window.close();
    }
    else {
      browser.tabs.create({url: '/history.html'});
    }
  });
});

document.getElementById('popup-download-data-button').addEventListener('click', () => {
  browser.storage.local.get(data => {
    const fileToSave = new Blob([JSON.stringify(data, undefined, 2)], {type: 'application/json'});
    saveAs(fileToSave, 'my-worth-data.json');
  });
});

document.getElementById('popup-clear-data-button').addEventListener('click', () => {
  browser.storage.local.clear(initData);
});