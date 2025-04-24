# LeetCode Code Extractor

A Chrome extension that extracts the original source code from LeetCode problem pages.

## Features

### Manual Code Extraction

- Extract code from any LeetCode problem page by clicking the extension icon
- Code is displayed in a popup window with syntax highlighting
- One-click copy to clipboard functionality

### Automatic Error Monitoring

- Automatically monitors the results panel when code is run on LeetCode
- If the result is anything other than "Accepted" (e.g., "Runtime Error", "Wrong Answer"), the code is automatically extracted
- Helps you quickly review and debug your code when errors occur

## Installation

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" and select the directory containing this extension
5. The extension should now appear in your Chrome toolbar

## Usage

### Manual Extraction

1. Navigate to any LeetCode problem page
2. Click the extension icon in your toolbar
3. The original source code will be extracted and displayed in a popup window
4. Use the "Copy to Clipboard" button to copy the code

### Automatic Error Monitoring

1. Navigate to any LeetCode problem page
2. Work on your solution in the LeetCode editor
3. Click the "Run" button in LeetCode
4. If your code produces any result other than "Accepted", the extension will automatically extract and display your code in a popup

## Technical Details

The extension works by:

1. Identifying the code container element with class "view-lines monaco-mouse-cursor-text"
2. Extracting the text content from each line
3. Reconstructing the original source code format
4. Displaying the result in a popup with syntax highlighting

For the automatic error monitoring:

1. A MutationObserver watches for changes in the results panel
2. When changes are detected, the extension checks if the result is not "Accepted"
3. If an error is detected, the extension automatically extracts and displays the code

## License

MIT
