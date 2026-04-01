# 👔 Wali Tailer – Smart Tailor Management System

![Version](https://img.shields.io/badge/version-2.0-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-lightgrey)

A **modern, offline-first** tailor shop management system built with pure HTML, CSS, and Vanilla JavaScript. No backend required – runs entirely in the browser with LocalStorage persistence and optional Google Sheets cloud sync.

> 🚀 **Live Demo**: [View Project](https://ubaidi-coding.github.io/Tailor_Managemnt-Project-/)

---

## 📸 Screenshots

| Dashboard | Order Form | Print Receipt |
|-----------|------------|---------------|
| ![Dashboard](https://via.placeholder.com/300x200?text=Dashboard+Preview) | ![Order Form](https://via.placeholder.com/300x200?text=Order+Form) | ![Receipt](https://via.placeholder.com/300x200?text=Receipt+Preview) |

---

## ✨ Features

### 🧵 Core Management
- **Customer Orders** – Create, edit, delete, and track orders
- **Professional Measurements** – Inch-based with upper/lower body sections
- **Payment Tracking** – Auto-calculated balance with status (Paid/Partial/Pending)
- **Order Status** – Pending → Ready → Delivered workflow
- **Unique Order IDs** – Auto-generated (WT-00001 format)

### 📊 Business Intelligence
- **Order History** – Complete audit trail of all changes
- **Customer Database** – Track lifetime value, order history, pending balances
- **Reports Dashboard** – Total revenue, pending collections, daily advances
- **Search & Filter** – By name, phone, status, or payment type

### 🖨️ Professional Printing
- **Modern Two-Column Receipt** – Clean, shop-ready layout
- **Measurements Table** – All measurements in organized format
- **Options Section** – Pockets, pati, ban, kuf, and more
- **Payment Summary** – Total, paid, remaining balance
- **Print-Optimized** – Perfect for thermal printers

### 📱 Communication
- **WhatsApp Integration** – One-click messages to customers (no API needed)
- **Shop Copy** – Send order details to shop owner's WhatsApp

### ☁️ Data Management
- **Offline-First** – Works without internet using LocalStorage
- **Google Sheets Sync** – Optional cloud backup (upload/download)
- **CSV Export/Import** – Backup to Excel/Google Sheets
- **JSON Export** – Complete structured data backup

### 🎨 User Experience
- **Mobile-First Design** – Works perfectly on phones and tablets
- **Measurement Templates** – Quick setup for common outfits (Shalwar Kameez, Sherwani, etc.)
- **Special Notes** – Add custom instructions
- **Responsive Layout** – Clean, modern interface

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure & semantic markup |
| **CSS3** | Responsive styling, print optimization |
| **Vanilla JavaScript (ES6+)** | All logic, LocalStorage, WhatsApp integration |
| **Google Apps Script** | Optional cloud sync backend |
| **LocalStorage API** | Offline data persistence |

**No frameworks, no dependencies** – pure web standards!

---

## 📁 Project Structure
Tailor_Managemnt-Project-/
├── index.html # Main application UI
├── css/
│ └── style.css # Modern responsive styling
├── js/
│ └── app.js # Complete application logic
├── assets/
│ └── logo.png # Shop logo (optional)
├── How_Recipt Print/ # Receipt design examples
├── .github/workflows/ # GitHub Pages deployment
└── LICENSE # MIT License


---

## 🚀 Quick Start

### Option 1: Run Locally
```bash
# Clone the repository
git clone https://github.com/UbaidiCoding/Tailor_Managemnt-Project-.git

# Navigate to project folder
cd Tailor_Managemnt-Project-

# Open in browser (any modern browser)
open index.html

https://ubaidi-coding.github.io/Tailor_Managemnt-Project-/


📖 User Guide
Creating an Order
Click "➕ New Order"

Enter customer name, WhatsApp, delivery date

Select measurement template (optional)

Enter measurements in inches

Check options (pockets, pati, etc.)

Enter total amount and advance paid

Add special notes

Click "💾 Save order"

Managing Orders
✏️ Edit – Modify any order details

🖨️ Print – Generate professional receipt

📲 WhatsApp – Send order to customer

🏪 Shop Copy – Send to shop owner

📜 History – View complete audit trail

🗑️ Delete – Remove order (with confirmation)

Customer Management
Click "👥 Customers" to view all customers

See total orders, lifetime spending, pending balance

Click any customer to filter their orders

Cloud Sync (Google Sheets)
Click "☁️ Sync to Cloud"

Upload – Send all orders to Google Sheets

Download – Retrieve orders from cloud

Auto-syncs after every change (5-second delay)

