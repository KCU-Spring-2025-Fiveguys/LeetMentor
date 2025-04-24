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
      // Create container for sort controls
      const sortControlsContainer = document.createElement("div");
      sortControlsContainer.className = "sort-controls-container";
      sortControlsContainer.style.display = "flex";
      sortControlsContainer.style.alignItems = "center";
      sortControlsContainer.style.gap = "8px";

      // Replace the original sortSelect with a new one
      const newSortSelect = document.createElement("select");
      newSortSelect.id = "history-sort";
      newSortSelect.className = "history-sort-select";

      // Add the three sort options
      const timeOption = document.createElement("option");
      timeOption.value = "time";
      timeOption.textContent = "Time";

      const numberOption = document.createElement("option");
      numberOption.value = "number";
      numberOption.textContent = "Number";

      const difficultyOption = document.createElement("option");
      difficultyOption.value = "difficulty";
      difficultyOption.textContent = "Difficulty";

      newSortSelect.appendChild(timeOption);
      newSortSelect.appendChild(numberOption);
      newSortSelect.appendChild(difficultyOption);

      // Create direction toggle button
      const directionToggle = document.createElement("button");
      directionToggle.className = "sort-direction-toggle";
      directionToggle.innerHTML = '<i class="fas fa-arrow-down"></i>';
      directionToggle.title = "Toggle sort direction";
      directionToggle.style.background = "none";
      directionToggle.style.border = "none";
      directionToggle.style.cursor = "pointer";
      directionToggle.style.fontSize = "16px";
      directionToggle.style.padding = "4px";

      // Track sort state
      const sortState = {
        criteria: "time",
        ascending: false, // Default descending (newest first)
      };

      // Add the elements to the container
      sortControlsContainer.appendChild(newSortSelect);
      sortControlsContainer.appendChild(directionToggle);

      // Replace the original sort select with our new controls
      sortSelect.parentNode.replaceChild(sortControlsContainer, sortSelect);

      // Update sort when criteria changes
      newSortSelect.addEventListener("change", function () {
        sortState.criteria = this.value;
        applySorting(sortState.criteria, sortState.ascending);

        // Save preferences
        saveSortPreferences(sortState);
      });

      // Update sort when direction changes
      directionToggle.addEventListener("click", function () {
        sortState.ascending = !sortState.ascending;

        // Update the arrow icon
        this.innerHTML = sortState.ascending
          ? '<i class="fas fa-arrow-up"></i>'
          : '<i class="fas fa-arrow-down"></i>';

        applySorting(sortState.criteria, sortState.ascending);

        // Save preferences
        saveSortPreferences(sortState);
      });

      // Load saved preferences on init
      loadSortPreferences().then((prefs) => {
        if (prefs) {
          sortState.criteria = prefs.criteria || "time";
          sortState.ascending =
            prefs.ascending !== undefined ? prefs.ascending : false;

          // Update UI to match loaded preferences
          newSortSelect.value = sortState.criteria;
          directionToggle.innerHTML = sortState.ascending
            ? '<i class="fas fa-arrow-up"></i>'
            : '<i class="fas fa-arrow-down"></i>';

          // Apply the saved sorting
          applySorting(sortState.criteria, sortState.ascending);
        }
      });
    }
  }

  /**
   * Save sort preferences
   * @param {Object} prefs - The sort preferences to save
   */
  function saveSortPreferences(prefs) {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ sortPreferences: prefs }, function () {
        console.log("Sort preferences saved:", prefs);
      });
    }
  }

  /**
   * Load sort preferences
   * @returns {Promise} - Promise that resolves with the saved preferences
   */
  function loadSortPreferences() {
    return new Promise((resolve) => {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.get(["sortPreferences"], function (result) {
          resolve(result.sortPreferences);
        });
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Apply sorting with the specified criteria and direction
   * @param {string} criteria - The sort criteria ('time', 'number', 'difficulty')
   * @param {boolean} ascending - The sort direction (true = ascending, false = descending)
   */
  function applySorting(criteria, ascending) {
    if (savedFeedbackEntries.length === 0) return;

    // Helper function to get difficulty value for comparison
    const getDifficultyValue = (difficulty) => {
      if (!difficulty) return 1; // Default to Easy if not specified
      const difficultyMap = { Easy: 1, Medium: 2, Hard: 3 };
      return difficultyMap[difficulty.trim()] || 1;
    };

    // Helper function to extract number from problem (e.g., "1." from "1. Two Sum")
    const getProblemNumber = (entry) => {
      if (entry.problemInfo && entry.problemInfo.number) {
        // Extract just the number without the period
        const match = entry.problemInfo.number.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
      }

      // Try to extract from fullTitle if available
      if (entry.problemInfo && entry.problemInfo.fullTitle) {
        const match = entry.problemInfo.fullTitle.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
      }

      // Fallback if no number found
      return Number.MAX_SAFE_INTEGER;
    };

    // Sort entries based on criteria and direction
    savedFeedbackEntries.sort((a, b) => {
      let result = 0;

      // Primary sort criteria
      switch (criteria) {
        case "time":
          // Time: sort by date
          result = new Date(a.date) - new Date(b.date);
          break;

        case "number":
          // Number: sort by problem number
          result = getProblemNumber(a) - getProblemNumber(b);
          break;

        case "difficulty":
          // Difficulty: sort by difficulty level
          const aDifficulty =
            a.problemInfo && a.problemInfo.difficulty
              ? a.problemInfo.difficulty
              : "Easy";
          const bDifficulty =
            b.problemInfo && b.problemInfo.difficulty
              ? b.problemInfo.difficulty
              : "Easy";
          result =
            getDifficultyValue(aDifficulty) - getDifficultyValue(bDifficulty);
          break;
      }

      // Apply direction
      if (!ascending) {
        result = -result; // Invert for descending
      }

      // Tie-breaking rules
      if (result === 0) {
        // Apply first tie-breaker based on criteria
        switch (criteria) {
          case "time":
            // First tie-breaker: Number
            result = getProblemNumber(a) - getProblemNumber(b);
            if (!ascending) result = -result;

            // Second tie-breaker: Difficulty
            if (result === 0) {
              const aDifficulty =
                a.problemInfo && a.problemInfo.difficulty
                  ? a.problemInfo.difficulty
                  : "Easy";
              const bDifficulty =
                b.problemInfo && b.problemInfo.difficulty
                  ? b.problemInfo.difficulty
                  : "Easy";
              result =
                getDifficultyValue(aDifficulty) -
                getDifficultyValue(bDifficulty);
              if (!ascending) result = -result;
            }
            break;

          case "number":
            // First tie-breaker: Time
            result = new Date(a.date) - new Date(b.date);
            if (!ascending) result = -result;

            // Second tie-breaker: Difficulty
            if (result === 0) {
              const aDifficulty =
                a.problemInfo && a.problemInfo.difficulty
                  ? a.problemInfo.difficulty
                  : "Easy";
              const bDifficulty =
                b.problemInfo && b.problemInfo.difficulty
                  ? b.problemInfo.difficulty
                  : "Easy";
              result =
                getDifficultyValue(aDifficulty) -
                getDifficultyValue(bDifficulty);
              if (!ascending) result = -result;
            }
            break;

          case "difficulty":
            // First tie-breaker: Time
            result = new Date(a.date) - new Date(b.date);
            if (!ascending) result = -result;

            // Second tie-breaker: Number
            if (result === 0) {
              result = getProblemNumber(a) - getProblemNumber(b);
              if (!ascending) result = -result;
            }
            break;
        }
      }

      return result;
    });

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
    // Extract problemInfo if available (for newer entries)
    const problemInfo = entry.problemInfo || {
      title: problemName,
      fullTitle: problemName,
    };

    // Create history item container
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.dataset.index = index;

    // Get difficulty color mapping if available
    let difficultyColor = "";
    if (problemInfo.difficulty) {
      const difficulty = problemInfo.difficulty.trim();

      // Map difficulty to color
      switch (difficulty) {
        case "Easy":
          difficultyColor = "#1CBABA"; // Teal for Easy
          break;
        case "Medium":
          difficultyColor = "#FFB700"; // Yellow/Orange for Medium
          break;
        case "Hard":
          difficultyColor = "#F63737"; // Red for Hard
          break;
      }
    }

    // Create header with problem name, date, and action buttons
    const header = document.createElement("div");
    header.className = "history-item-header";

    // Apply difficulty color to the header if available
    if (difficultyColor) {
      // Apply a subtle difficulty indicator to the header
      header.style.borderLeft = `4px solid ${difficultyColor}`;
      // Add subtle background color hint
      header.style.backgroundColor = `${difficultyColor}10`; // 10% opacity of the difficulty color
    }

    // Left side: Problem name
    const headerInfo = document.createElement("div");
    headerInfo.className = "history-item-info";

    // Create problem name element - now as a link if URL is available
    const problemNameElement = document.createElement(
      problemInfo.url ? "a" : "span"
    );
    problemNameElement.className = "history-item-problem";

    if (problemInfo.url) {
      // Make it a link to the LeetCode problem
      problemNameElement.href = `https://leetcode.com${problemInfo.url}`;
      problemNameElement.target = "_blank";
      problemNameElement.rel = "noopener noreferrer";
      problemNameElement.title = `Open ${problemInfo.fullTitle} on LeetCode`;

      // Add a subtle indicator that it's a link
      problemNameElement.style.textDecoration = "none";
      problemNameElement.style.color = "inherit";
      problemNameElement.style.cursor = "pointer";
      problemNameElement.style.display = "inline-flex";
      problemNameElement.style.alignItems = "center";
      problemNameElement.style.position = "relative";

      // Add hover animation styles
      problemNameElement.style.transition = "color 0.3s ease";

      // Create the underline element that will animate on hover
      const underline = document.createElement("span");
      underline.style.position = "absolute";
      underline.style.bottom = "0";
      underline.style.left = "0";
      underline.style.width = "0";
      underline.style.height = "1px";
      underline.style.backgroundColor = "#3182ce"; // Blue color for the underline
      underline.style.transition = "width 0.3s ease";
      problemNameElement.appendChild(underline);

      // Add hover event listeners
      problemNameElement.addEventListener("mouseenter", () => {
        problemNameElement.style.color = "#3182ce"; // Change text to blue on hover
        underline.style.width = "100%"; // Animate the underline from left to right
      });

      problemNameElement.addEventListener("mouseleave", () => {
        problemNameElement.style.color = "inherit"; // Reset text color
        underline.style.width = "0"; // Reset underline width
      });

      // Show the full title (with number if available)
      problemNameElement.textContent = problemInfo.fullTitle;

      // Add a subtle icon indicating it's a link
      const linkIcon = document.createElement("i");
      linkIcon.className = "fas fa-external-link-alt";
      linkIcon.style.fontSize = "0.7em";
      linkIcon.style.marginLeft = "4px";
      linkIcon.style.opacity = "0.6";
      problemNameElement.appendChild(linkIcon);
      problemNameElement.appendChild(underline); // Make sure underline is the last child
    } else {
      // Regular non-link display
      problemNameElement.textContent = problemInfo.fullTitle;
    }

    const dateElement = document.createElement("span");
    dateElement.className = "history-item-date";
    dateElement.textContent = formatDate(date);
    // Add margin-right to ensure space before action buttons
    dateElement.style.marginRight = "8px";

    headerInfo.appendChild(problemNameElement);

    // Add difficulty badge if available
    if (difficultyColor && problemInfo.difficulty) {
      // Create a difficulty badge
      const difficultyBadge = document.createElement("span");
      difficultyBadge.className = "difficulty-badge";
      difficultyBadge.textContent = problemInfo.difficulty.trim();
      difficultyBadge.style.cssText = `
        background-color: ${difficultyColor};
        color: white;
        font-size: 0.7em;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: bold;
      `;

      headerInfo.appendChild(difficultyBadge);
    }

    headerInfo.appendChild(dateElement);

    // Right side: Action buttons (edit and delete)
    const actionButtons = document.createElement("div");
    actionButtons.className = "history-item-actions";
    // Remove any spacing between buttons
    actionButtons.style.display = "flex";
    actionButtons.style.gap = "0";

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
      handleDeleteClick(e, index, problemName);
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
    // Check if this item is already being edited
    if (historyItem.querySelector(".edit-container")) {
      // Already being edited, don't spawn another editor
      return;
    }

    const contentElement = historyItem.querySelector(".history-item-content");
    const collapsedElement = historyItem.querySelector(".collapsed-content");
    const originalContent = contentElement.textContent;

    // Hide the toggle button if it exists
    const toggleButton = historyItem.querySelector(".toggle-collapse");
    if (toggleButton) {
      toggleButton.style.display = "none";
    }

    // Create edit form for content only (not for problem name)
    const contentTextarea = document.createElement("textarea");
    contentTextarea.className = "edit-content-textarea";
    contentTextarea.value = originalContent;
    // Style the textarea to fill the container with proper padding
    contentTextarea.style.width = "100%";
    contentTextarea.style.boxSizing = "border-box";
    contentTextarea.style.padding = "10px";
    contentTextarea.style.minHeight = "120px";
    contentTextarea.style.resize = "vertical";
    contentTextarea.style.border = "1px solid #ddd";
    contentTextarea.style.borderRadius = "4px";
    contentTextarea.style.marginBottom = "10px";

    // Ensure content is visible
    contentElement.style.display = "none";
    collapsedElement.style.display = "none";

    // Create edit container
    const editContainer = document.createElement("div");
    editContainer.className = "edit-container";
    // Style the container to use the full width with consistent padding
    editContainer.style.padding = "15px";
    editContainer.style.width = "100%";
    editContainer.style.boxSizing = "border-box";
    editContainer.appendChild(contentTextarea);

    // Create buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "edit-buttons";
    // Align buttons to the right with proper spacing
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.justifyContent = "flex-end";
    buttonsContainer.style.gap = "10px";

    // Save button
    const saveButton = document.createElement("button");
    saveButton.className = "edit-save-button";
    saveButton.textContent = "Save";
    // Style the save button
    saveButton.style.padding = "6px 12px";
    saveButton.style.backgroundColor = "#4CAF50";
    saveButton.style.color = "white";
    saveButton.style.border = "none";
    saveButton.style.borderRadius = "4px";
    saveButton.style.cursor = "pointer";
    saveButton.addEventListener("click", function () {
      // Pass only the content to saveEdits, not changing the title
      saveEdits(index, entry.problemName, contentTextarea.value);

      // Show the toggle button again if it exists
      if (toggleButton) {
        toggleButton.style.display = "block";
      }
    });

    // Cancel button
    const cancelButton = document.createElement("button");
    cancelButton.className = "edit-cancel-button";
    cancelButton.textContent = "Cancel";
    // Style the cancel button
    cancelButton.style.padding = "6px 12px";
    cancelButton.style.backgroundColor = "#f1f1f1";
    cancelButton.style.border = "1px solid #ddd";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.cursor = "pointer";
    cancelButton.addEventListener("click", function () {
      cancelEdits(historyItem, entry.problemName, originalContent);

      // Show the toggle button again if it exists
      if (toggleButton) {
        toggleButton.style.display = "block";
      }
    });

    // Add buttons to container
    buttonsContainer.appendChild(saveButton);
    buttonsContainer.appendChild(cancelButton);
    editContainer.appendChild(buttonsContainer);

    // Add edit container to history item
    historyItem.appendChild(editContainer);

    // Focus the textarea
    contentTextarea.focus();
  }

  /**
   * Save edits to a history item
   * @param {number} index - The index of the entry
   * @param {string} originalTitle - The original title (unchanged)
   * @param {string} newContent - The new content
   */
  function saveEdits(index, originalTitle, newContent) {
    chrome.storage.local.get(["savedFeedback"], function (result) {
      const savedFeedback = result.savedFeedback || [];

      if (index >= 0 && index < savedFeedback.length) {
        // Update the entry - only change the summary content, not the title
        const entry = savedFeedback[index];

        // Update the summary only
        entry.summary = newContent;

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
   * @param {string} originalTitle - The original title (unused but kept for compatibility)
   * @param {string} originalContent - The original content
   */
  function cancelEdits(historyItem, originalTitle, originalContent) {
    // Remove the edit container
    const editContainer = historyItem.querySelector(".edit-container");
    if (editContainer) {
      historyItem.removeChild(editContainer);
    }

    // Show the toggle button again if it exists
    const toggleButton = historyItem.querySelector(".toggle-collapse");
    if (toggleButton) {
      toggleButton.style.display = "block";
    }

    // Restore original content
    const contentElement = historyItem.querySelector(".history-item-content");
    const collapsedElement = historyItem.querySelector(".collapsed-content");

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

  /**
   * Handle delete button click with confirmation
   * @param {Event} e - The click event
   * @param {number} index - The index of the entry to delete
   * @param {string} problemName - The problem name for confirmation text
   */
  function handleDeleteClick(e, index, problemName) {
    e.stopPropagation();

    // Remove any existing confirmation dialogs first
    const existingDialogs = document.querySelectorAll(".confirm-delete-dialog");
    existingDialogs.forEach((dialog) => {
      if (dialog && dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }
    });

    // Create confirmation dialog
    const confirmDialog = document.createElement("div");
    confirmDialog.className = "confirm-delete-dialog";
    confirmDialog.style.position = "absolute";
    confirmDialog.style.backgroundColor = "#fff";
    confirmDialog.style.border = "1px solid #ddd";
    confirmDialog.style.borderRadius = "4px";
    confirmDialog.style.padding = "12px";
    confirmDialog.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    confirmDialog.style.zIndex = "100";
    confirmDialog.style.width = "220px";

    // Position dialog near the delete button
    const rect = e.target
      .closest(".history-item-delete")
      .getBoundingClientRect();
    confirmDialog.style.top = `${rect.bottom + 5}px`;
    confirmDialog.style.right = `10px`;

    // Create confirmation message
    const confirmMessage = document.createElement("p");
    confirmMessage.style.margin = "0 0 12px 0";
    confirmMessage.style.fontSize = "14px";
    confirmMessage.textContent = `Are you sure you want to delete this feedback?`;
    confirmDialog.appendChild(confirmMessage);

    // Create buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.gap = "8px";
    buttonsContainer.style.justifyContent = "flex-end";

    // Safe remove function to prevent errors
    const safeRemoveDialog = () => {
      if (confirmDialog && confirmDialog.parentNode) {
        confirmDialog.parentNode.removeChild(confirmDialog);
      }
    };

    // Cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.padding = "6px 12px";
    cancelButton.style.border = "1px solid #ddd";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.backgroundColor = "#f5f5f5";
    cancelButton.style.cursor = "pointer";
    cancelButton.addEventListener("click", () => {
      // Just remove the dialog
      safeRemoveDialog();
    });

    // Confirm button
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Delete";
    confirmButton.style.padding = "6px 12px";
    confirmButton.style.border = "1px solid #f56565";
    confirmButton.style.borderRadius = "4px";
    confirmButton.style.backgroundColor = "#f56565";
    confirmButton.style.color = "white";
    confirmButton.style.cursor = "pointer";
    confirmButton.addEventListener("click", () => {
      // Remove the dialog
      safeRemoveDialog();
      // Proceed with deletion
      deleteFeedbackEntry(index);
    });

    // Add buttons to container
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(confirmButton);
    confirmDialog.appendChild(buttonsContainer);

    // Add to body
    document.body.appendChild(confirmDialog);

    // Close when clicking outside
    setTimeout(() => {
      const closeDialogListener = function (event) {
        if (
          !confirmDialog.contains(event.target) &&
          !event.target.closest(".history-item-delete")
        ) {
          safeRemoveDialog();
          document.removeEventListener("click", closeDialogListener);
        }
      };

      document.addEventListener("click", closeDialogListener);

      // Cleanup if dialog is removed/deleted another way
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (!document.body.contains(confirmDialog)) {
            document.removeEventListener("click", closeDialogListener);
            observer.disconnect();
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }, 10);
  }
});
