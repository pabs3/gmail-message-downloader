async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function findAllSelectedConversations(tab) {
  const returnValue = chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [],
      func: () => {
        console.log('Finding all selected conversations');
        const variable = 2;
        return variable;
      }}, (results) => {
        console.log(results);
        return results;
      });
}

function goToConversationView(tab, identifier) {
}

function goBackToThreadListView(tab) {
}

async function downloadMessagesFromConversationView(tab) {
  chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [],
      func: () => {
        const generateMouseEvent = (type) => {
          return new MouseEvent(type, {
              view: window,
              bubbles: true,
              cancelable: true,
          });
        };
        const generateKeyEvent = (keyString) => {
          return new KeyboardEvent('keydown', {
            key: keyString,
          });
        };

        const delay = (milliseconds) => {
          return new Promise((resolve, reject) => {
            setTimeout(resolve.bind(null), milliseconds);
          });
        };

        // Some of the messages may be collapsed
        const expandAllButton = document.querySelector('[aria-label="Expand all"]');
        const expandPromise = expandAllButton ? new Promise((resolve, reject) => {
          expandAllButton.dispatchEvent(generateMouseEvent('click'));
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

          // There is one more button at the top of the page (we don't want that
          // one), and then one per message. The only way I've seen to distinguish
          // them so far is that the parent of the first one is a <div> and a
          // <td> for the others.
          const clickTargets = [];
          for (const moreButton of moreButtons) {
            if (moreButton.parentNode.tagName.toLowerCase() === 'div') {
              // This is the top more button, we don't want that one.
              continue;
            }
            clickTargets.push(moreButton);
          }

          for (const clickTarget of clickTargets) {
            await delay(1000).then(async () => {
              const rect = clickTarget.getBoundingClientRect();
              clickTarget.dispatchEvent(generateMouseEvent('mousedown'));
              clickTarget.dispatchEvent(generateMouseEvent('mouseup'));
              clickTarget.dispatchEvent(generateMouseEvent('click'));
              const downloadMenuItem = Array.from(document.querySelectorAll('div')).find(
                  el => el.textContent === 'Download message');
              await delay(1000).then(async () => {
                downloadMenuItem.dispatchEvent(generateMouseEvent('mousedown'));
                downloadMenuItem.dispatchEvent(generateMouseEvent('mouseup'));
                downloadMenuItem.dispatchEvent(generateMouseEvent('click'));
                await delay(1000).then(() => {
                  downloadMenuItem.dispatchEvent(generateMouseEvent('mousedown'));
                  downloadMenuItem.dispatchEvent(generateMouseEvent('mouseup'));
                  downloadMenuItem.dispatchEvent(generateMouseEvent('click'));
                });
              });
            });
          }
        }).then(() => {
          console.log('All done.');
        });
      }},
      (injectionResults) => {
        for (const frameResult of injectionResults) {
          console.log('Result: ' + frameResult.result);
        }
      });
}

chrome.action.onClicked.addListener((tab) => {
  downloadMessagesFromConversationView(tab);
  /* const selectedConversations = findAllSelectedConversations(tab);
  for (const selectedConversation of selectedConversations) {
    goToConversationView(selectedConversation);
    downloadMessagesFromConversationView(tab);
    goBackToThreadListView(tab);
  } */
});
