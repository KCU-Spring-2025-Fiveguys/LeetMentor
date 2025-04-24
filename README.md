# <img src="client/icons/icon.png" alt="LeetMentor Icon" width="24" height="24"> LeetMentor

> Your AI-powered coding companion for LeetCode practice

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore/category/extensions)  
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.8-009688.svg)](https://fastapi.tiangolo.com/)  
[![OpenAI](https://img.shields.io/badge/OpenAI-API-black.svg)](https://openai.com/api/)  
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## 📋 Table of Contents

- [🔍 About](#about)
- [✨ Features](#features)
- [🛠️ Tech Stack](#tech-stack)
- [🏁 Getting Started](#getting-started)
- [📱 Usage](#usage)
- [🏗️ Architecture](#architecture)
- [🤝 Contributing](#contributing)
- [📜 License](#license)

---

## 🔍 About

LeetMentor is a **Chrome extension + FastAPI backend** that gives you hints, feedback, and interview-style follow-up questions while you solve LeetCode problems. Rather than handing you a complete solution, it nudges you toward understanding algorithms and data structures more deeply.

---

## ✨ Features

- **🧠 AI-Powered Hints**  
  Gentle nudges when you're stuck—no spoilers.
- **⚡ Code Improvement Suggestions**  
  Time-complexity analysis, style tips, and optimization ideas.
- **🎯 Interview-Style Follow-Ups**  
  Deeper questions to solidify your understanding.
- **⏰ Practice Reminders**  
  Schedule daily or weekly prompts to keep your momentum.
- **📚 Solution History**  
  Browse past submissions and AI feedback in the side panel.

---

## 🛠️ Tech Stack

| Frontend                         | Backend & Database               |
| -------------------------------- | -------------------------------- |
| • Chrome Extension (Manifest V3) | • FastAPI                        |
| • HTML, CSS, JavaScript          | • Python 3.11+                   |
| • Chrome Storage & Alarms API    | • OpenAI API                     |
|                                  | • Firebase Firestore             |
|                                  | • Vercel (serverless deployment) |

---

## 🏁 Getting Started

1.  **Clone the repo**

```bash
git clone https://github.com/KCU-Spring-2025-Fiveguys/LeetMentor.git
cd LeetMentor
```

2.  Open `chrome://extensions/`
3.  Toggle Developer mode on (top right)
4.  Click Load unpacked and select the `client/` folder
5.  The LeetMentor icon will appear in your toolbar

---

## 📱 Usage

1. Go to any LeetCode problem page
2. Click the LeetMentor icon in your toolbar
3. You can use the following features:
   - 💡 Get Hint
   - 📊 Analyze Code
   - 🔄 Generate Follow-Ups
   - ⏱️ Set Reminder (daily/weekly)
   - 📋 View History to review past feedback

---

## 🏗️ Architecture

1. 🔍 Content Script scrapes your code and problem statement from LeetCode, sends requests to the local FastAPI server
2. 🧠 FastAPI routes requests, calls OpenAI to generate hints, and returns suggestions
3. 💾 History stored in Chrome local storage

---

## 🤝 Contributing

We welcome your ideas!

1. Fork the repository
2. Create a branch:
   ```bash
   git checkout -b feature/your-cool-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add awesome feature"
   ```
4. Push and open a pull request

---

## 📜 License

This project is licensed under the [Apache License 2.0](https://opensource.org/licenses/Apache-2.0).
