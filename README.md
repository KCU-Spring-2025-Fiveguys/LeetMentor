# 📌 Project Setup

⚠️ **Make sure to read this guide before you begin!** ⚠️  
This guide will walk you through setting up a Python virtual environment and installing all required dependencies.

---

## 🚀 Step 1: Clone the Repository  
First, clone the repository:

```bash
git clone https://github.com/KCU-Spring-2025-Fiveguys/LeetMentor.git
```

Then, navigate into the project directory:

```bash
cd LeetMentor
```
---
## 🌲 Step 2: Switch to Your Assigned Branch
Make sure you’re working in your designated branch:
- [Jaeyoon Lee](https://github.com/Jaeyoon23) (Database)
```bash
git checkout db
```
- [Austin Kim](https://github.com/ak3123) (AI)
```bash
git checkout ai
```
- [Allen Lee]() (API)
```bash
git checkout api
```
- [(TBD)]() (Frontend)
```bash
git checkout front
```
---
## 🏗 Step 3: Create a Virtual Environment  
Create a new virtual environment named `venv`:

```bash
python -m venv venv
```
### Activate the Virtual Environment:  
- **On macOS/Linux:**
  ```bash
  source venv/bin/activate
  ```
- **On Windows:**
  ```bash
  venv\Scripts\activate
  ```
---
## 📦 Step 4: Install Dependencies  
Install all required libraries by running:

```bash
pip install -r requirements.txt
```
---
## 🔄 Additional Git Commands
To check your current branch:
```bash
git branch
```
Deactivate the virtual environment:
```bash
deactivate
```
✅ **You're now ready to begin development in your virtual environment. Good Luck! 😊**
