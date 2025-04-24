// Set up alarm for checking LeetCode reminders
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated");

  // Setup a daily alarm for checking reminders
  chrome.alarms.create("checkLeetCodeReminders", {
    periodInMinutes: 60, // Check hourly
  });

  // Clean up old feedback drafts
  cleanupOldFeedbackDrafts();
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkLeetCodeReminders") {
    checkReminders();
  }
});

// Function to check if reminders should be shown
function checkReminders() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Format current time as HH:MM for comparison
  const currentTime = `${currentHour
    .toString()
    .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

  console.log("Checking reminders:", dayOfWeek, currentTime);

  // Get stored reminder settings
  chrome.storage.local.get(
    ["reminderTime", "reminderDays", "lastNotificationTime"],
    (result) => {
      const reminderTime = result.reminderTime;
      const reminderDays = result.reminderDays || [];
      const lastNotificationTime = result.lastNotificationTime || 0;

      console.log("Reminder settings:", reminderTime, reminderDays);

      // Check if today is a reminder day and it's time for the reminder
      if (
        reminderDays.includes(dayOfWeek) &&
        reminderTime &&
        shouldShowNotification(reminderTime, currentTime, lastNotificationTime)
      ) {
        // Show notification
        showReminderNotification();

        // Update last notification time
        chrome.storage.local.set({
          lastNotificationTime: Date.now(),
        });
      }
    }
  );
}

// Function to determine if notification should be shown based on time
function shouldShowNotification(
  reminderTime,
  currentTime,
  lastNotificationTime
) {
  // Parse times for comparison
  const [reminderHour, reminderMinute] = reminderTime.split(":").map(Number);
  const [currentHour, currentMinute] = currentTime.split(":").map(Number);

  // Calculate total minutes for easier comparison
  const reminderMinutes = reminderHour * 60 + reminderMinute;
  const currentMinutes = currentHour * 60 + currentMinute;

  // Only show notification if within the reminder hour
  const isReminderHour = currentHour === reminderHour;

  // Don't show notification more than once per day (24 hours)
  const notificationRecently =
    Date.now() - lastNotificationTime < 23 * 60 * 60 * 1000; // 23 hours

  console.log(
    "Time check:",
    isReminderHour,
    notificationRecently,
    reminderMinutes,
    currentMinutes
  );

  return isReminderHour && !notificationRecently;
}

// Function to show the reminder notification
function showReminderNotification() {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "../icons/icon.png",
    title: "LeetCode Practice Reminder",
    message: "It's time for your daily coding practice on LeetCode!",
    priority: 2,
  });
}

/**
 * Clean up feedback drafts older than 24 hours
 */
function cleanupOldFeedbackDrafts() {
  chrome.storage.local.get(["feedbackDrafts"], function (result) {
    const feedbackDrafts = result.feedbackDrafts || {};
    const currentTime = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    let hasChanges = false;

    // Iterate through problem names
    Object.keys(feedbackDrafts).forEach((key) => {
      // Skip non-timestamp keys
      if (!key.endsWith("_timestamp")) return;

      const problemName = key.replace("_timestamp", "");
      const timestamp = feedbackDrafts[key];

      // Check if the draft is older than 24 hours
      if (currentTime - timestamp > oneDayInMs) {
        // Remove the draft and its timestamp
        delete feedbackDrafts[problemName];
        delete feedbackDrafts[key];
        hasChanges = true;
        console.log(`Removed old feedback draft for ${problemName}`);
      }
    });

    // Save changes if any drafts were removed
    if (hasChanges) {
      chrome.storage.local.set({ feedbackDrafts }, function () {
        console.log("Cleaned up old feedback drafts");
      });
    }
  });
}

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
