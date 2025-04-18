// This script extracts the code from a LeetCode problem page when a button is clicked, and displays the extracted code in an overlay.

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
  fetch("http://127.0.0.1:8000/get_hint/1/python", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
      alert("Code sent successfully to server!");
    })
    .catch((error) => {
      console.error("Error sending code to server:", error);
      alert("Failed to send code to server. Check console for details.");
    });
}

// Function to display extracted code in an overlay
function displayExtractedCode(code) {
  // Create overlay container
  const overlay = document.createElement("div");
  overlay.className = "leetcode-extractor-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
  `;

  // Create content container
  const container = document.createElement("div");
  container.className = "leetcode-extractor-container";
  container.style.cssText = `
    background-color: white;
    border-radius: 8px;
    width: 80%;
    max-width: 800px;
    max-height: 80%;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    overflow: auto;
    position: relative;
  `;

  // Create header with title and buttons
  const header = document.createElement("div");
  header.innerHTML = "<h2>Extracted Code</h2>";
  header.style.cssText = `
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  // Create Close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.cssText = `
    background-color: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  `;
  closeButton.onclick = () => document.body.removeChild(overlay);
  header.appendChild(closeButton);

  // Create Copy Code button
  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy Code";
  copyButton.style.cssText = `
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;
  `;
  copyButton.onclick = () => {
    navigator.clipboard.writeText(code).then(() => {
      copyButton.textContent = "Copied!";
      setTimeout(() => {
        copyButton.textContent = "Copy Code";
      }, 2000);
    });
  };
  header.insertBefore(copyButton, closeButton);

  // Create pre element to show the code
  const pre = document.createElement("pre");
  pre.style.cssText = `
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
    overflow: auto;
    white-space: pre-wrap;
    font-family: monospace;
  `;
  pre.textContent = code;

  // Assemble the overlay
  container.appendChild(header);
  container.appendChild(pre);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

// Function to handle manual extraction when the button is clicked
function handleManualExtraction() {
  const code = extractCode();
  if (code) {
    displayExtractedCode(code);
  } else {
    alert(
      "Failed to extract code. Please ensure you are on a LeetCode problem page."
    );
  }
}

// Function to create and add an extraction button to the page
function createExtractionButton() {
  const button = document.createElement("button");
  button.textContent = "Extract Code";
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 10000;
  `;
  button.addEventListener("click", handleManualExtraction);
  document.body.appendChild(button);
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
  helpButton.textContent = "Need a hint?";
  helpButton.className = "leetcode-helper-button";
  helpButton.style.cssText = `
    background-color: #4285F4;
    color: white;
    border: none;
    padding: 4px 12px;
    border-radius: 4px;
    margin-left: 10px;
    font-size: 14px;
    cursor: pointer;
  `;

  // Add click event to the help button
  helpButton.addEventListener("click", () => {
    const code = extractCode();
    if (code) {
      sendCodeToServer(code);
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

  const observer = new MutationObserver((mutations) => {
    let hasRelevantChanges = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList" || mutation.type === "characterData") {
        hasRelevantChanges = true;
        break;
      }
    }

    if (hasRelevantChanges) {
      checkForResultElements();
    }
  });

  // Start observing the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// Function to check for result elements in the DOM
function checkForResultElements() {
  // Try multiple possible selectors for result elements
  const possibleSelectors = [
    '[data-e2e-locator="console-result"]',
    ".text-xl.font-medium.text-red-s",
    ".text-red-s",
    '.text-xl:contains("Wrong Answer")',
    'div:contains("Wrong Answer")',
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

    if (text === "Wrong Answer") {
      addHelpButton(element);
    }
  });
}

// Initialize the extraction button and result monitoring right away
createExtractionButton();
monitorResults();

// Also initialize on DOMContentLoaded for safety
window.addEventListener("DOMContentLoaded", () => {
  // Double-check that our monitoring is active
  if (!document.querySelector(".leetcode-helper-button")) {
    createExtractionButton();
    monitorResults();
  }
});

// Listen for messages from the popup and background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractCode") {
    const code = extractCode();
    if (code) {
      sendCodeToServer(code);
      sendResponse({ status: "success" });
    } else {
      sendResponse({ status: "error" });
    }
    return true;
  }
});
