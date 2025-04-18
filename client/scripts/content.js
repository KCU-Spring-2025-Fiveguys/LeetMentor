// This script extracts the code from a LeetCode problem page when a button is clicked, and sends the code to a server for analysis.

// Function to extract code from the LeetCode Monaco editor
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

// Function to send extracted code to the local server
function sendCodeToServer(code) {
  // Check if code is empty or null
  if (!code || code.trim() === "") {
    return Promise.reject(
      new Error(
        "Cannot send empty code. Please make sure code is present in the editor."
      )
    );
  }

  console.log("Sending code:", code);

  return fetch("https://leetmentor.vercel.app/get_hint/1/python", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_code: code }),
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

// Function to expand the button to show the hint
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

// Function to add a help button next to "Wrong Answer" results
function addHelpButton(resultElement) {
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
  helpButton.textContent = "Need a Hint ?";
  helpButton.className = "leetcode-helper-button";
  helpButton.style.cssText = `
    background-color: rgb(89, 128, 248);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 6px 16px;
    margin-left: 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    transition: background-color 0.2s ease;
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
      helpButton.style.backgroundColor = "rgb(66, 113, 244)";
    }
  });
  helpButton.addEventListener("mouseout", () => {
    if (helpButton.dataset.expanded !== "true") {
      helpButton.style.backgroundColor = "rgb(89, 128, 248)";
    }
  });

  // Add click event to the help button
  helpButton.addEventListener("click", () => {
    // If already expanded, just return
    if (helpButton.dataset.expanded === "true") return;

    // If loading, also return
    if (helpButton.disabled) return;

    // Store original text and disable button
    const originalText = helpButton.textContent;
    helpButton.textContent = "Loading...";
    helpButton.disabled = true;
    helpButton.style.opacity = "0.7";
    helpButton.style.cursor = "not-allowed";

    const code = extractCode();
    if (code) {
      sendCodeToServer(code)
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
  });

  // Add the button next to the result element
  resultElement.parentNode.insertBefore(helpButton, resultElement.nextSibling);
  console.log("Help button added next to:", resultElement.textContent);
}

// Function to monitor DOM changes for result elements
function monitorResults() {
  console.log("Result monitoring started");

  // Check for existing result elements immediately
  checkForResultElements();

  // Create a more aggressive mutation observer that checks more frequently
  const observer = new MutationObserver((mutations) => {
    // Always check for result elements on any DOM change
    checkForResultElements();
  });

  // Start observing the entire document for changes with more complete options
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true, // Also watch for attribute changes
    attributeFilter: ["class", "data-e2e-locator"], // Filter to relevant attributes
  });
}

// Function to check for result elements in the DOM
function checkForResultElements() {
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
      addHelpButton(element);
      console.log("Added new help button for:", element);
    }
  });
}

// Initialize result monitoring right away
monitorResults();

// Also initialize on DOMContentLoaded for safety
window.addEventListener("DOMContentLoaded", () => {
  // Double-check that our monitoring is active
  if (!document.querySelector(".leetcode-helper-button")) {
    monitorResults();
  }
});

// Listen for messages from the popup and background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractCode") {
    const code = extractCode();
    if (code) {
      sendCodeToServer(code)
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
