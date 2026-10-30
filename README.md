# Campus Event Manager

A full-stack college event management platform featuring dedicated Admin, Student, and Host portals. Built using HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MongoDB Atlas.

---

## 📌 Features

### 🎓 Student Portal
- **Browse & Search Events**: Filter campus events by department, category, and date.
- **One-Click Registration**: Register and manage event attendance.
- **Saved Events**: Bookmark events of interest.
- **Participation Certificates**: View and download earned event certificates.
- **Live Notifications & Activity Feed**: Stay updated with event approvals, updates, and schedule changes.

### 🎤 Host / Organizer Portal
- **Event Creation & Management**: Create events with schedules, venue specifications, banners, capacity limits, and eligibility criteria.
- **Participant Roster**: View registered students, track attendance, and issue certificates.
- **Event Lifecycle Tracking**: Draft, submit for approval, publish, and manage lifecycle states (upcoming, ongoing, completed, cancelled).
- **Host Analytics**: Visual performance metrics for registrations, views, and attendance.

### 🛡️ Admin Portal
- **Comprehensive Dashboard**: Real-time stats across students, hosts, events, and total registrations.
- **Approval Workflow**: Review, approve, or reject event submissions with feedback.
- **Department & Club Management**: Create and manage academic departments and student clubs.
- **User Management**: Approve and oversee student and host verification statuses.
- **Global Event Categories**: Configure category taxonomies and themes.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js (RESTful APIs)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **File Uploads**: Multer
- **Security**: Helmet, CORS

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account or local MongoDB instance

### 2. Installation
Clone the repository and install backend dependencies:

```bash
git clone https://github.com/<your-username>/campus-event-manager.git
cd campus-event-manager/backend
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to create your `.env` in the `backend` directory:

```bash
cp .env.example .env
```

Configure your environment variables in `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
UPLOAD_PATH=uploads
```

### 4. Database Seeding (Optional)
Populate the database with initial categories, departments, clubs, demo accounts, and sample events:

```bash
npm run seed
```

### 5. Running the Application
Start the server:

```bash
npm start
```

Visit the application in your browser:
- **Main Landing Page**: `http://localhost:5000`
- **Student Portal**: `http://localhost:5000/student/login.html`
- **Host Portal**: `http://localhost:5000/host/login.html`
- **Admin Portal**: `http://localhost:5000/admin/login.html`
- **API Base**: `http://localhost:5000/api`

---

## 📁 Project Structure

```
campus-event-manager/
├── backend/
│   ├── seeds/              # Database seed script
│   ├── src/
│   │   ├── config/         # Database connection
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, error handling, file upload
│   │   ├── models/         # Mongoose data models
│   │   ├── routes/         # Express API routes
│   │   └── utils/          # Token utilities
│   ├── uploads/            # Uploaded event banners and images
│   ├── package.json        # Backend dependencies & scripts
│   ├── server.js           # Server entry point & static file serving
│   └── .env.example        # Environment variable template
├── frontend/
│   ├── admin/              # Admin dashboard & management views
│   ├── css/                # Global stylesheets, components, responsive styles
│   ├── host/               # Host dashboard, event creation, participants
│   ├── js/                 # API client, auth manager, UI utilities
│   ├── student/            # Student portal, event discovery, certificates
│   └── index.html          # Public landing page
├── .gitignore              # Git ignore rules
├── .env.example            # Environment template
└── README.md               # Project documentation
```

---

## 📄 License
ISC
