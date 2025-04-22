document.addEventListener("DOMContentLoaded", function () {
  // UI Elements
  const historyList = document.getElementById("history-list");

  // Initialize the history panel
  initializeHistoryPanel();

  // Functions
  function initializeHistoryPanel() {
    // Check if chrome and storage APIs exist
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      // In the future, this is where you would get the user's history from storage
      // and populate the history list
      // For now, we just have the empty state message which is already in the HTML
    } else {
      console.warn("Chrome storage API not available");

      if (historyList) {
        const errorElement = document.createElement("div");
        errorElement.className = "error-message";
        errorElement.textContent = "Storage API not available";
        historyList.innerHTML = "";
        historyList.appendChild(errorElement);
      }
    }
  }
});
