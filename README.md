# 📧 MailWave — Full-Stack Email Application

A beautiful, production-ready email client built with **React**, **Node.js**, **Express**, and **SQLite**.

![MailWave](https://img.shields.io/badge/MailWave-v1.0.0-blue)

---

## ✨ Features

- **📥 Full Inbox Management** — Inbox, Sent, Drafts, Starred, Important, Archive, Spam, Trash
- **✍️ Rich Compose** — Compose emails with formatting (bold, italic, links, lists)
- **📤 Share to External Platforms** — Send email content via:
  - 💬 **WhatsApp**
  - ✈️ **Telegram**
  - 📱 **SMS / iMessage**
  - 🐦 **X (Twitter)**
  - 📋 **Copy to Clipboard**
  - 🖨️ **Print**
- **⭐ Star & Mark Important** emails
- **🔍 Full-text Search** across all mail
- **↩️ Reply & Forward** emails
- **👤 Authentication** — JWT-based register/login
- **⌨️ Keyboard Shortcuts** — C (compose), R (reply), F (forward), Esc (close)
- **📨 Internal Delivery** — Emails between registered users are delivered in-app
- **🌐 Real SMTP** — Connect your own SMTP (Gmail, Outlook, etc.)
- **🎨 Beautiful Dark UI** — Catppuccin-inspired dark theme

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **npm** v9+

### 1. Clone & Install

```bash
git clone <your-repo>
cd mailwave

# Install root dependencies
npm install

# Install backend & frontend dependencies
npm run install:all
```

### 2. Start Development Servers

```bash
# Start both frontend and backend together
npm run dev

# OR start separately:
npm run dev:backend   # Backend on http://localhost:5000
npm run dev:frontend  # Frontend on http://localhost:3000
```

### 3. Open App

Navigate to **http://localhost:3000**

Register an account and you'll receive a welcome email automatically!

---

## 📁 Project Structure

```
mailwave/
├── backend/
│   ├── db/
│   │   └── database.js         # SQLite setup & schema
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   ├── routes/
│   │   ├── auth.js             # Register, Login, Profile
│   │   ├── emails.js           # CRUD + Send + Search
│   │   └── contacts.js        # Contact management
│   ├── data/                   # SQLite DB file (auto-created)
│   ├── server.js               # Express app entry
│   ├── .env                    # Environment variables
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.js         # Navigation sidebar
│   │   │   ├── EmailList.js       # Email list panel
│   │   │   ├── EmailViewer.js     # Email reader + share
│   │   │   └── ComposeModal.js    # Compose + share to platforms
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   └── MailboxPage.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── utils/
│   │   │   └── api.js             # Axios instance
│   │   ├── App.js
│   │   ├── App.css               # All styles
│   │   └── index.js
│   ├── .env
│   └── package.json
│
├── package.json                   # Root runner (concurrently)
└── README.md
```

---

## 🔧 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |

### Emails
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emails?folder=inbox` | List emails |
| GET | `/api/emails/counts` | Unread counts |
| GET | `/api/emails/:id` | Get single email |
| POST | `/api/emails/send` | Send email |
| PATCH | `/api/emails/:id` | Update (star, folder, etc.) |
| DELETE | `/api/emails/:id` | Delete email |
| POST | `/api/emails/draft` | Save draft |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts` | Add contact |
| DELETE | `/api/contacts/:id` | Remove contact |

---

## 📬 Real SMTP Setup (Optional)

To send real emails, add SMTP config in the compose window or update `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password    # Gmail App Password
```

**Gmail setup:** Go to Google Account → Security → 2-Step Verification → App Passwords

---

## 🌐 Share to External Platforms

MailWave lets you share email content to outside platforms directly from the compose window or email viewer:

| Platform | How it works |
|----------|-------------|
| **WhatsApp** | Opens `wa.me` with pre-filled message |
| **Telegram** | Opens `t.me/share` with email content |
| **SMS** | Opens native SMS app with body |
| **Twitter/X** | Opens tweet composer with subject |
| **Clipboard** | Copies full email text |
| **Print** | Opens print dialog with formatted email |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `C` | Compose new email |
| `R` | Reply to selected email |
| `F` | Forward selected email |
| `Esc` | Close modal / deselect email |

---

## 🏗️ Production Build

```bash
# Build frontend
npm run build

# Set NODE_ENV=production in backend/.env
# Start backend (serves built frontend)
npm start
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Pure CSS (custom design system) |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (jsonwebtoken) |
| Email | Nodemailer |
| HTTP Client | Axios |
| Notifications | react-hot-toast |

---

## 📝 License

MIT — use freely for personal or commercial projects.
