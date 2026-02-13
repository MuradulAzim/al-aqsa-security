# Al-Aqsa Security Management System

A comprehensive Human Resource Management (HRM) web application designed for security service companies. Built with vanilla JavaScript, TailwindCSS, and Google Apps Script for backend data storage.

![Version](https://img.shields.io/badge/version-1.0.0--stable-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌐 Live Demo

**[https://muradulazim.github.io/al-aqsa-security/](https://muradulazim.github.io/al-aqsa-security/)**

### Demo Credentials

| Role | Username | PIN |
|------|----------|-----|
| Admin | admin | 1234 |
| Supervisor | supervisor | 5678 |
| Employee | employee | 0000 |

## ✨ Features

### Core Modules

- **👥 Employee Management** - Add, edit, and manage employee records with complete profiles
- **🏢 Client Management** - Track client information and service contracts
- **🛡️ Guard Duty Tracking** - Assign guards to locations with day/night/full shift scheduling
- **🚢 Vessel Orders** - Manage vessel security service orders and personnel assignments
- **👷 Day Labor Management** - Track daily labor assignments and workers
- **💰 Advance Management** - Process and track employee salary advances
- **💵 Salary Management** - Calculate and manage employee salaries
- **📄 Invoice Generation** - Generate professional invoices for clients

### System Features

- **🔐 Role-Based Access Control** - Admin, Supervisor, and Employee roles with different permissions
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **🌙 Session Management** - Secure 8-hour session with automatic expiry
- **📊 Dashboard Analytics** - Real-time statistics and activity overview
- **🇧🇩 Localized for Bangladesh** - Currency in Bangladeshi Taka (৳)

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: TailwindCSS (CDN)
- **Backend**: Google Apps Script (optional)
- **Storage**: LocalStorage (offline) / Google Sheets (online)
- **Hosting**: GitHub Pages

## 📁 Project Structure

```
al-aqsa-security/
├── docs/                          # Main application folder (GitHub Pages)
│   ├── index.html                 # Login page
│   ├── dashboard.html             # Main dashboard
│   ├── employees.html             # Employee management
│   ├── clients.html               # Client management
│   ├── guard-duty.html            # Guard duty tracking
│   ├── vessel-orders.html         # Vessel order management
│   ├── day-labor.html             # Day labor management
│   ├── advances.html              # Advance management
│   ├── salary.html                # Salary management
│   ├── invoices.html              # Invoice generation
│   ├── components/                # Reusable UI components
│   │   ├── navbar.html
│   │   ├── sidebar.html
│   │   └── modal.html
│   ├── css/
│   │   └── style.css              # Custom styles
│   ├── js/
│   │   ├── config.js              # App configuration
│   │   ├── auth.js                # Authentication module
│   │   ├── api.js                 # API communication
│   │   ├── utils.js               # Utility functions
│   │   ├── dashboard.js           # Dashboard logic
│   │   ├── employees.js           # Employee module
│   │   ├── clients.js             # Client module
│   │   ├── guard-duty.js          # Guard duty module
│   │   ├── vessel-orders.js       # Vessel orders module
│   │   ├── day-labor.js           # Day labor module
│   │   ├── advances.js            # Advances module
│   │   ├── salary.js              # Salary module
│   │   └── invoices.js            # Invoice module
│   └── google-apps-script/
│       └── Code.gs                # Google Apps Script backend
├── README.md
└── readme.txt
```

## 🚀 Installation

### Option 1: GitHub Pages (Recommended)

1. **Fork this repository**
   ```bash
   # Or clone it
   git clone https://github.com/MuradulAzim/al-aqsa-security.git
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main`, Folder: `/docs`
   - Save and wait for deployment

3. **Access your app**
   ```
   https://<your-username>.github.io/al-aqsa-security/
   ```

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/MuradulAzim/al-aqsa-security.git
   cd al-aqsa-security/docs
   ```

2. **Start a local server**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (npx)
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### Option 3: Google Apps Script Backend (Optional)

For persistent cloud storage with Google Sheets:

1. **Create a Google Sheet**
   - Create a new Google Sheets document
   - Note the Sheet ID from the URL

2. **Set up Apps Script**
   - Go to Extensions → Apps Script
   - Copy contents from `docs/google-apps-script/Code.gs`
   - Deploy as Web App (Execute as: Me, Access: Anyone)

3. **Update Configuration**
   - Edit `docs/js/config.js`
   - Replace `API_URL` with your deployed script URL

## ⚙️ Configuration

Edit `docs/js/config.js` to customize:

```javascript
const CONFIG = {
  APP_NAME: "Al Aksha Security Management System",
  APP_VERSION: "1.0.0-stable",
  API_URL: "YOUR_GOOGLE_SCRIPT_URL",  // Optional
  SESSION_DURATION: 8 * 60 * 60 * 1000,  // 8 hours
  CURRENCY: "৳",  // Bangladeshi Taka
  COMPANY: {
    name: "Al Aksha Security Services",
    address: "Chattogram, Bangladesh",
    phone: "+880-1958-122300",
    email: "admin@al-aqsasecurity.com"
  }
};
```

## 📖 Usage

1. **Login** with demo credentials or your configured users
2. **Dashboard** shows overview statistics and recent activities
3. **Employees** - Manage your workforce
4. **Clients** - Add and manage client accounts
5. **Guard Duty** - Schedule and track guard assignments
6. **Vessel Orders** - Create and manage vessel security orders
7. **Day Labor** - Track daily workers and assignments
8. **Advances** - Process salary advance requests
9. **Salary** - Calculate and manage payroll
10. **Invoices** - Generate and print client invoices

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Muradul Azim**

- GitHub: [@MuradulAzim](https://github.com/MuradulAzim)

## 🙏 Acknowledgments

- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Google Apps Script](https://developers.google.com/apps-script) for serverless backend
- [GitHub Pages](https://pages.github.com/) for free hosting

---

⭐ Star this repository if you find it helpful!
