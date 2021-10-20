document.getElementById('popup-ad-history').addEventListener('click', () => {
  browser.tabs.create({
    url: 'history.html'
  });
});
