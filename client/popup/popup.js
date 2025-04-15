document.getElementById("extractButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    // Check if we're on a LeetCode page
    if (!tab.url.includes("leetcode.com/problems/")) {
      showError(
        "Please navigate to a LeetCode problem page to use this extension."
      );
      return;
    }

    // Inject the content script to ensure it's loaded
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["scripts/content.js"],
      },
      () => {
        // Send a message to the content script to extract code
        chrome.tabs.sendMessage(
          tab.id,
          { action: "extractCode" },
          (response) => {
            if (response && response.status === "success") {
              window.close(); // Close the popup as the overlay will show on the page
            } else {
              showError(
                "Failed to extract code. Please ensure the code editor is visible."
              );
            }
          }
        );
      }
    );
  });
});

// Function to show error message in the popup
function showError(message) {
  const errorElem = document.createElement("div");
  errorElem.className = "error-message";
  errorElem.textContent = message;
  errorElem.style.cssText = `
    color: #f44336;
    margin-top: 10px;
    padding: 10px;
    background-color: #ffebee;
    border-radius: 4px;
  `;

  // Remove any existing error messages
  const existingError = document.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  document.querySelector(".container").appendChild(errorElem);
}
