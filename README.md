# Institute of Knowledge (IOK)

## Overview

Institute of Knowledge is a React + Vite web application designed for academy and institute management. It supports role-based access for Admin, Teacher, and Student users, and provides features for batch management, attendance tracking, fee management, course administration, and user profiles.

The app includes:
- Responsive landing page with feature highlights and testimonials
- Email OTP login flow
- Role-based protected routes and navigation
- Admin dashboard with user, batch, course, trade, attendance and fee management
- Teacher dashboard with assigned batches, attendance tools, and student access
- Student dashboard for personal attendance, fee status, and profile details
- PWA setup for installable app experience

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Zustand for state management
- React Router DOM for client-side routing
- Axios for API communication
- Framer Motion for UI animation
- lucide-react icons
- vite-plugin-pwa for progressive web app support

## Installation

1. Clone the repository or open the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Run linter:
   ```bash
   npm run lint
   ```

## Environment Variables

The application expects the backend API base URL to be configured with:

- `VITE_BACKEND_URL`

Example `.env` file:

```env
VITE_BACKEND_URL=http://localhost:3000
```

This value is used by `src/api/api.js` to configure Axios.

## Application Structure

- `src/App.jsx` — main router and protected route configuration
- `src/Routes/Route.jsx` — custom route guards for authentication and role-based access
- `src/components` — reusable UI and landing page components
- `src/pages` — page-level components for dashboard, attendance, fees, courses, registration, and profiles
- `src/stores` — Zustand stores for authentication, user data, classes, batches, attendance, fees, and UI state
- `src/api/api.js` — Axios instance with auth interceptor
- `vite.config.js` — Vite configuration with PWA support

## Authentication and Session Flow

The app uses OTP-based login:
1. User enters email in the login modal.
2. The app calls `/auth/sendotp`.
3. User enters OTP and the app calls `/auth/verifyotp`.
4. On success, the token, user ID, and role are stored in Zustand and persisted in `localStorage`.
5. `src/App.jsx` calls `loadUser()` on startup to refresh user details.

Protected route behavior:
- Unauthenticated users are redirected to `/home`
- Authenticated users are allowed into routes depending on role
- Unauthorized access redirects to `/` or `/access-denied`

## Role-Based Access

### Admin

Admin users can access:
- Dashboard (`/`)
- All students and teachers overview
- Register new users (`/registeruser`)
- Batch creation and editing (`/batches/create`, `/batches/edit`)
- Course management (`/courses`, `/courses/createcourse`, `/courses/addnewstudent`)
- Trade management (`/trades`)
- Attendance page (`/attendance`)
- Attendance status overview (`/attendance-status`)
- Fees payment page (`/fees`)
- Yearly fee status (`/fees-yearly-status`)
- Profile page (`/profile/:username`)

### Teacher

Teacher users can access:
- Dashboard (`/`)
- Assigned students and batches
- Attendance page (`/attendance`)
- Attendance status overview (`/attendance-status`)
- Yearly fee status (`/fees-yearly-status`)
- Profile page (`/profile/:username`)

### Student

Student users can access:
- Dashboard (`/`)
- My batches (`/batches`)
- Attendance status overview (`/attendance-status`)
- Yearly fee status (`/fees-yearly-status`)
- Profile page (`/profile/:username`)
- Student profile page (`/student-profile`)

## Key Features

### Landing Page

- Hero section with academy branding
- Feature cards for Student Portal, Academic Records, and Faculty Management
- Testimonials
- Photo gallery and service highlights
- Login and join actions with modal overlay

### Dashboard

The dashboard is role-aware and shows:
- KPI cards for students, batches, fees, and attendance metrics
- Quick action buttons for registration, batch creation, and navigation
- Recent enrollment and status cards
- Student and teacher summary metrics

### Batch Management

- Batch listing with search and trade filters
- Role-aware batch visibility
- Batch creation and editing available to Admin
- Batch details page with student list and schedule

### Attendance Management

- Select batch and date
- Mark attendance present/absent
- Batch schedule validation for teachers during batch hours
- Attendance submission flow
- Attendance status calendar view

### Fee Management

- Fee status and payment overview
- Main class and batch filters
- Teacher-aware student filtering
- Search and dynamic class/batch selection
- Pending fee calculations and payment records

### Course and Class Management

- Course listing with search and trade filtering
- Course details and student assignments
- Create course and add student workflows
- Class data is loaded from `/mainclass` and displayed in cards

### User and Profile Management

- Register new users with Student or Teacher role
- Student profile fields include admission date, guardian details, stream, school, marks, and documents
- View and edit profiles through profile pages
- Admin can manage users and delete accounts

### User Interface and Experience

- Theme support through `useUiStateStore` (`system`, `light`, `dark`)
- Animated page transitions with Framer Motion
- Responsive UI layout and cards
- Toast notifications for errors and success messages
- Modal dialogs for login and confirmations

## Stores and Data Flow

### `src/stores/useAuthStore.js`
- Manages login, OTP, token, user data, role, and persistent session state
- Handles `/auth/sendotp`, `/auth/verifyotp`, and `/user/details/:id`

### `src/stores/useUserStore.js`
- Loads student and teacher lists
- Adds, updates, and deletes users
- Fetches individual user details and student progress

### `src/stores/useClassStore.js`
- Loads class and course data from `/mainclass`
- Handles class creation, update, delete, and student enrollment

### `src/stores/useAttendanceStore.js`
- Loads batches and attendance records
- Selects batches and initializes student attendance state
- Handles attendance submission and daily record retrieval

### `src/stores/useFeesStore.js`
- Loads class, batch, and student fee context
- Fetches fee details and records payments
- Calculates fines and manages selections

### `src/stores/useUiStateStore.js`
- Stores UI metadata such as app name and theme

## Expected Backend Endpoints

The app communicates with a backend API for data and authentication. Key routes include:

- `POST /auth/sendotp`
- `POST /auth/verifyotp`
- `GET /user/details/:id`
- `GET /user/students`
- `GET /user/teachers`
- `POST /user/add`
- `PATCH /user/edit/:id`
- `DELETE /user/delete/:id`
- `GET /batch`
- `GET /batch/show/:batchId`
- `GET /batch/students/:batchId`
- `GET /attendence/by-date/:batchId`
- `GET /attendence/by-date-range/:batchId`
- `GET /mainclass`
- `POST /fees/pay/:classId/:studentId`

## Running the App

- `npm run dev` — start the development server on port `3000`
- `npm run build` — build the production bundle
- `npm run preview` — preview the production build locally

## Notes

- The app uses `localStorage` to persist auth session data.
- The PWA manifest is configured in `vite.config.js` with installable app support.
- Role-based navigation is defined in `src/components/UI/NavigationLayout.jsx` and controlled by `src/Routes/Route.jsx`.

## Contributing

If you want to extend the project:
1. Add new pages under `src/pages`.
2. Manage global state in the corresponding store inside `src/stores`.
3. Update routing in `src/App.jsx` and protection rules in `src/Routes/Route.jsx`.
4. Keep styles consistent with Tailwind and the existing card/layout system.

---

This documentation is designed to help developers, maintainers, and users understand the application structure, setup, and role-specific functionality of the Institute of Knowledge app.