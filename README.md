# 📦 Inventory Management System

> **Final Course Project** — Web application for managing inventories with custom fields, custom IDs, and role-based access control.

---

## 🧩 What is this project?

This is a full-stack web application where users can create **inventories** (like "Office Equipment", "Library Books", "HR Documents") and other users can fill those inventories with **items**. Think of it like a shared, customizable spreadsheet — but smarter.

### Real-world example

1. You create an inventory called **"Office Laptops"**
2. You define custom fields: `Model` (string), `Price` (number), `Purchased` (date), `Available` (boolean)
3. You define a custom ID format: `LAP-X5_D4_2025` (random hex + sequence + year)
4. Other users with write access add their laptops to your inventory
5. Everyone can search, filter, and view all items in a clean table

---

## 🛠️ Tech Stack

| Layer                | Technology                                |
| -------------------- | ----------------------------------------- |
| **Frontend**         | React 18 + TypeScript                     |
| **UI Framework**     | Ant Design (AntD)                         |
| **State Management** | Redux Toolkit + RTK Query                 |
| **Backend**          | Node.js + Express.js + TypeScript         |
| **Database**         | PostgreSQL                                |
| **ORM**              | Prisma                                    |
| **Authentication**   | Passport.js (Google OAuth + GitHub OAuth) |
| **Image Upload**     | Cloudinary                                |
| **Full-text Search** | PostgreSQL native `tsvector`              |
| **Real-time**        | Polling (5s interval for comments)        |
| **i18n**             | react-i18next (English + Uzbek)           |
| **Drag & Drop**      | @dnd-kit                                  |
| **Markdown**         | react-markdown                            |

---

## 🗂️ Project Structure

```
inventory-app/
├── backend/                  # Express.js API server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # DB migrations
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   │   ├── auth.ts       # Login/logout/OAuth
│   │   │   ├── inventories.ts
│   │   │   ├── items.ts
│   │   │   ├── users.ts
│   │   │   ├── search.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   ├── requireAuth.ts
│   │   │   └── requireAdmin.ts
│   │   ├── services/
│   │   │   └── customId.ts   # Custom ID generation logic
│   │   ├── prisma.ts         # Prisma client singleton
│   │   └── index.ts          # App entry point
│   ├── .env
│   └── package.json
│
└── frontend/                 # React SPA
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.tsx
    │   │   ├── InventoryPage.tsx   # Tabs: items, fields, access, etc.
    │   │   ├── ItemPage.tsx
    │   │   ├── ProfilePage.tsx
    │   │   ├── SearchPage.tsx
    │   │   └── AdminPage.tsx
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── AppHeader.tsx   # Global search + auth buttons
    │   │   ├── inventory/
    │   │   │   ├── ItemsTable.tsx
    │   │   │   ├── FieldsTab.tsx
    │   │   │   ├── CustomIdTab.tsx
    │   │   │   ├── AccessTab.tsx
    │   │   │   └── DiscussionTab.tsx
    │   │   └── common/
    │   │       ├── TagInput.tsx
    │   │       └── MarkdownEditor.tsx
    │   ├── store/
    │   │   ├── index.ts
    │   │   └── api/            # RTK Query endpoints
    │   ├── i18n/
    │   │   ├── en.json
    │   │   └── uz.json
    │   └── App.tsx
    └── package.json
```

---

## 🔑 Key Features

### 1. Custom Inventory IDs

Each inventory can define its own ID format using drag-and-drop elements:

- **Fixed text** — e.g., `LAP-` or `📚-`
- **Random number** — 20-bit, 32-bit, 6-digit, 9-digit
- **Sequence** — auto-incrementing number (like `001`, `002`, ...)
- **Date/time** — e.g., `2025`, `Jan`, `15`
- **GUID** — full UUID

Result example: `📚-A7E3A_013_2025`

### 2. Custom Fields per Inventory

Each inventory can have (up to 3 of each type):

- 📝 Single-line text
- 📄 Multi-line text
- 🔢 Number
- 🔗 Link (URL)
- ✅ Boolean (checkbox)

### 3. Roles & Access

| Role                  | Can do                                             |
| --------------------- | -------------------------------------------------- |
| **Non-authenticated** | View inventories & items, search                   |
| **Authenticated**     | + Create inventories, like items, comment          |
| **Write-access user** | + Add/edit/delete items in specific inventory      |
| **Creator**           | + Manage fields, access, settings of own inventory |
| **Admin**             | Everything — acts as owner of every inventory      |

### 4. Auto-save with Optimistic Locking

- Inventory settings auto-save every 8 seconds
- Each save includes a `version` number
- If two people edit at the same time, the second save is rejected with a conflict error

### 5. Full-text Search

- Search bar in the header on every page
- Uses PostgreSQL `tsvector` — fast, no full table scans
- Results show inventories and items matching the query

---

## 🚀 How to Run Locally

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google & GitHub OAuth credentials

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in DATABASE_URL, GOOGLE_CLIENT_ID, GITHUB_CLIENT_ID, etc.
npx prisma migrate dev
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:4000
npm run dev
```

---

## 📋 Pages Overview

| Page      | URL                           | Description                                                         |
| --------- | ----------------------------- | ------------------------------------------------------------------- |
| Home      | `/`                           | Latest inventories, popular inventories, tag cloud                  |
| Search    | `/search?q=...`               | Full-text search results                                            |
| Profile   | `/profile`                    | My inventories + inventories I have write access to                 |
| Inventory | `/inventory/:id`              | Tabs: Items, Discussion, Settings, Custom ID, Fields, Access, Stats |
| Item      | `/inventory/:id/item/:itemId` | Item details + like button                                          |
| Admin     | `/admin`                      | User management table                                               |

---

## ⚠️ Important Rules (from requirements)

1. **NO buttons in table rows** — use row click for edit, checkboxes + toolbar for delete
2. **NO image upload to server** — use Cloudinary cloud storage
3. **NO N+1 queries** — always use Prisma `include` to fetch related data
4. **NO full table scans** — use indexed `tsvector` for search
5. **USE table views** — no gallery/tiles for inventories or items

---
