document.addEventListener("DOMContentLoaded", function () {
  // UI Elements
  const historyList = document.getElementById("history-list");
  const searchInput = document.getElementById("history-search");
  const clearSearchButton = document.getElementById("clear-search");
  const sortSelect = document.getElementById("history-sort");

  // State variables
  let expansionStates = {};
  let savedFeedbackEntries = [];

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
      // Load expansion states first
      loadExpansionStates();

      // Then load saved feedback entries
      loadSavedFeedback();

      // Set up search functionality
      setupSearch();

      // Set up sort functionality
      setupSort();
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
   * Set up sort functionality
   */
  function setupSort() {
    if (sortSelect) {
      sortSelect.addEventListener("change", function () {
        sortHistoryItems(this.value);
      });
    }
  }

  /**
   * Sort history items based on the selected sort option
   * @param {string} sortOption - The sort option ('latest' or 'oldest')
   */
  function sortHistoryItems(sortOption) {
    if (savedFeedbackEntries.length === 0) return;

    // Sort the entries
    if (sortOption === "latest") {
      savedFeedbackEntries.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
    } else {
      savedFeedbackEntries.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
    }

    // Re-render the list
    renderHistoryItems(savedFeedbackEntries);

    // Re-apply search filtering if there's a search query
    if (searchInput && searchInput.value) {
      filterHistoryItems(searchInput.value.toLowerCase());
    }
  }

  /**
   * Load saved expansion states from storage
   */
  function loadExpansionStates() {
    chrome.storage.local.get(["feedbackExpansionStates"], function (result) {
      expansionStates = result.feedbackExpansionStates || {};
      console.log("Loaded expansion states:", expansionStates);
    });
  }

  /**
   * Save the expansion state for a history item
   * @param {number} index - The index of the history item
   * @param {boolean} isExpanded - Whether the item is expanded
   */
  function saveExpansionState(index, isExpanded) {
    expansionStates[index] = isExpanded;

    chrome.storage.local.set(
      {
        feedbackExpansionStates: expansionStates,
      },
      function () {
        console.log(`Saved expansion state for item ${index}: ${isExpanded}`);
      }
    );
  }

  /**
   * Get the expansion state for a history item
   * @param {number} index - The index of the history item
   * @returns {boolean} - Whether the item should be expanded
   */
  function getExpansionState(index) {
    return expansionStates[index] || false;
  }

  /**
   * Set up search functionality
   */
  function setupSearch() {
    if (searchInput && clearSearchButton) {
      searchInput.addEventListener("input", function () {
        filterHistoryItems(this.value.toLowerCase());

        // Toggle clear button visibility
        if (this.value) {
          clearSearchButton.style.display = "block";
        } else {
          clearSearchButton.style.display = "none";
        }
      });

      clearSearchButton.addEventListener("click", function () {
        searchInput.value = "";
        filterHistoryItems("");
        this.style.display = "none";
      });
    }
  }

  /**
   * Filter history items based on search text
   * @param {string} searchText - The text to search for
   */
  function filterHistoryItems(searchText) {
    const historyItems = document.querySelectorAll(".history-item");

    historyItems.forEach((item) => {
      const problemName = item
        .querySelector(".history-item-problem")
        .textContent.toLowerCase();

      if (problemName.includes(searchText)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });

    // Show or hide the empty message
    const visibleItems = Array.from(historyItems).filter(
      (item) => item.style.display !== "none"
    );

    const emptyMessage = document.querySelector(".empty-message");

    if (emptyMessage) {
      if (visibleItems.length === 0 && searchText) {
        emptyMessage.textContent = `No results found for "${searchText}"`;
        emptyMessage.style.display = "block";
      } else if (visibleItems.length === 0) {
        emptyMessage.textContent = "No history items to display yet.";
        emptyMessage.style.display = "block";
      } else {
        emptyMessage.style.display = "none";
      }
    }
  }

  /**
   * Load saved feedback entries from storage
   */
  function loadSavedFeedback() {
    chrome.storage.local.get(["savedFeedback"], function (result) {
      savedFeedbackEntries = result.savedFeedback || [];

      // Render the list
      renderHistoryItems(savedFeedbackEntries);
    });
  }

  /**
   * Render history items to the list
   * @param {Array} entries - The feedback entries to render
   */
  function renderHistoryItems(entries) {
    if (historyList) {
      // Clear any existing content
      historyList.innerHTML = "";

      if (entries.length === 0) {
        // Show empty state message
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent =
          "No feedback summaries yet. Save feedback from LeetCode problems to see them here.";
        historyList.appendChild(emptyMessage);
      } else {
        // Create history items
        entries.forEach((entry, index) => {
          const historyItem = createHistoryItem(entry, index);
          historyList.appendChild(historyItem);
        });
      }
    }
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

    // Create header with problem name, date, and action buttons
    const header = document.createElement("div");
    header.className = "history-item-header";

    // Left side: Problem name
    const headerInfo = document.createElement("div");
    headerInfo.className = "history-item-info";

    const problemNameElement = document.createElement("span");
    problemNameElement.className = "history-item-problem";
    problemNameElement.textContent = problemName;

    const dateElement = document.createElement("span");
    dateElement.className = "history-item-date";
    dateElement.textContent = formatDate(date);

    headerInfo.appendChild(problemNameElement);
    headerInfo.appendChild(dateElement);

    // Right side: Action buttons (edit and delete)
    const actionButtons = document.createElement("div");
    actionButtons.className = "history-item-actions";

    // Edit button
    const editButton = document.createElement("button");
    editButton.className = "history-item-edit";
    editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    editButton.title = "Edit this entry";

    // Add edit functionality
    editButton.addEventListener("click", function (e) {
      e.stopPropagation();
      enableEditing(historyItem, entry, index);
    });

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "history-item-delete";
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.title = "Delete this entry";

    // Add delete functionality
    deleteButton.addEventListener("click", function (e) {
      e.stopPropagation();
      deleteFeedbackEntry(index);
    });

    // Add buttons to actions container
    actionButtons.appendChild(editButton);
    actionButtons.appendChild(deleteButton);

    // Assemble the header
    header.appendChild(headerInfo);
    header.appendChild(actionButtons);
    historyItem.appendChild(header);

    // Create collapsed content
    const firstLine = summary.split("\n")[0];
    const hasMultipleLines = summary.includes("\n");

    const collapsedContent = document.createElement("div");
    collapsedContent.className = "collapsed-content";
    collapsedContent.textContent = hasMultipleLines
      ? `${firstLine}...`
      : firstLine;
    historyItem.appendChild(collapsedContent);

    // Create full content
    const content = document.createElement("div");
    content.className = "history-item-content";
    content.textContent = summary;
    historyItem.appendChild(content);

    // Add toggle button only if there are multiple lines
    if (hasMultipleLines) {
      const toggleButton = document.createElement("button");
      toggleButton.className = "toggle-collapse";
      toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
      toggleButton.title = "Show more";

      // Add event listener for toggling
      toggleButton.addEventListener("click", function (e) {
        e.stopPropagation();

        const isExpanded = content.classList.toggle("expanded");
        collapsedContent.style.display = isExpanded ? "none" : "block";

        if (isExpanded) {
          toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
          toggleButton.title = "Show less";
        } else {
          toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
          toggleButton.title = "Show more";
        }

        // Save expansion state
        saveExpansionState(index, isExpanded);
      });

      historyItem.appendChild(toggleButton);

      // Set initial expansion state
      const isInitiallyExpanded = getExpansionState(index);
      if (isInitiallyExpanded) {
        content.classList.add("expanded");
        collapsedContent.style.display = "none";
        toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
        toggleButton.title = "Show less";
      } else {
        content.classList.remove("expanded");
        collapsedContent.style.display = "block";
      }
    } else {
      // For single-line summaries, always show the collapsed content
      collapsedContent.style.display = "block";
      content.style.display = "none";
    }

    return historyItem;
  }

  /**
   * Enable inline editing for a history item
   * @param {HTMLElement} historyItem - The history item element
   * @param {Object} entry - The entry data
   * @param {number} index - The entry index
   */
  function enableEditing(historyItem, entry, index) {
    const problemElement = historyItem.querySelector(".history-item-problem");
    const contentElement = historyItem.querySelector(".history-item-content");
    const collapsedElement = historyItem.querySelector(".collapsed-content");

    // Store original values
    const originalTitle = problemElement.textContent;
    const originalContent = contentElement.textContent;

    // Create edit form for problem name
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.className = "edit-title-input";
    titleInput.value = originalTitle;

    // Create edit form for content
    const contentTextarea = document.createElement("textarea");
    contentTextarea.className = "edit-content-textarea";
    contentTextarea.value = originalContent;

    // Replace elements with editable inputs
    problemElement.innerHTML = "";
    problemElement.appendChild(titleInput);

    // Ensure content is visible
    contentElement.style.display = "none";
    collapsedElement.style.display = "none";

    // Create edit container
    const editContainer = document.createElement("div");
    editContainer.className = "edit-container";
    editContainer.appendChild(contentTextarea);

    // Create buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "edit-buttons";

    // Save button
    const saveButton = document.createElement("button");
    saveButton.className = "edit-save-button";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", function () {
      saveEdits(index, titleInput.value, contentTextarea.value);
    });

    // Cancel button
    const cancelButton = document.createElement("button");
    cancelButton.className = "edit-cancel-button";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", function () {
      cancelEdits(historyItem, originalTitle, originalContent);
    });

    // Add buttons to container
    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(cancelButton);
    editContainer.appendChild(buttonsContainer);

    // Add edit container to history item
    historyItem.appendChild(editContainer);

    // Focus the title input
    titleInput.focus();
  }

  /**
   * Save edits to a history item
   * @param {number} index - The index of the entry
   * @param {string} newTitle - The new title
   * @param {string} newContent - The new content
   */
  function saveEdits(index, newTitle, newContent) {
    chrome.storage.local.get(["savedFeedback"], function (result) {
      const savedFeedback = result.savedFeedback || [];

      if (index >= 0 && index < savedFeedback.length) {
        // Update the entry
        savedFeedback[index].problemName = newTitle;
        savedFeedback[index].summary = newContent;

        // Save back to storage
        chrome.storage.local.set({ savedFeedback }, function () {
          console.log(`Updated entry at index ${index}`);

          // Reload the history panel
          loadSavedFeedback();
        });
      }
    });
  }

  /**
   * Cancel edits to a history item
   * @param {HTMLElement} historyItem - The history item element
   * @param {string} originalTitle - The original title
   * @param {string} originalContent - The original content
   */
  function cancelEdits(historyItem, originalTitle, originalContent) {
    // Remove the edit container
    const editContainer = historyItem.querySelector(".edit-container");
    if (editContainer) {
      historyItem.removeChild(editContainer);
    }

    // Restore original values
    const problemElement = historyItem.querySelector(".history-item-problem");
    const contentElement = historyItem.querySelector(".history-item-content");
    const collapsedElement = historyItem.querySelector(".collapsed-content");

    problemElement.textContent = originalTitle;
    contentElement.textContent = originalContent;

    // Restore display states
    if (contentElement.classList.contains("expanded")) {
      contentElement.style.display = "block";
      collapsedElement.style.display = "none";
    } else {
      contentElement.style.display = "none";
      collapsedElement.style.display = "block";
    }
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
    const date = new Date(dateStr);
    const today = new Date();

    // Reset time components to compare just dates
    const dateWithoutTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayWithoutTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // Check if dates match for "Today"
    if (dateWithoutTime.getTime() === todayWithoutTime.getTime()) {
      return "Today";
    }

    // Check for "Yesterday" (one day difference)
    const yesterdayWithoutTime = new Date(todayWithoutTime);
    yesterdayWithoutTime.setDate(yesterdayWithoutTime.getDate() - 1);
    if (dateWithoutTime.getTime() === yesterdayWithoutTime.getTime()) {
      return "Yesterday";
    }

    // Otherwise, format as date
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }
});
