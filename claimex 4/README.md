# Claimex 🚀 — AI-Powered Claims Approval MVP

> Automatic expense claims handling powered by **Google Gemini AI** + **Firebase**

A premium, glassmorphic dark-themed web application that lets employees submit claims and uses Gemini to auto-approve low-risk ones or escalate them to managers. UI inspired by high-end product landings (deep navy, soft glass, precise motion) while staying 100% Claimex.

![Claimex](https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80)

## ✨ Features

- **Role-based Login** — Choose **Manager** or **Employee** at sign-in
- **Employee Dashboard**
  - Submit new claims (category, amount, description, date, receipt URL)
  - Gemini AI analyzes the claim in real-time
  - Auto-approves safe claims or escalates to pending
- **Manager Dashboard**
  - Live stats: Auto-approved count • Pending count • Total amount
  - Review & manually Approve / Reject pending claims
- Premium glass UI — deep navy (#080A19), backdrop-blur cards, refined spacing
- Dark / light theme toggle + custom cursor
- Smooth CSS entrance animations (fade-up / scale)
- Firebase Authentication + Cloud Firestore

## 🛠 Tech Stack

| Layer        | Technology                  |
|--------------|-----------------------------|
| Frontend     | HTML5, CSS3, Vanilla JS     |
| AI           | Google Gemini 1.5 Flash     |
| Backend      | Firebase Auth + Firestore   |
| Styling      | Custom CSS (dark theme)     |
| Hosting      | Static (any static host)    |

## 🚀 Quick Setup

### 1. Firebase
1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → Email/Password
3. Enable **Cloud Firestore** (start in test mode for demo)
4. Copy your web config into `app.js`

### 2. Gemini API Key
1. Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Paste it as `GEMINI_API_KEY` in `app.js`

> **Note**: If no Gemini key is provided, a smart rule-based fallback still works for demos.

### 3. Run Locally
```bash
# From the project folder
npx serve .
# or
python -m http.server 8000
```
Open `http://localhost:3000` (or 8000) → select role → Sign up / Sign in.

## 📁 Project Structure

```
claimex/
├── index.html          # Login + role selection
├── employee.html       # Employee claims dashboard
├── manager.html        # Manager review dashboard
├── styles.css          # Dark theme, animations, responsive
├── app.js              # Firebase + Gemini + shared logic
├── README.md
└── .gitignore
```

## 🧠 How the AI Flow Works

1. Employee fills claim form and clicks **Submit & Analyze with AI**
2. Gemini receives structured prompt with amount, category, description
3. Returns JSON decision:
   - `auto-approved` → low risk, under threshold, clear description
   - `pending` → higher amount or needs human review
4. Claim is saved to Firestore with AI reason + confidence
5. Manager sees pending claims and can Approve / Reject

## 📝 Hackathon Notes

- Pure frontend MVP — no backend server required
- API keys are client-side (acceptable for demo / hackathon)
- For production: move Gemini calls to Cloud Functions
- Firestore security rules should be tightened after demo

## 📄 License

MIT — feel free to use and extend for your hackathon or product.

---

Built with ❤️ for the hackathon • Claimex 2026
