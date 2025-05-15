const enabledIcon = {
  "16": "icons/enabled16.png",
  "32": "icons/enabled32.png",
  "128": "icons/enabled128.png"
};

const disabledIcon = {
  "16": "icons/disabled16.png",
  "32": "icons/disabled32.png",
  "128": "icons/disabled128.png"
};

// Set initial icon state
chrome.action.setIcon({ path: enabledIcon });

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateIcon") {
    chrome.action.setIcon({
      path: request.enabled ? enabledIcon : disabledIcon
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-extension") {
    toggleExtensionInCurrentTab();
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  toggleExtensionInCurrentTab();
});

function toggleExtensionInCurrentTab() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: "toggleExtension"});
  });
}