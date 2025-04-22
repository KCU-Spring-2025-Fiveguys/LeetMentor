// Main content script for the LeetCode Code Extractor extension
// This script orchestrates the functionality by importing and using the modular components

// =============== EXTRACTION FUNCTIONS ===============
/**
 * Extract the problem Name from the LeetCode problem page
 * @returns {string|null} - The problem Name or null if not found
 */
function extractProblemName() {
  // Try to get the problem name from the title element
  const titleElement = document.querySelector("title");
  if (titleElement) {
    const titleText = titleElement.textContent;
    const match = titleText.match(/^(.*?)\s-\sLeetCode$/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
}

/**
 * Extract the programming language from the LeetCode Monaco editor
 * @returns {string|null} - The language name or null if not found
 */
function extractLanguage() {
  // Find the language button based on the more specific class structure from the HTML
  // Target the first button in the flex container that contains the language selection
  const languageButton = document.querySelector(
    ".rounded.items-center.whitespace-nowrap.focus\\:outline-none.inline-flex.bg-transparent.dark\\:bg-dark-transparent.text-text-secondary.dark\\:text-text-secondary.active\\:bg-transparent.dark\\:active\\:bg-dark-transparent.hover\\:bg-fill-secondary.dark\\:hover\\:bg-fill-secondary.px-1\\.5.py-0\\.5.text-sm.font-normal.group"
  );
  if (!languageButton) {
    return null;
  }

  // Extract the text content before the chevron icon
  // The language is the text content before the div that contains the chevron
  const buttonText = languageButton.childNodes[0].textContent.trim();

  // Return the language name as is (not lowercased) to preserve proper format like "Python3"
  return buttonText;
}

/**
 * Extract code from the LeetCode Monaco editor
 * @returns {string|null} - The extracted code or null if not found
 */
function extractCode() {
  const linesContainer = document.querySelector(
    ".view-lines.monaco-mouse-cursor-text"
  );
  if (!linesContainer) {
    return null;
  }
  const lineElements = linesContainer.querySelectorAll(".view-line");
  const codeLines = Array.from(lineElements).map(
    (line) => line.textContent || ""
  );
  return codeLines.join("\n");
}

// =============== API FUNCTIONS ===============
/**
 * Send extracted code to the remote server for hint generation
 * @param {string} code - The extracted code from the editor
 * @param {string} language - The programming language used
 * @param {string} problem_name - The LeetCode problem name
 * @returns {Promise} - Promise that resolves with the server response
 */
function sendToServerHint(code, language, problem_name) {
  // Check if code is empty or null
  if (!code || code.trim() === "") {
    return Promise.reject(
      new Error(
        "Cannot send empty code. Please make sure code is present in the editor."
      )
    );
  }

  console.log("Sending code:", code);
  console.log("Language:", language);
  console.log("Problem name:", problem_name);

  return fetch("https://leetmentor.vercel.app/get_hint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_code: code,
      language: language,
      problem_name: problem_name,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        // Try to get detailed error message
        const errorText = await response.text();
        console.error("Error response:", response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
      return data;
    })
    .catch((error) => {
      console.error("Error sending code to server:", error);
      throw error; // Re-throw to propagate to the caller
    });
}

/**
 * Send extracted code to the remote server for improvement generation
 * @param {string} code - The extracted code from the editor
 * @param {string} language - The programming language used
 * @param {string} problem_name - The LeetCode problem name
 * @returns {Promise} - Promise that resolves with the server response
 */
function sendToServerImprovement(code, language, problem_name) {
  // Check if code is empty or null
  if (!code || code.trim() === "") {
    return Promise.reject(
      new Error(
        "Cannot send empty code. Please make sure code is present in the editor."
      )
    );
  }

  console.log("Sending code:", code);
  console.log("Language:", language);
  console.log("Problem name:", problem_name);

  return fetch("https://leetmentor.vercel.app/get_improvement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_code: code,
      language: language,
      problem_name: problem_name,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        // Try to get detailed error message
        const errorText = await response.text();
        console.error("Error response:", response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
      return data;
    })
    .catch((error) => {
      console.error("Error sending code to server:", error);
      throw error; // Re-throw to propagate to the caller
    });
}

/**
 * Send the problem name to the remote server for follow-up question generation
 * @param {string} problem_name - The LeetCode problem name
 * @returns {Promise} - Promise that resolves with the server response
 */
function sendToServerFollowUp(problem_name) {
  // Check if code is empty or null
  console.log("Problem name:", problem_name);

  return fetch("https://leetmentor.vercel.app/get_follow_up", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      problem_name: problem_name,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        // Try to get detailed error message
        const errorText = await response.text();
        console.error("Error response:", response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
      return data;
    })
    .catch((error) => {
      console.error("Error sending code to server:", error);
      throw error; // Re-throw to propagate to the caller
    });
}

// =============== UI COMPONENTS ===============
/**
 * Expand a button to show a hint
 * @param {HTMLElement} button - The button element to expand
 * @param {string} hintText - The hint text to display
 */
function expandButtonWithHint(button, hintText) {
  // Store original button properties before any changes
  if (!button.dataset.originalWidth) {
    button.dataset.originalWidth = button.offsetWidth + "px";
    button.dataset.originalHeight = button.offsetHeight + "px";
    button.dataset.originalText = button.textContent;
    button.dataset.originalPadding = window.getComputedStyle(button).padding;
  }

  // Capture the current position in the document flow before any changes
  const rect = button.getBoundingClientRect();

  // Set initial position to absolute to fix the top-left corner
  button.style.position = "absolute";
  button.style.top = rect.top + "px";
  button.style.left = rect.left + "px";
  button.style.margin = "0";
  button.style.zIndex = "1000";

  // Create a container for the hint text and close button
  const hintContainer = document.createElement("div");
  hintContainer.className = "hint-content";
  hintContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    width: 100%;
  `;

  // Create header with close button
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    width: 100%;
  `;

  const title = document.createElement("div");
  title.textContent = "Hint";
  title.style.cssText = `
    font-weight: 600;
    font-size: 16px;
    color: white;
  `;

  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: white;
    line-height: 1;
    padding: 0 4px;
  `;

  // Close button click handler - removes the button entirely
  closeButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent triggering the main button click
    document.body.removeChild(button);
  });

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create content for the hint
  const content = document.createElement("div");
  content.textContent = hintText;
  content.style.cssText = `
    text-align: left;
    margin-top: 8px;
    width: 100%;
    overflow-wrap: break-word;
    font-size: 14px;
    color: white;
    line-height: 1.5;
  `;

  // Assemble the hint container
  hintContainer.appendChild(header);
  hintContainer.appendChild(content);

  // Clear button content and add the hint container
  button.innerHTML = "";
  button.appendChild(hintContainer);

  // Force browser reflow to ensure proper animation start
  void button.offsetWidth;

  // Take the button out of normal flow to prevent layout shifts
  const originalParent = button.parentElement;
  document.body.appendChild(button);

  // Apply expanded styles with transition - right and down diagonal expansion
  button.style.transition =
    "width 0.8s ease-out, height 0.8s ease-out, padding 0.8s ease-out, background-color 0.8s ease-out, box-shadow 0.8s ease-out";
  button.style.transformOrigin = "top left"; // Ensure expansion happens from top-left
  button.style.width = "320px";
  button.style.height = "auto";
  button.style.minHeight = "120px";
  button.style.textAlign = "left";
  button.style.padding = "12px";
  button.style.whiteSpace = "normal";
  button.style.alignItems = "flex-start";
  button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
  button.style.backgroundColor = "rgb(66, 113, 244)"; // Slightly darker blue

  // Store expanded state
  button.dataset.expanded = "true";
}

/**
 * Create and add a help button next to "Wrong Answer" results
 * @param {HTMLElement} resultElement - The result element to add the button next to
 * @param {function} clickHandler - The function to call when the button is clicked
 */
function addHelpButton(resultElement, clickHandler) {
  // Check if button already exists
  if (
    resultElement.nextElementSibling &&
    resultElement.nextElementSibling.classList.contains(
      "leetcode-helper-button"
    )
  ) {
    return;
  }

  // Create the help button
  const helpButton = document.createElement("button");
  helpButton.textContent = "💡 View Hint";
  helpButton.className = "leetcode-helper-button";
  helpButton.style.cssText = `
    background-color: rgb(89, 128, 248);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0 12px;
    margin-left: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  `;

  // Add hover effect
  helpButton.addEventListener("mouseover", () => {
    if (helpButton.dataset.expanded !== "true") {
      helpButton.style.backgroundColor = "rgb(66, 113, 244)"; // Slightly darker blue
      helpButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
      helpButton.style.transform = "translateY(-2px)";
    }
  });
  helpButton.addEventListener("mouseout", () => {
    if (helpButton.dataset.expanded !== "true") {
      helpButton.style.backgroundColor = "rgb(89, 128, 248)";
      helpButton.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
      helpButton.style.transform = "translateY(0)";
    }
  });

  // Add click event to the help button
  helpButton.addEventListener("click", () => {
    // If already expanded, just return
    if (helpButton.dataset.expanded === "true") return;

    // If loading, also return
    if (helpButton.disabled) return;

    // Call the provided click handler
    clickHandler(helpButton);
  });

  // Add the button next to the result element
  resultElement.parentNode.insertBefore(helpButton, resultElement.nextSibling);
  console.log("Help button added next to:", resultElement.textContent);

  return helpButton;
}

/**
 * Create and add a placeholder button next to "Accepted" results
 * @param {HTMLElement} resultElement - The result element to add the button next to
 */
function addAcceptedButton(resultElement) {
  // Check if button already exists
  if (
    resultElement.nextElementSibling &&
    resultElement.nextElementSibling.classList.contains(
      "leetcode-accepted-button"
    )
  ) {
    return;
  }

  // Create the accepted button
  const acceptedButton = document.createElement("button");
  acceptedButton.textContent = "Optimize My Solution";
  acceptedButton.className = "leetcode-accepted-button";
  acceptedButton.style.cssText = `
    background-color: #FFA116;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0 10px;
    margin-left: 2px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  `;

  // Add icon to the button
  const buttonContent = document.createElement("span");
  buttonContent.style.cssText = `
    display: flex;
    align-items: center;
    gap: 4px;
  `;

  const icon = document.createElement("span");
  icon.textContent = "🚀";
  icon.style.cssText = `
    font-size: 14px;
    line-height: 1;
  `;

  const text = document.createElement("span");
  text.textContent = "Optimize My Solution";

  // Assemble button content
  buttonContent.appendChild(icon);
  buttonContent.appendChild(text);
  acceptedButton.textContent = ""; // Clear default text
  acceptedButton.appendChild(buttonContent);

  // Add hover effect
  acceptedButton.addEventListener("mouseover", () => {
    if (acceptedButton.dataset.expanded !== "true") {
      acceptedButton.style.backgroundColor = "#FFB346"; // Lighter orange
      acceptedButton.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
    }
  });
  acceptedButton.addEventListener("mouseout", () => {
    if (acceptedButton.dataset.expanded !== "true") {
      acceptedButton.style.backgroundColor = "#FFA116";
      acceptedButton.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
    }
  });

  // Add click event to the help button
  acceptedButton.addEventListener("click", () => {
    // If already expanded, just return
    if (acceptedButton.dataset.expanded === "true") return;

    // If loading, also return
    if (acceptedButton.disabled) return;

    // Call the improvement handler
    handleImprovementButtonClick(acceptedButton);
  });

  // Add the button next to the result element
  resultElement.parentNode.insertBefore(
    acceptedButton,
    resultElement.nextSibling
  );
  console.log("Accepted button added next to:", resultElement.textContent);

  return acceptedButton;
}

/**
 * Create and add a UI panel below the "Accepted" result and above the Code section
 * @param {HTMLElement} resultElement - The result element to add the panel below
 */
function addAcceptedPanel(resultElement) {
  // Check if panel already exists
  const existingPanel = document.querySelector(".leetcode-solution-panel");
  if (existingPanel) {
    return;
  }

  // Look for the flex container with the Code section - using the exact class structure in the UI
  const codeSection = document.querySelector(
    "div.flex.flex-col > div.flex.items-center.justify-between.pb-2 > div.flex.items-center.gap-2 > div.bg-divider-2"
  );

  if (!codeSection) {
    console.error("Could not find Code section with divider element");
    return;
  }

  // Navigate up to the main flex container that holds the code section
  const codeContainer = codeSection.closest(".flex.flex-col");

  if (!codeContainer) {
    console.error("Could not find Code section container");
    return;
  }

  // Get the parent container that will hold our panel
  const parentContainer = codeContainer.parentNode;
  if (!parentContainer) {
    console.error("Cannot find parent container for Code section");
    return;
  }

  // Create the panel container with prominent styling
  const panel = document.createElement("div");
  panel.className = "leetcode-solution-panel";
  panel.style.cssText = `
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin: 0 0 16px 0;
    padding: 16px;
    background-color: white;
    width: 100%;
    box-sizing: border-box;
    min-height: 120px;
    display: block !important;
    position: relative;
    z-index: 5;
    opacity: 1;
    visibility: visible;
  `;

  // Use dark mode styling if needed
  if (
    document.body.classList.contains("dark") ||
    document.documentElement.classList.contains("dark") ||
    document.querySelector('html[data-theme="dark"]')
  ) {
    panel.style.backgroundColor = "#262626";
    panel.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  }

  // Initial panel header
  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div style="font-weight: 600; font-size: 16px; color: #3182ce;">Follow-up Question</div>
    </div>
    <div id="panel-content" style="min-height: 80px; width: 100%;"></div>
  `;

  // Insert the panel directly before the Code section
  parentContainer.insertBefore(panel, codeContainer);

  // Create content container for easier updates
  const contentContainer = panel.querySelector("#panel-content");

  // Show loading spinner using LeetCode styles
  function showLoadingState() {
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100px; width: 100%;">
        <div class="animate-spin" style="height: 24px; width: 24px; border-radius: 50%; border: 3px solid rgba(0, 0, 0, 0.1); border-top-color: #3182ce; margin-bottom: 12px;"></div>
        <div style="color: #666; font-size: 14px;">Loading follow-up question...</div>
      </div>
    `;

    // Adjust spinner color for dark mode
    if (
      document.body.classList.contains("dark") ||
      document.documentElement.classList.contains("dark") ||
      document.querySelector('html[data-theme="dark"]')
    ) {
      const spinner = contentContainer.querySelector(".animate-spin");
      if (spinner) {
        spinner.style.borderColor = "rgba(255, 255, 255, 0.1)";
        spinner.style.borderTopColor = "#3182ce";
      }
    }
  }

  // Show error message
  function showError(message) {
    contentContainer.innerHTML = `
      <div style="padding: 16px; text-align: center; color: #e53e3e; border: 1px dashed #e53e3e; border-radius: 4px;">
        <div style="font-weight: 500; margin-bottom: 8px;">Error</div>
        <div>${
          message ||
          "Failed to load follow-up question. Please try again later."
        }</div>
      </div>
    `;
  }

  // Display follow-up question
  function showFollowUpQuestion(questionText) {
    contentContainer.innerHTML = `
      <div style="padding: 12px; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 4px; background-color: rgba(0, 0, 0, 0.02);">
        <div style="line-height: 1.6; font-size: 14px;">${questionText}</div>
      </div>
    `;

    // Adjust styling for dark mode
    if (
      document.body.classList.contains("dark") ||
      document.documentElement.classList.contains("dark") ||
      document.querySelector('html[data-theme="dark"]')
    ) {
      const questionContainer = contentContainer.querySelector("div");
      if (questionContainer) {
        questionContainer.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
        questionContainer.style.borderColor = "rgba(255, 255, 255, 0.1)";
      }
    }
  }

  // Fetch follow-up question immediately after panel insertion
  function fetchFollowUpQuestion() {
    const problem_name = extractProblemName();
    if (!problem_name) {
      showError("Could not determine the problem name");
      return;
    }

    // Show loading indicator
    showLoadingState();

    // Fetch the follow-up question
    sendToServerFollowUp(problem_name)
      .then((data) => {
        if (data && data.response) {
          showFollowUpQuestion(data.response);
        } else {
          showError("Received empty response from server");
        }
      })
      .catch((error) => {
        console.error("Error fetching follow-up question:", error);
        showError(error.message);
      });
  }

  // Start fetching the follow-up question
  fetchFollowUpQuestion();

  // Force browser reflow for visibility
  void panel.offsetWidth;

  console.log(
    "Solution panel added above Code section with follow-up question loading"
  );

  return panel;
}

// =============== DOM OBSERVER FUNCTIONS ===============
/**
 * Check for result elements in the DOM that indicate Wrong Answer status
 * @param {function} onResultFound - Callback function when a Wrong Answer result is found
 */
function checkForResultElements(onResultFound) {
  // Try multiple possible selectors for result elements
  const possibleSelectors = [
    '[data-e2e-locator="console-result"]',
    ".text-xl.font-medium.text-red-s",
    ".text-red-s",
    'div:contains("Wrong Answer")',
    // Add more specific selectors based on leetcode's UI
    '[data-e2e-status="not-accepted"]',
    ".not-accepted",
    '[data-cy="submit-result"]',
  ];

  let resultElements = [];

  // Try each selector
  for (const selector of possibleSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        resultElements = [...elements];
        console.log(`Found results with selector: ${selector}`, elements);
        break;
      }
    } catch (e) {
      // Skip invalid selectors
      continue;
    }
  }

  // If no results found with specific selectors, try a more general approach
  if (resultElements.length === 0) {
    // Look for text content containing "Wrong Answer"
    const allElements = document.getElementsByTagName("*");
    for (const element of allElements) {
      if (
        element.childNodes.length === 1 &&
        element.childNodes[0].nodeType === Node.TEXT_NODE &&
        element.textContent.trim() === "Wrong Answer"
      ) {
        resultElements.push(element);
        console.log("Found result by text content:", element);
      }
    }
  }

  resultElements.forEach((element) => {
    const text = element.textContent.trim();
    console.log("Found result element:", text);

    // Check if a button is already present as a next sibling
    const nextSibling = element.nextElementSibling;
    if (
      nextSibling &&
      nextSibling.classList.contains("leetcode-helper-button")
    ) {
      console.log("Button already exists, skipping:", element);
      return;
    }

    if (text === "Wrong Answer" || text.includes("Wrong Answer")) {
      onResultFound(element);
      console.log("Called handler for:", element);
    }
  });
}

/**
 * Check for "Accepted" status elements in the DOM
 */
function checkForAcceptedElements() {
  // Look for elements with "Accepted" text using the data-locator attribute
  const acceptedElements = document.querySelectorAll(
    '[data-e2e-locator="submission-result"]'
  );

  acceptedElements.forEach((element) => {
    const text = element.textContent.trim();
    console.log("Found result element:", text);

    // Check if it's an "Accepted" result and a button is not already present
    if (text === "Accepted") {
      // Check if a button already exists
      const nextSibling = element.nextElementSibling;
      if (
        nextSibling &&
        nextSibling.classList.contains("leetcode-accepted-button")
      ) {
        console.log("Accepted button already exists, skipping:", element);
      } else {
        // Add the accepted button
        addAcceptedButton(element);
        console.log("Added new accepted button for:", element);
      }

      // Add the solution panel
      addAcceptedPanel(element);
    }
  });
}

/**
 * Start monitoring the DOM for result elements
 * @param {function} onResultFound - Callback function when a Wrong Answer result is found
 */
function monitorResults(onResultFound) {
  console.log("Result monitoring started");

  // Check for existing result elements immediately
  checkForResultElements(onResultFound);
  checkForAcceptedElements();

  // Create a more aggressive mutation observer that checks more frequently
  const observer = new MutationObserver((mutations) => {
    // Always check for result elements on any DOM change
    checkForResultElements(onResultFound);
    checkForAcceptedElements();
  });

  // Start observing the entire document for changes with more complete options
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true, // Also watch for attribute changes
    attributeFilter: ["class", "data-e2e-locator"], // Filter to relevant attributes
  });

  return observer;
}

// =============== MAIN FUNCTIONALITY ===============
// Function to handle the hint button click
function handleHintButtonClick(helpButton) {
  // Store original text and disable button
  const originalText = helpButton.textContent;
  helpButton.textContent = "Loading...";
  helpButton.disabled = true;
  helpButton.style.opacity = "0.7";
  helpButton.style.cursor = "not-allowed";

  const code = extractCode();
  const language = extractLanguage();
  const problem_name = extractProblemName();

  if (code) {
    sendToServerHint(code, language, problem_name)
      .then((data) => {
        // Re-enable button
        helpButton.disabled = false;
        helpButton.style.opacity = "1";
        helpButton.style.cursor = "pointer";

        // Expand button with hint
        if (data && data.response) {
          expandButtonWithHint(helpButton, data.response);
        } else {
          expandButtonWithHint(
            helpButton,
            "No specific hint available. Your code looks correct!"
          );
        }
      })
      .catch((error) => {
        // Re-enable button
        helpButton.disabled = false;
        helpButton.style.opacity = "1";
        helpButton.style.cursor = "pointer";

        // Show error in expanded button
        expandButtonWithHint(helpButton, `Error: ${error.message}`);
      });
  } else {
    // Re-enable button if code extraction failed
    helpButton.disabled = false;
    helpButton.style.opacity = "1";
    helpButton.style.cursor = "pointer";

    // Show error in expanded button
    expandButtonWithHint(
      helpButton,
      "Failed to extract code. Please ensure code is present in the editor."
    );
  }
}

// Function to handle when a wrong answer result is found
function handleWrongAnswerFound(resultElement) {
  addHelpButton(resultElement, handleHintButtonClick);
}

// Initialize result monitoring right away
monitorResults(handleWrongAnswerFound);

// Also initialize on DOMContentLoaded for safety
window.addEventListener("DOMContentLoaded", () => {
  // Double-check that our monitoring is active
  if (!document.querySelector(".leetcode-helper-button")) {
    monitorResults(handleWrongAnswerFound);
  }
});

// Listen for messages from the popup and background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractCode") {
    const code = extractCode();
    const language = extractLanguage();
    const problem_name = extractProblemName();
    if (code) {
      sendToServerHint(code, language, problem_name)
        .then(() => {
          sendResponse({ status: "success" });
        })
        .catch(() => {
          sendResponse({ status: "error" });
        });
      return true; // Indicate we'll respond asynchronously
    } else {
      sendResponse({ status: "error" });
      return true;
    }
  }
});

// Function to handle the improvement button click
function handleImprovementButtonClick(button) {
  // Store original text and disable button
  const originalText = button.textContent;
  button.textContent = "Loading...";
  button.disabled = true;
  button.style.opacity = "0.7";
  button.style.cursor = "not-allowed";

  const code = extractCode();
  const language = extractLanguage();
  const problem_name = extractProblemName();

  if (code) {
    sendToServerImprovement(code, language, problem_name)
      .then((data) => {
        // Re-enable button
        button.disabled = false;
        button.style.opacity = "1";
        button.style.cursor = "pointer";

        // Expand button with improvement suggestions
        if (data && data.response) {
          expandButtonWithImprovement(button, data.response);
        } else {
          expandButtonWithImprovement(
            button,
            "No specific improvement suggestions available. Your code looks great!"
          );
        }
      })
      .catch((error) => {
        // Re-enable button
        button.disabled = false;
        button.style.opacity = "1";
        button.style.cursor = "pointer";

        // Show error in expanded button
        expandButtonWithImprovement(button, `Error: ${error.message}`);
      });
  } else {
    // Re-enable button if code extraction failed
    button.disabled = false;
    button.style.opacity = "1";
    button.style.cursor = "pointer";

    // Show error in expanded button
    expandButtonWithImprovement(
      button,
      "Failed to extract code. Please ensure code is present in the editor."
    );
  }
}

/**
 * Expand a button to show improvement suggestions
 * @param {HTMLElement} button - The button element to expand
 * @param {string} improvementText - The improvement suggestions to display
 */
function expandButtonWithImprovement(button, improvementText) {
  // Store original button properties before any changes
  if (!button.dataset.originalWidth) {
    button.dataset.originalWidth = button.offsetWidth + "px";
    button.dataset.originalHeight = button.offsetHeight + "px";
    button.dataset.originalText = button.textContent;
    button.dataset.originalPadding = window.getComputedStyle(button).padding;
  }

  // Capture the current position in the document flow before any changes
  const rect = button.getBoundingClientRect();

  // Set initial position to absolute to fix the top-left corner
  button.style.position = "absolute";
  button.style.top = rect.top + "px";
  button.style.left = rect.left + "px";
  button.style.margin = "0";
  button.style.zIndex = "1000";

  // Create a container for the improvement text and close button
  const improvementContainer = document.createElement("div");
  improvementContainer.className = "improvement-content";
  improvementContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    width: 100%;
  `;

  // Create header with close button
  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    width: 100%;
  `;

  const title = document.createElement("div");
  title.textContent = "Optimization Suggestions";
  title.style.cssText = `
    font-weight: 600;
    font-size: 16px;
    color: white;
  `;

  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: white;
    line-height: 1;
    padding: 0 4px;
  `;

  // Close button click handler - removes the button entirely
  closeButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent triggering the main button click
    document.body.removeChild(button);
  });

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create content for the improvement suggestions
  const content = document.createElement("div");
  content.textContent = improvementText;
  content.style.cssText = `
    text-align: left;
    margin-top: 8px;
    width: 100%;
    overflow-wrap: break-word;
    font-size: 14px;
    color: white;
    line-height: 1.5;
  `;

  // Assemble the improvement container
  improvementContainer.appendChild(header);
  improvementContainer.appendChild(content);

  // Clear button content and add the improvement container
  button.innerHTML = "";
  button.appendChild(improvementContainer);

  // Force browser reflow to ensure proper animation start
  void button.offsetWidth;

  // Take the button out of normal flow to prevent layout shifts
  const originalParent = button.parentElement;
  document.body.appendChild(button);

  // Apply expanded styles with transition - right and down diagonal expansion
  button.style.transition =
    "width 0.8s ease-out, height 0.8s ease-out, padding 0.8s ease-out, background-color 0.8s ease-out, box-shadow 0.8s ease-out";
  button.style.transformOrigin = "top left"; // Ensure expansion happens from top-left
  button.style.width = "320px";
  button.style.height = "auto";
  button.style.minHeight = "120px";
  button.style.textAlign = "left";
  button.style.padding = "12px";
  button.style.whiteSpace = "normal";
  button.style.alignItems = "flex-start";
  button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
  button.style.backgroundColor = "#FFA116"; // Darker orange for expanded state

  // Store expanded state
  button.dataset.expanded = "true";
}
