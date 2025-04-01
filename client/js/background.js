// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "copySelectedText",
    title: "Copy Selected Text",
    contexts: ["selection"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copySelectedText") {
    // Store the selected text in chrome storage
    chrome.storage.local.set({ selectedText: info.selectionText });
  }
});
