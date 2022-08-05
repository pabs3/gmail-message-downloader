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

        const delay = (t, v) => {
           return new Promise(function(resolve) {
               setTimeout(resolve.bind(null, v), t)
           });
        }

        const moreButtons = document.querySelectorAll('[aria-label="More"]');
        if (!moreButtons) {
          console.log('Could not find the more button');
          return;
        }

        console.log('Found more buttons: ', moreButtons);
        const downloadMessagesPromises = [];

        // There is one more button at the top of the page (we don't want that
        // one), and then one per message. The only way I've seen to distinguish
        // them so far is that the parent of the first one is a <div> and a
        // <td> for the others.
        for (const moreButton of moreButtons) {
          console.log(moreButton.parentNode.tagName);
          if (moreButton.parentNode.tagName.toLowerCase() === 'div') {
            // This is the top more button, we don't want that one.
            console.log('Skipping top "more" button');
            continue;
          }
          console.log('Found more button on message', moreButton);
          const downloadThisMessagePromise = new Promise((resolve, reject) => {
            moreButton.dispatchEvent(generateEvent('click'));
            return delay(2000).then(() => {
              console.log('After timeout');
            });
          });
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
        }
        // Now we have all the promises, let's run them in sequence.
        return downloadMessagesPromises.reduce(
          (promiseChain, currentTask) => {
            return promiseChain.then(chainResults => currentTask.then(
              (currentResult) => [...chainResults, currentResult])
            );
          },
          Promise.resolve([]).then((arrayOfResults) => {
            console.log('We got results: ', arrayOfResults);
          })
        );
      },
  });
}

chrome.action.onClicked.addListener((tab) => {
  downloadMessagesFromConversationView(tab);
});
