# Vercel Deployment Guide

## Prerequisites
1. Install frontend dependencies: `cd frontend && npm install`
2. Create MongoDB database (MongoDB Atlas recommended)
3. Get your MongoDB connection string

## Environment Variables
Set these in Vercel dashboard under Environment Variables:

### Backend Variables
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `NODE_ENV`: `production`

### Frontend Variables  
- `REACT_APP_API_URL`: Your deployed backend URL (e.g., `https://your-app.vercel.app/api`)

## Deployment Steps

### Option 1: Full Stack on Vercel (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Option 2: Frontend Only on Vercel
1. Deploy backend separately (Heroku, Railway, etc.)
2. Set `REACT_APP_API_URL` to your backend URL
3. Deploy frontend to Vercel

## Project Structure for Vercel
```
├── frontend/           # React app
│   ├── build/         # Built files
│   └── public/        # Static files
├── backend/           # Node.js API
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   └── server.js     # Express server
└── vercel.json        # Vercel configuration
```

## Post-Deployment Checklist
- [ ] Test authentication flows
- [ ] Verify database connectivity
- [ ] Check role-based access control
- [ ] Test all dashboard functionality
- [ ] Verify responsive design on mobile

## Troubleshooting
- **CORS errors**: Ensure backend allows frontend origin
- **Database connection**: Verify MongoDB URI and network access
- **Environment variables**: Check all required variables are set
- **Build errors**: Ensure all dependencies are installed

## Demo Accounts
After deployment, create these test accounts:
- Admin: admin@school.com / admin123
- Teacher: teacher@school.com / teacher123  
- Student: student@school.com / student123
- Parent: parent@school.com / parent123
