async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function downloadSingleMessage(tab) {
  chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [],
      func: () => {
        console.log('Test');
        const moreButton = document.querySelectorAll('[aria-label="More"]');
        moreButton[1].click();
        console.log(moreButton[1]);
        // const i = document.evaluate('//div[text()="Download message"]',
            // document, null, XPathResult.ANY_TYPE, null );
        // const downloadButton = i.iterateNext();
        // console.log(downloadButton);
      },
  });
}

chrome.action.onClicked.addListener((tab) => {
  downloadSingleMessage(tab);
});
