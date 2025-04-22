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
      // Load saved feedback entries
      loadSavedFeedback();
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

  /**
   * Load saved feedback entries from storage
   */
  function loadSavedFeedback() {
    chrome.storage.local.get(["savedFeedback"], function (result) {
      const savedFeedback = result.savedFeedback || [];

      if (historyList) {
        // Clear any existing content
        historyList.innerHTML = "";

        if (savedFeedback.length === 0) {
          // Show empty state message
          const emptyMessage = document.createElement("div");
          emptyMessage.className = "empty-message";
          emptyMessage.textContent =
            "No feedback summaries yet. Save feedback from LeetCode problems to see them here.";
          historyList.appendChild(emptyMessage);
        } else {
          // Sort entries by date (newest first)
          savedFeedback.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });

          // Create history items
          savedFeedback.forEach((entry, index) => {
            const historyItem = createHistoryItem(entry, index);
            historyList.appendChild(historyItem);
          });
        }
      }
    });
  }

  /**
   * Create a history item element for a saved feedback entry
   * @param {Object} entry - The saved feedback entry
   * @param {number} index - The index of the entry in the array
   * @returns {HTMLElement} - The history item element
   */
  function createHistoryItem(entry, index) {
    const { problemName, date, summary } = entry;

    // Create history item container
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.dataset.index = index;

    // Create header with date, problem name, and delete button
    const header = document.createElement("div");
    header.className = "history-item-header";

    const headerInfo = document.createElement("div");
    headerInfo.className = "history-item-info";

    const dateElement = document.createElement("span");
    dateElement.className = "history-item-date";
    dateElement.textContent = formatDate(date);

    const problemNameElement = document.createElement("span");
    problemNameElement.className = "history-item-problem";
    problemNameElement.textContent = problemName;

    headerInfo.appendChild(dateElement);
    headerInfo.appendChild(problemNameElement);

    const deleteButton = document.createElement("button");
    deleteButton.className = "history-item-delete";
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.title = "Delete this entry";

    // Add delete functionality
    deleteButton.addEventListener("click", function (e) {
      e.stopPropagation();
      deleteFeedbackEntry(index);
    });

    header.appendChild(headerInfo);
    header.appendChild(deleteButton);

    // Create content for the summary
    const content = document.createElement("div");
    content.className = "history-item-content";
    content.textContent = summary;

    // Assemble the history item
    historyItem.appendChild(header);
    historyItem.appendChild(content);

    return historyItem;
  }

  /**
   * Delete a feedback entry from storage
   * @param {number} index - The index of the entry to delete
   */
  function deleteFeedbackEntry(index) {
    chrome.storage.local.get(["savedFeedback"], function (result) {
      const savedFeedback = result.savedFeedback || [];

      if (index >= 0 && index < savedFeedback.length) {
        // Remove the entry at the specified index
        savedFeedback.splice(index, 1);

        // Save the updated array back to storage
        chrome.storage.local.set({ savedFeedback }, function () {
          console.log(`Deleted feedback entry at index ${index}`);

          // Reload the history panel
          loadSavedFeedback();
        });
      }
    });
  }

  /**
   * Format a date string in a more readable format
   * @param {string} dateStr - The date string in YYYY-MM-DD format
   * @returns {string} - The formatted date string
   */
  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);

      // If the date is today, show "Today"
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      }

      // If the date is yesterday, show "Yesterday"
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }

      // Otherwise, show the date in a readable format
      const options = { month: "short", day: "numeric", year: "numeric" };
      return date.toLocaleDateString("en-US", options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr;
    }
  }
});
