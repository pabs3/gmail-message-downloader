async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function findAllSelectedConversations(tab) {
  return new Promise((resolve, reject) => {
  chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [],
      func: () => {

        function getXPathForElement(element) {
          const idx = (sib, name) => sib
            ? idx(sib.previousElementSibling, name||sib.localName) + (sib.localName == name)
            : 1;
          const segs = elm => !elm || elm.nodeType !== 1
            ? ['']
            : elm.id && document.getElementById(elm.id) === elm
              ? [`id("${elm.id}")`]
              : [...segs(elm.parentNode), elm instanceof HTMLElement
                ? `${elm.localName}[${idx(elm)}]`
                : `*[local-name() = "${elm.localName}"][${idx(elm)}]`];
          return segs(element).join('/');
        }

        const checkboxes = document.querySelectorAll('[role="checkbox"]');
        const checkedBoxes = [];
        for (const checkbox of checkboxes) {
          if (checkbox.getAttribute('aria-checked') === 'true') {
            checkedBoxes.push(checkbox);
          }
        }
        const conversations = document.querySelectorAll('[role="row"]');
        const selectedConversations = [];
        const xpaths = [];
        for (const conversation of conversations) {
          for (const checkedBox of checkedBoxes) {
            if (conversation.contains(checkedBox)) {
              selectedConversations.push(conversation);
              xpaths.push(getXPathForElement(conversation));
              break;
            }
          }
        }
        return xpaths;
      }}, (results) => {
        // Get the first element, corresponding to the first (and only) frame.
        resolve(results[0].result);
      });
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
        const expandAllButton = document.querySelector(
            '[aria-label="Expand all"]');
        const expandPromise = expandAllButton ? new Promise((resolve, reject) => {
          expandAllButton.dispatchEvent(generateMouseEvent('click'));
          return delay(300).then(() => {
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
            await delay(200).then(async () => {
              const rect = clickTarget.getBoundingClientRect();
              clickTarget.dispatchEvent(generateMouseEvent('mousedown'));
              clickTarget.dispatchEvent(generateMouseEvent('mouseup'));
              clickTarget.dispatchEvent(generateMouseEvent('click'));
              const downloadItem = Array.from(
                  document.querySelectorAll('div')).find(
                      el => el.textContent === 'Download message');
              await delay(200).then(async () => {
                downloadItem.dispatchEvent(generateMouseEvent('mousedown'));
                downloadItem.dispatchEvent(generateMouseEvent('mouseup'));
                downloadItem.dispatchEvent(generateMouseEvent('click'));
                await delay(200).then(() => {
                  downloadItem.dispatchEvent(generateMouseEvent('mousedown'));
                  downloadItem.dispatchEvent(generateMouseEvent('mouseup'));
                  downloadItem.dispatchEvent(generateMouseEvent('click'));
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
  console.log(tab);
  if (!tab.url.includes('mail.google.com')) {
    // We can't do much if this isn't Gmail.
    console.warn('Wrong tab, sorry!');
  }
  if (tab.url.endsWith('#inbox')) {
    console.log('TODO: TL view. go into each selected conversation and download messages');
    const selectedConversationXpaths = findAllSelectedConversations(tab).then((results) => {
      console.log(results);
    });
  } else {
    // Let's assume for now that we are in a conversation view.
    console.log('Conv view. Downloading messages from this conversation.');
    downloadMessagesFromConversationView(tab);
  }
  /* for (const selectedConversation of selectedConversations) {
    goToConversationView(selectedConversation);
    downloadMessagesFromConversationView(tab);
    goBackToThreadListView(tab);
  } */
});
