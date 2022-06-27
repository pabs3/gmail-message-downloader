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

        const generateEvent = (type) => {
          return new MouseEvent(type, {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: 20,
          });
        };

        const moreButtons = document.querySelectorAll('[aria-label="More"]');
        if (!moreButtons) {
          console.log('Could not find the more button');
          return;
        }

        // Not sure why sometimes we get two, and sometimes just one.
        const moreButton = moreButtons.length === 1 ? moreButtons[0] : moreButtons[1];
        moreButton.dispatchEvent(generateEvent('mousedown'));

        window.setTimeout(() => {
          console.log('After timeout');
          const i = document.evaluate('//div[text()="Download message"]',
              document, null, XPathResult.ANY_TYPE, null );
          const downloadButton = i.iterateNext();

          console.log(downloadButton.clientX);
          console.log(downloadButton.clientY);

          let currentElement = downloadButton;
          while(currentElement.getAttribute('role') !== 'menu') {
            currentElement = currentElement.parentElement;
          }
          console.log(currentElement);
          const rect = downloadButton.getClientRects()[0];
          const preciseEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              screenX: rect.left,
              screenY: rect.top,
          });
          console.log(preciseEvent);

          currentElement.dispatchEvent(preciseEvent);

          // downloadButton.dispatchEvent(generateEvent('mousedown'));
        }, 200);
      },
  });
}

chrome.action.onClicked.addListener((tab) => {
  downloadSingleMessage(tab);
});
