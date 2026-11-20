# ♿ Accessible Place Finder

> A full-stack, accessible, and responsive web platform designed to empower people with physical disabilities, mobility device users, elderly individuals, and caregivers to discover, filter, review, and report accessibility facilities at public and private locations.

---

## 📖 Table of Contents
1. [Project Purpose & Core Features](#-project-purpose--core-features)
2. [Technology Stack](#-technology-stack)
3. [Architecture & Project Structure](#-architecture--project-structure)
4. [Database Schemas & Data Model](#-database-schemas--data-model)
5. [Prerequisites](#-prerequisites)
6. [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
7. [Configuring MongoDB Atlas](#-configuring-mongodb-atlas)
8. [Seeding the Database](#-seeding-the-database)
9. [Starting the Application](#-starting-the-application)
10. [Default Test Accounts](#-default-test-accounts)
11. [Complete REST API Documentation](#-complete-rest-api-documentation)
12. [Accessibility & Design System (WCAG 2.1)](#-accessibility--design-system-wcag-21)
13. [Testing & Quality Assurance](#-testing--quality-assurance)

---

## 🎯 Project Purpose & Core Features

Every person deserves to move through cities and communities with dignity, safety, and independence. **Accessible Place Finder** eliminates accessibility uncertainty by providing verified ground truth regarding physical facilities.

### 🌟 Key Features
- **🔍 Multi-Facility Search & Filtering**:
  - Live search by place name, description, city, address, or category.
  - Granular accessibility facility filters:
    - ♿ **Wheelchair Accessible**
    - 📐 **Accessible Ramps** (ADA compliant slopes)
    - 🚻 **Accessible Restrooms**
    - 🛗 **Elevators Available**
    - 🅿️ **Accessible Parking Spaces**
  - Instant sorting by rating, review count, newest addition, or name A-Z.
- **🏢 Comprehensive Place Details**:
  - Full address, operating hours, telephone, email, and website.
  - Verified accessibility facilities checklist with clear indicators.
  - Detailed additional accessibility guidance (e.g., door width, tactile paving, sensory-friendly hours).
  - High-resolution photo gallery and category visuals.
  - Real-time community rating calculation.
- **🔐 Secure User Authentication (JWT & bcrypt)**:
  - User registration and login with bcrypt password hashing (10 salt rounds).
  - Passwords are never stored in plaintext and never leaked in API responses (`select: false`).
  - JWT-based authorization with Bearer tokens.
  - User profile management with personal accessibility preferences.
- **⭐ Community Reviews & Dynamic Rating Recalculation**:
  - Authenticated users can rate locations (1 to 5 stars) and write constructive reviews.
  - Dynamic Mongoose aggregation automatically recalculates each place's `averageRating` and `reviewCount`.
  - Authors can update or delete their own reviews; users cannot modify another user's review.
- **🚩 Accessibility Inaccuracy Reporting System**:
  - Community members can report broken facilities (e.g. broken elevators, blocked ramps, locked washrooms).
  - Categorized issue types: *Facility Missing*, *Facility Broken / Inoperable*, *Incorrect Address / Hours*, *Misleading Information*.
  - Reports flow directly to the administrator queue with a `pending` status.
- **🛡️ Secure Administrator Dashboard**:
  - Role-based authorization (`role: 'admin'`). Non-administrators are blocked with `403 Forbidden`.
  - Live KPI metrics: Total Places, Registered Users, Total Reviews, Pending Reports.
  - **Places Management**: Create, edit, and delete places with safe photo upload handling.
  - **Review Moderation**: View all community reviews and remove spam or abusive content.
  - **Inaccuracy Reports Resolution**: Audit reports, update status to `resolved` or `dismissed`, and record administrative verification notes.
- **♿ Built-In Accessibility Suite (WCAG 2.1 AA & AAA)**:
  - **High Contrast Mode**: WCAG AAA compliant black/yellow/cyan color scheme with crisp borders.
  - **Text Size Scaling**: Normal, Large, and Extra-Large typography cycling.
  - **Reduced Motion**: Disables transitions and animations for users sensitive to vestibular motion.
  - **Semantic HTML & ARIA**: Screen-reader landmarks, skip navigation link, focus-visible styling.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | HTML5 (Semantic), Modern CSS3 (Variables, Grid, Flexbox), Vanilla JavaScript (ES6+ Modules), WCAG 2.1 Standards |
| **Backend** | Node.js, Express.js (REST API Architecture) |
| **Database** | MongoDB Atlas / Local MongoDB with Mongoose ORM |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) & bcrypt password hashing (`bcryptjs`) |
| **Validation** | Robust input validation and sanitization middleware |
| **Security** | Security headers, safe CORS policy, rate limiting, Multer file upload filters |

---

## 🏗️ Architecture & Project Structure

```
AccessiblePlaceFinder/
├── frontend/
│   ├── index.html              # Single Page Application / Multi-view structure
│   ├── css/
│   │   ├── style.css           # Core design system, responsive grid & color tokens
│   │   └── accessibility.css   # High contrast mode, text zoom & reduced motion
│   ├── js/
│   │   ├── api.js              # REST API connector, token manager & toast notifications
│   │   ├── auth.js             # User session, login, registration & profile state
│   │   ├── places.js           # Search, filters, responsive cards & place details modal
│   │   ├── reviews.js          # Review submission & rating aggregation
│   │   ├── reports.js          # Accessibility inaccuracy reporting modal & handler
│   │   ├── admin.js            # Admin dashboard, KPI metrics, CRUD & moderation
│   │   └── app.js              # SPA router, accessibility toolbar & main controller
│   └── assets/                 # Icons and visual media assets
├── backend/
│   ├── config/
│   │   └── db.js               # Resilient MongoDB Mongoose connection handler
│   ├── controllers/
│   │   ├── authController.js   # Registration, login & profile verification
│   │   ├── userController.js   # User profile, my-reviews & my-reports
│   │   ├── placeController.js  # Search, filter, category & place detail logic
│   │   ├── reviewController.js # Review creation, ratings calculation & deletion
│   │   ├── reportController.js # Accessibility reporting handler
│   │   └── adminController.js  # Dashboard stats, places CRUD, moderation & reports
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification & admin role guard
│   │   ├── validationMiddleware.js # Input validation and sanitization
│   │   ├── rateLimitMiddleware.js  # Brute-force & spam rate limiters
│   │   ├── uploadMiddleware.js # Multer safe file upload handler
│   │   └── errorHandler.js     # Centralized error handler & 404 response
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt hooks & roles
│   │   ├── Place.js            # Place schema with 5+ accessibility flags & text indexes
│   │   ├── Review.js           # Review schema with rating recalculation hooks
│   │   └── Report.js           # Accessibility inaccuracy reports schema
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth
│   │   ├── userRoutes.js       # /api/users
│   │   ├── placeRoutes.js      # /api/places
│   │   ├── reviewRoutes.js     # /api/reviews
│   │   ├── reportRoutes.js     # /api/reports
│   │   └── adminRoutes.js      # /api/admin
│   ├── utils/
│   │   └── seed.js             # Comprehensive database seeder with realistic places
│   ├── uploads/                # Directory for uploaded place photos
│   ├── tests/
│   │   ├── unit.test.js        # Unit & logic test suite (schemas, auth, guards, errors)
│   │   └── integration.test.js # End-to-end integration test suite
│   ├── server.js               # Express application entrypoint
│   ├── package.json
│   └── .env.example
├── README.md                   # Complete documentation
└── .gitignore
```

---

## 📊 Database Schemas & Data Model

### 1. `User` Schema
- `name`: String, required, trimmed.
- `email`: String, required, unique, lowercase, trimmed, indexed.
- `password`: String, required, min 6 characters, hashed with bcrypt (`select: false`).
- `role`: String, enum: `['user', 'admin']`, default: `'user'`.
- `accessibilityPreferences`: `[String]` (e.g. `'wheelchair'`, `'ramps'`, `'washroom'`, `'elevator'`).
- `createdAt`, `updatedAt`: Timestamps.

### 2. `Place` Schema
- `name`: String, required, trimmed, indexed.
- `description`: String, required, trimmed.
- `category`: String, required, enum: `['Healthcare', 'Restaurant & Cafe', 'Education & Library', 'Park & Recreation', 'Shopping & Mall', 'Transit & Station', 'Museum & Culture', 'Government & Public', 'Other']`.
- `address`: String, required, trimmed.
- `city`: String, required, trimmed, indexed.
- `contactPhone`, `contactEmail`, `website`, `openingHours`: String.
- **Accessibility Facility Flags**:
  - `wheelchairAccessible`: Boolean, default: false.
  - `rampAvailable`: Boolean, default: false.
  - `accessibleWashroom`: Boolean, default: false.
  - `elevatorAvailable`: Boolean, default: false.
  - `accessibleParking`: Boolean, default: false.
  - `additionalAccessibility`: String (notes on door clearance, tactile surfaces, braille).
- `photos`: `[String]` (URLs or `/uploads/...` paths).
- `averageRating`: Number, default: 0, min: 0, max: 5.
- `reviewCount`: Number, default: 0.
- `createdBy`: ObjectId (ref: User).
- **Compound Text Index**: On `{ name, description, city, address, category }`.

### 3. `Review` Schema
- `place`: ObjectId (ref: Place), required, indexed.
- `user`: ObjectId (ref: User), required, indexed.
- `rating`: Number, required, integer between 1 and 5.
- `comment`: String, required, 5 to 1000 characters.
- `facilityFeedback`: Object confirming specific accessibility facilities.
- `createdAt`, `updatedAt`: Timestamps.
- Compound unique index: `{ place: 1, user: 1 }` (prevents spam duplicate reviews).

### 4. `Report` Schema
- `place`: ObjectId (ref: Place), required, indexed.
- `user`: ObjectId (ref: User), optional.
- `reporterName`: String.
- `reporterEmail`: String.
- `issueType`: String, enum: `['Facility Missing', 'Facility Broken / Inoperable', 'Incorrect Address / Hours', 'Misleading Accessibility Information', 'Other']`.
- `facilityAffected`: String (e.g. `'Wheelchair Access'`, `'Ramp'`, `'Washroom'`, `'Elevator'`, `'Accessible Parking'`).
- `description`: String, required, 10 to 1500 characters.
- `status`: String, enum: `['pending', 'investigating', 'resolved', 'dismissed']`, default: `'pending'`.
- `adminNotes`: String.
- `resolvedBy`: ObjectId (ref: User).
- `resolvedAt`: Date.

---

## 📋 Prerequisites

Before starting, ensure you have:
1. **Node.js** (v18.x or higher) installed on your system.
2. **npm** (v9.x or higher) package manager.
3. A **MongoDB Atlas** database connection string (or a local MongoDB instance).

---

## ⚙️ Step-by-Step Installation & Setup

### Step 1: Open Terminal in Project Directory
Navigate to the `AccessiblePlaceFinder/backend` folder:
```bash
cd AccessiblePlaceFinder/backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create your active `.env` file:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Mac/Linux:
cp .env.example .env
```

Open `backend/.env` in your code editor and configure your variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/accessible_place_finder?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_accessible_place_finder_2026_secure!
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5500,http://127.0.0.1:5500,http://localhost:5000,http://127.0.0.1:5000
MAX_FILE_SIZE_MB=5
UPLOAD_PATH=uploads
```

---

## ☁️ Configuring MongoDB Atlas

1. **Sign Up / Log In**: Visit [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. **Create a Free Cluster**: Click **Build a Database** &rarr; Select the **M0 Free** tier.
3. **Set Up Database User**:
   - Go to **Security** &rarr; **Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**. Choose a username (e.g. `apf_admin`) and a strong password.
   - User Privileges: **Read and write to any database**.
4. **Configure Network Access**:
   - Go to **Security** &rarr; **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) or enter your current IP.
5. **Get Connection String**:
   - Go to **Deployments** &rarr; **Database**.
   - Click **Connect** on your cluster &rarr; Choose **Drivers** (Node.js).
   - Copy the connection URI:
     ```
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/accessible_place_finder?retryWrites=true&w=majority
     ```
   - Paste this string into your `backend/.env` file as `MONGODB_URI`, replacing `<username>` and `<password>` with your database user credentials.

---

## 🌱 Seeding the Database

Populate your MongoDB database with realistic accessible places, user accounts, sample reviews, and inaccuracy reports:

```bash
cd AccessiblePlaceFinder/backend
npm run seed
```

Output will confirm:
- 1 Administrator account created.
- 2 Community users created.
- 13 Diverse accessible locations seeded (Hospitals, Bakeries, Libraries, Waterfront Parks, Transit Stations, Modern Art Museums).
- Verified reviews and star ratings calculated.
- Pending and resolved inaccuracy reports created.

---

## 🚀 Starting the Application

### Option A: Single-Server Unified Mode (Recommended)
The Express backend is configured to serve both the REST API and the frontend static client simultaneously:

```bash
cd AccessiblePlaceFinder/backend
npm start
```

Now open your web browser and visit:
👉 **[http://localhost:5000](http://localhost:5000)**

### Option B: Development Mode (Auto-Reload)
```bash
cd AccessiblePlaceFinder/backend
npm run dev
```

### Option C: Independent Frontend Server
If you prefer running the frontend independently using VS Code Live Server or python:
```bash
cd AccessiblePlaceFinder/frontend
npx serve -l 5500
# Or: python -m http.server 5500
```
Then visit **http://localhost:5500**. The frontend will connect to the backend running on `http://localhost:5000`.

---

## 👥 Default Test Accounts

Use these pre-configured credentials to test all user and administrator capabilities:

| Account Type | Email Address | Password | Role | Permissions |
|---|---|---|---|---|
| **Administrator** | `admin@accessibleplacefinder.org` | `Admin@12345` | `admin` | Full CRUD on places, review moderation, resolve reports, view KPI stats |
| **Community User** | `sarah.jenkins@example.com` | `User@12345` | `user` | Submit ratings & reviews, report inaccuracies, manage profile |
| **Community User** | `david.miller@example.com` | `User@12345` | `user` | Submit reviews, view my-reviews & my-reports |

> 💡 **Quick Login Tip**: The login modal includes **"Quick Test Credentials"** buttons that fill in these accounts with a single click!

---

## 📡 Complete REST API Documentation

### 1. Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user. Accepts `name`, `email`, `password`, `accessibilityPreferences`. |
| `POST` | `/api/auth/login` | Public | Login with `email` and `password`. Returns JWT token and sanitized user profile. |
| `GET` | `/api/auth/me` | Private | Fetch currently authenticated user profile. |

### 2. User Endpoints (`/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `PUT` | `/api/users/profile` | Private | Update current user's name and accessibility preferences. |
| `GET` | `/api/users/my-reviews` | Private | Fetch all reviews authored by the logged-in user. |
| `GET` | `/api/users/my-reports` | Private | Fetch all inaccuracy reports submitted by the user. |

### 3. Places Discovery & Search Endpoints (`/api/places`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/places` | Public | Search & filter places. Query parameters: `q`, `city`, `category`, `wheelchair`, `ramp`, `washroom`, `elevator`, `parking`, `sort`, `page`, `limit`. |
| `GET` | `/api/places/popular` | Public | Get top-rated and most reviewed places. |
| `GET` | `/api/places/recent` | Public | Get the latest added places. |
| `GET` | `/api/places/categories` | Public | Get list of categories and place counts for each. |
| `GET` | `/api/places/cities` | Public | Get list of all distinct cities in the database. |
| `GET` | `/api/places/:id` | Public | Get detailed place document with populated creator and reviews. |
| `GET` | `/api/places/:id/reviews` | Public | Get all reviews for a specific place. |
| `POST` | `/api/places/:id/reviews` | Private | Submit or update a review (rating 1-5, comment). Automatically recalculates place rating. |
| `POST` | `/api/places/:id/reports` | Public/Auth | Submit an accessibility inaccuracy report. |

### 4. Review Endpoints (`/api/reviews`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `DELETE` | `/api/reviews/:id` | Private | Delete own review (or admin). Recalculates place average rating. |

### 5. Admin Endpoints (`/api/admin`) *(Guarded by `verifyToken` & `requireAdmin`)*
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin | Get dashboard KPI counts (places, users, reviews, pending reports) and activity. |
| `GET` | `/api/admin/places` | Admin | Search and paginate all places. |
| `POST` | `/api/admin/places` | Admin | Create a new place with optional photo upload (`multipart/form-data`) or URL. |
| `PUT` | `/api/admin/places/:id` | Admin | Edit an existing place's details and accessibility facilities. |
| `DELETE` | `/api/admin/places/:id` | Admin | Delete a place and cascade-delete all associated reviews and reports. |
| `GET` | `/api/admin/reviews` | Admin | View all reviews across places for moderation. |
| `DELETE` | `/api/admin/reviews/:id` | Admin | Admin delete a review and recalculate place rating. |
| `GET` | `/api/admin/reports` | Admin | List accessibility inaccuracy reports with status filtering. |
| `PATCH` | `/api/admin/reports/:id` | Admin | Update report status (`resolved`, `dismissed`, `investigating`) and add admin notes. |

---

## 🎨 Accessibility & Design System (WCAG 2.1)

Accessible Place Finder is engineered from the ground up for universal access:

- **WCAG 2.1 AA Contrast Ratios**: Text elements maintain at least 4.5:1 contrast against backgrounds; large headers exceed 7:1.
- **WCAG 2.1 AAA High Contrast Mode**: Built-in toggle converts the entire interface to high-visibility pure black, yellow, and cyan with prominent borders.
- **Dynamic Text Sizing**: The user can cycle between Normal (16px), Large (18px), and Extra Large (21px) base sizes without breaking layouts.
- **Reduced Motion Support**: Honoring the user's OS preference (`prefers-reduced-motion`) and providing a manual toolbar toggle to disable animations.
- **Keyboard Navigation**:
  - `Tab` moves focus sequentially through interactive controls with a prominent 3px outline.
  - Skip-to-content shortcut at the very top of the page.
  - `Escape` key closes all open modals and returns focus cleanly.

---

## 🧪 Testing & Quality Assurance

### Running Unit & Logic Tests
Execute the self-contained automated unit test suite:
```bash
cd AccessiblePlaceFinder/backend
node tests/unit.test.js
```
Verifies:
- Mongoose schemas, paths, and default facility flags.
- bcrypt password hashing and verification.
- JWT token payload encryption and decoding.
- Administrator role guards (`requireAdmin`).
- Centralized error handlers and duplicate key protection.

### Running End-to-End Integration Tests
```bash
cd AccessiblePlaceFinder/backend
node tests/integration.test.js
```

---

## 📄 License & Attribution
Developed with ❤️ by the Accessible Place Finder engineering team. Open-source educational project. All rights reserved.
