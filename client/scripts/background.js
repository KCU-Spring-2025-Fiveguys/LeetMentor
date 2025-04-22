// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes("leetcode.com/problems/")) {
    chrome.tabs.sendMessage(tab.id, { action: "extractCode" });
  } else {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        alert(
          "Please navigate to a LeetCode problem page to use this extension."
        );
      },
    });
  }
});

// Check if Chrome APIs are available
if (typeof chrome !== "undefined") {
  // Handle alarms
  if (chrome.alarms) {
    chrome.alarms.onAlarm.addListener((alarm) => {
      // Check if the alarm name matches our pattern (leetcodeReminder_X where X is the day index)
      if (alarm.name.startsWith("leetcodeReminder_")) {
        // Extract the day index from the alarm name
        const dayIndex = parseInt(alarm.name.split("_")[1]);
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const dayName = dayNames[dayIndex];

        // Check if notifications API is available
        if (chrome.notifications) {
          // Show a notification
          chrome.notifications.create({
            type: "basic",
            iconUrl: "../icons/icon.png",
            title: "LeetMentor Reminder",
            message: "Time to solve LeetCode!",
            contextMessage: `It's ${dayName} practice time`,
            priority: 2,
          });
        } else {
          console.error("Notifications API not available");
        }

        // No need to clear storage, as these are recurring alarms
      } else if (alarm.name === "leetcodeReminder") {
        // Handle legacy single-alarm case for backward compatibility
        if (chrome.notifications) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "../icons/icon.png",
            title: "LeetMentor Reminder",
            message: "Time to solve LeetCode!",
            priority: 2,
          });
        } else {
          console.error("Notifications API not available");
        }

        // Clear the stored reminder data for legacy alarms
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove(["reminderDate", "reminderTime"]);
        } else {
          console.error("Storage API not available");
        }
      }
    });
  } else {
    console.error("Alarms API not available");
  }
} else {
  console.error("Chrome APIs not available in this context");
}
