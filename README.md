# School Management System

A production-ready, full-stack School Management System with real database integration and role-based access control.

## Features

- 🔐 Secure authentication with JWT
- 👥 Role-based access (Admin, Student, Parent, Teacher)
- 📊 Academic result management
- 📢 Announcement system
- 📱 Fully responsive design
- 🌐 Modern React frontend
- 🔧 Node.js + Express backend
- 🗄️ MongoDB database

## Quick Start

1. Install dependencies:
   ```bash
   npm run install-all
   ```

2. Set up environment variables (see backend/.env.example)

3. Run the application:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── backend/          # Node.js + Express API
├── frontend/         # React frontend
├── package.json      # Root package configuration
└── README.md         # This file
```

## Access Points

- **Landing Page**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **API**: http://localhost:5000/api

## Default Admin Account

After setup, you can create an admin account through the registration endpoint or contact the system administrator.

## License

MIT License
