// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes("leetcode.com/problems/")) {
    chrome.tabs.sendMessage(tab.id, { action: "extractCode" });
  } else {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        alert(
          "Please navigate to a LeetCode problem page to use this extension."
        );
      },
    });
  }
});
