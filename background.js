async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function downloadMessagesFromConversationView(tab) {
  chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [],
      func: () => {
        const generateEvent = (type) => {
          return new MouseEvent(type, {
              view: window,
              bubbles: true,
              cancelable: true,
          });
        };

        const delay = (milliseconds) => {
          return new Promise((resolve, reject) => {
            setTimeout(resolve.bind(null), milliseconds);
          });
        };

        // Some of the messages may be collapsed
        const expandAllButton = document.querySelector('[aria-label="Expand all"]');
        console.log('Expand all button? ', expandAllButton);
        const expandPromise = expandAllButton ? new Promise((resolve, reject) => {
          expandAllButton.dispatchEvent(generateEvent('click'));
          return delay(500).then(() => {
            resolve();
          });
        }) : Promise.resolve();

        return expandPromise.then(async () => {
          const moreButtons = document.querySelectorAll('[aria-label="More"]');
          if (!moreButtons) {
            console.log('Could not find any "more" button');
            return;
          }
          console.log('Found ' + moreButtons.length + ' more buttons: ');

          // There is one more button at the top of the page (we don't want that
          // one), and then one per message. The only way I've seen to distinguish
          // them so far is that the parent of the first one is a <div> and a
          // <td> for the others.
          const clickTargets = [];
          for (const moreButton of moreButtons) {
            if (moreButton.parentNode.tagName.toLowerCase() === 'div') {
              // This is the top more button, we don't want that one.
              console.log('Skipping top "more" button');
              continue;
            }
            clickTargets.push(moreButton);
          }

          console.log('I have ' + clickTargets.length + ' click targets');
          for (const clickTarget of clickTargets) {
            console.log('Here comes one...');
            await delay(2000).then(() => {
              console.log('After timeout, clicking now');
              clickTarget.dispatchEvent(generateEvent('click'));
            });
          }
        }).then(() => {
          console.log('All done.');
        });
      }
  });
}


          // const i = document.evaluate('//div[text()="Download message"]',
              // document, null, XPathResult.ANY_TYPE, null );
          // const downloadButton = i.iterateNext();
//
          // console.log(downloadButton.clientX);
          // console.log(downloadButton.clientY);
//
          // let currentElement = downloadButton;
          // while(currentElement.getAttribute('role') !== 'menu') {
            // currentElement = currentElement.parentElement;
          // }
          // console.log(currentElement);
          // const rect = downloadButton.getClientRects()[0];
          // const preciseEvent = new MouseEvent('click', {
              // view: window,
              // bubbles: true,
              // cancelable: true,
              // screenX: rect.left,
              // screenY: rect.top,
          // });
          // console.log(preciseEvent);
          // currentElement.dispatchEvent(preciseEvent);
          // downloadButton.dispatchEvent(generateEvent('mousedown'));


chrome.action.onClicked.addListener((tab) => {
  downloadMessagesFromConversationView(tab);
});
