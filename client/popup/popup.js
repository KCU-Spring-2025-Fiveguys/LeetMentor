document.addEventListener("DOMContentLoaded", function () {
  // UI Elements
  const timeInput = document.getElementById("reminder-time");
  const saveButton = document.getElementById("save-reminder");
  const saveButtonText = saveButton.querySelector("span");
  const statusMessage = document.getElementById("status-message");
  const dayButtons = document.querySelectorAll(".day-btn");
  const viewHistoryButton = document.getElementById("view-history");

  // State variables
  let selectedDays = [];
  let isChanged = false;

  // Initialize with default time
  initializeDefaultTime();

  // Load saved settings
  loadStoredSettings();

  // Set up event listeners
  setupEventListeners();

  // Functions
  function initializeDefaultTime() {
    // Set default time to current time + 1 hour
    const today = new Date();
    let defaultHour = today.getHours() + 1;
    if (defaultHour > 23) defaultHour = 23; // Cap at 23 hours
    const defaultTime = `${defaultHour.toString().padStart(2, "0")}:00`;
    if (timeInput) {
      timeInput.value = defaultTime;
    }
  }

  function loadStoredSettings() {
    // Check if chrome and storage APIs exist
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(
        ["reminderTime", "reminderDays"],
        function (result) {
          // Load saved time
          if (result.reminderTime && timeInput) {
            timeInput.value = result.reminderTime;
          }

          // Load saved days
          if (
            result.reminderDays &&
            Array.isArray(result.reminderDays) &&
            result.reminderDays.length > 0
          ) {
            selectedDays = result.reminderDays;

            // Update UI to reflect selected days
            selectedDays.forEach((dayIndex) => {
              const btn = document.querySelector(
                `.day-btn[data-day="${dayIndex}"]`
              );
              if (btn) {
                btn.classList.add("selected");
                btn.setAttribute("aria-pressed", "true");
              }
            });

            // Show status message
            if (statusMessage && result.reminderTime) {
              const daysText = getDaysText(selectedDays);
              statusMessage.textContent = `Reminders set for ${daysText} at ${formatTime(
                result.reminderTime
              )}`;
              statusMessage.classList.add("success");
            }
          }
        }
      );
    } else {
      console.warn("Chrome storage API not available");
      if (statusMessage) {
        statusMessage.textContent = "Storage API not available";
        statusMessage.classList.add("error");
      }
    }
  }

  function setupEventListeners() {
    // Day button click handlers
    dayButtons.forEach((btn) => {
      if (btn) {
        btn.addEventListener("click", function () {
          const dayIndex = parseInt(this.getAttribute("data-day"));

          if (this.classList.contains("selected")) {
            // Deselect the day
            this.classList.remove("selected");
            this.setAttribute("aria-pressed", "false");
            selectedDays = selectedDays.filter((day) => day !== dayIndex);
          } else {
            // Select the day
            this.classList.add("selected");
            this.setAttribute("aria-pressed", "true");
            selectedDays.push(dayIndex);
          }

          isChanged = true;
          resetSaveButton();
        });
      }
    });

    // Time input change handler
    if (timeInput) {
      timeInput.addEventListener("change", function () {
        isChanged = true;
        resetSaveButton();
      });
    }

    // Save button click handler
    if (saveButton) {
      saveButton.addEventListener("click", function () {
        if (!timeInput) {
          showStatus("Time input not found", "error");
          return;
        }

        const reminderTime = timeInput.value;

        if (!reminderTime) {
          showStatus("Please select a time", "error");
          return;
        }

        if (selectedDays.length === 0) {
          showStatus("Please select at least one day", "error");
          return;
        }

        // Sort the days array for consistent storage
        selectedDays.sort();

        // Check if chrome and storage APIs exist
        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          chrome.storage.local
        ) {
          // Save settings to storage
          chrome.storage.local.set(
            {
              reminderTime: reminderTime,
              reminderDays: selectedDays,
            },
            function () {
              // Check if alarms API exists
              if (chrome.alarms) {
                // Schedule alarms for each selected day
                scheduleRecurringAlarms(selectedDays, reminderTime);
              } else {
                console.warn("Alarms API not available");
              }

              // Update UI to show saved state
              updateSavedState();

              // Show success message
              const daysText = getDaysText(selectedDays);
              showStatus(
                `Reminders set for ${daysText} at ${formatTime(reminderTime)}`,
                "success"
              );

              // Reset change tracking
              isChanged = false;
            }
          );
        } else {
          console.error("Chrome storage API not available");
          showStatus(
            "Could not save settings: Storage API not available",
            "error"
          );
        }
      });
    }

    // View History button click handler
    if (viewHistoryButton) {
      viewHistoryButton.addEventListener("click", function () {
        // Check if chrome.sidePanel API exists
        if (typeof chrome !== "undefined" && chrome.sidePanel && chrome.tabs) {
          try {
            // Get the current active tab
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (tabs) {
                if (tabs && tabs.length > 0) {
                  // Open the side panel for the current tab
                  chrome.sidePanel
                    .open({ tabId: tabs[0].id })
                    .then(() => {
                      // Close the popup after opening the side panel
                      window.close();
                    })
                    .catch((err) => {
                      console.error("Error opening side panel:", err);
                      showStatus(
                        "Failed to open history panel: " + err.message,
                        "error"
                      );
                    });
                } else {
                  showStatus("Couldn't determine current tab", "error");
                }
              }
            );
          } catch (error) {
            console.error("Error opening side panel:", error);
            showStatus("Failed to open history panel", "error");
          }
        } else {
          console.warn("Chrome sidePanel API not available");
          showStatus("History panel not supported in this browser", "error");
        }
      });
    }
  }

  function scheduleRecurringAlarms(days, time) {
    // Check if alarms API exists
    if (typeof chrome !== "undefined" && chrome.alarms) {
      // Clear any existing alarms
      chrome.alarms.clearAll();

      // The days parameter contains day indices (0 = Sunday, 1 = Monday, etc.)
      const [hours, minutes] = time.split(":").map(Number);

      // Create a new alarm for each selected day
      days.forEach((dayIndex) => {
        const alarmName = `leetcodeReminder_${dayIndex}`;

        // Calculate when this alarm should next fire
        const now = new Date();
        const targetDay = new Date();

        // Set the target day to the next occurrence of the selected weekday
        const daysUntilTarget = (dayIndex - now.getDay() + 7) % 7;
        targetDay.setDate(now.getDate() + daysUntilTarget);

        // Set the target time
        targetDay.setHours(hours, minutes, 0, 0);

        // If the target time is in the past (same day but earlier time), add 7 days
        if (targetDay < now) {
          targetDay.setDate(targetDay.getDate() + 7);
        }

        // Calculate the minutes until the first alarm
        const delayInMinutes =
          (targetDay.getTime() - now.getTime()) / (1000 * 60);

        // Create a weekly recurring alarm
        chrome.alarms.create(alarmName, {
          delayInMinutes: delayInMinutes,
          periodInMinutes: 7 * 24 * 60, // Weekly recurrence (7 days in minutes)
        });
      });
    } else {
      console.warn("Chrome alarms API not available");
    }
  }

  function updateSavedState() {
    if (saveButton && saveButtonText) {
      saveButton.classList.add("saved");
      saveButton.disabled = true;
      saveButtonText.textContent = "Saved!";

      // Reset button after 2 seconds
      setTimeout(() => {
        if (!isChanged && saveButton && saveButtonText) {
          saveButton.classList.remove("saved");
          saveButton.disabled = false;
          saveButtonText.textContent = "Schedule Reminder";
        }
      }, 2000);
    }
  }

  function resetSaveButton() {
    if (saveButton && saveButtonText) {
      saveButton.classList.remove("saved");
      saveButton.disabled = false;
      saveButtonText.textContent = "Schedule Reminder";
    }

    // Clear any status message when making changes
    if (statusMessage) {
      statusMessage.textContent = "";
      statusMessage.classList.remove("success", "error");
    }
  }

  function getDaysText(days) {
    if (days.length === 7) return "every day";

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((idx) => dayNames[idx]).join(", ");
  }

  function formatTime(timeString) {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  function showStatus(message, type) {
    if (statusMessage) {
      // Ensure no character encoding issues by using simple ASCII
      statusMessage.textContent = message;

      // Remove existing classes
      statusMessage.classList.remove("success", "error");

      // Add appropriate class based on status type
      if (type === "error") {
        statusMessage.classList.add("error");
      } else {
        statusMessage.classList.add("success");
      }
    }
  }
});
