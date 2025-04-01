// When popup opens, get the selected text from storage
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["selectedText"], (result) => {
    const selectedTextElement = document.getElementById("selectedText");
    if (result.selectedText) {
      selectedTextElement.textContent = result.selectedText;
    }
  });
});
