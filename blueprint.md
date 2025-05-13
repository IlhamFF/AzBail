# EduPortal - Project Blueprint

## 1. Core Purpose

EduPortal is a comprehensive web application designed to streamline and manage various aspects of school administration, teaching, and learning. It serves as a centralized platform connecting students, teachers, administrative staff (Tata Usaha), and school principals, facilitating efficient communication and access to academic information.

## 2. Key User Roles & Functionality

The application supports distinct roles, each with tailored dashboards and functionalities:

### a. Admin
- **User Management:**
    - View all registered users with their roles and verification status.
    - Verify new user registrations.
    - Delete user accounts.
    - (Future) Edit user details and roles.
- **Academic Structure Management:**
    - **Class Management:** Create, view, edit, and delete classes. Assign homeroom teachers to classes.
    - **Subject Management:** Create, view, edit, and delete subjects/courses.
- **Communication:**
    - **Announcement Management:** Create, view, edit, delete, and pin/unpin announcements targeted at specific roles or the entire school.
- **System Monitoring:**
    - **Audit Logging:** View a log of important system activities for security and accountability.
- **Dashboard:** Overview of key statistics (total users, pending verifications, classes, subjects, recent activities).

### b. Guru (Teacher)
- **Dashboard:** Personalized overview of teaching-related information (e.g., upcoming schedule, pending assignments).
- **Jadwal Mengajar (Teaching Schedule):** View their assigned teaching schedule.
- **Manajemen Kelas (Class Management):**
    - View students in their assigned classes.
    - (Future) Input and manage student grades.
    - (Future) Input and manage student attendance.
- **Akademik (Academics):**
    - **Input Nilai (Grade Input):** (Future) Interface to input student grades for various assessments.
    - **Input Absensi (Attendance Input):** (Future) Interface to record student attendance.
    - **Upload Materi (Material Upload):** (Future) Upload learning materials for students.
    - **Kelola Tugas (Assignment Management):** (Future) Create, distribute, and manage assignments.
- **Pengumuman (Announcements):** View announcements relevant to them.
- **Profil (Profile):** View and edit their personal profile information.

### c. Siswa (Student)
- **Dashboard:** Personalized overview of academic progress (e.g., upcoming assignments, recent grades).
- **Jadwal Pelajaran (Class Schedule):** View their class schedule.
- **Nilai (Grades):** (Future) View their grades for different subjects and assessments.
- **Absensi (Attendance):** (Future) View their attendance records.
- **Materi Pelajaran (Learning Materials):** (Future) Access and download learning materials shared by teachers.
- **Tugas (Assignments):**
    - (Future) View assigned tasks.
    - (Future) Submit assignments.
- **Pengumuman (Announcements):** View announcements relevant to them.
- **Profil (Profile):** View and edit their personal profile information.

### d. Tata Usaha (Staff)
- **Dashboard:** Overview of administrative tasks and information.
- **Manajemen Data Siswa (Student Data Management):** (Future) Manage student records.
- **Administrasi Keuangan (Financial Administration):** (Future) Manage school finances, student payments, etc.
- **Pengelolaan Surat (Document Management):** (Future) Manage incoming and outgoing school correspondence.
- **Inventaris Sekolah (School Inventory):** (Future) Manage school assets and inventory.
- **Pengumuman (Announcements):** View announcements relevant to them.
- **Profil (Profile):** View and edit their personal profile information.

### e. Kepala Sekolah (Principal)
- **Dashboard:** Overview of school-wide statistics and key performance indicators.
- **Statistik Sekolah (School Statistics):** (Future) View reports and analytics on student performance, attendance, etc.
- **Monitoring Guru (Teacher Monitoring):** (Future) View teacher performance data.
- **Persetujuan Dokumen (Document Approval):** (Future) Approve or reject documents requiring principal's authorization.
- **Laporan Akademik (Academic Reports):** (Future) Generate and view comprehensive academic reports.
- **Pengumuman (Announcements):** View announcements relevant to them.
- **Profil (Profile):** View and edit their personal profile information.

## 3. Key Features (General)

- **Secure Authentication & Authorization:** Role-based access control (RBAC) to ensure users only access relevant information and features.
- **Centralized Information:** A single source of truth for academic data, schedules, and announcements.
- **Responsive Design:** UI adaptable to various screen sizes (desktop, tablet, mobile).
- **User-Friendly Interface:** Clean and intuitive design for ease of use.
- **Data Management:** CRUD (Create, Read, Update, Delete) operations for core entities like users, classes, subjects, and announcements.

## 4. Technical Overview

### a. Frontend
- **Framework:** Next.js (using App Router, Server Components by default)
- **Language:** TypeScript
- **UI Library:** Shadcn/UI (built on Radix UI and Tailwind CSS)
- **Styling:** Tailwind CSS
- **Form Management:** React Hook Form
- **Icons:** Lucide React
- **State Management (Client-Side):** React Context API (e.g., `AuthContext`), `useState`, `useEffect`

### b. Backend & Database
- **Platform:** Supabase
    - **Database:** PostgreSQL
    - **Authentication:** Supabase Auth (email/password, role-based)
    - **Storage:** Supabase Storage (for file uploads like materials, assignment submissions - *integration pending*)
    - **Security:** Row Level Security (RLS) policies for fine-grained data access control.
- **Data Mutation:** Next.js Server Actions for secure server-side operations.

### c. AI Integration (Planned)
- **Framework:** Genkit (integration not yet started)

## 5. Overall Architecture

- **Client-Server Model:** Next.js handles frontend rendering and server-side logic (Server Components, Server Actions).
- **Supabase as BaaS:** Supabase provides the backend infrastructure (database, auth, storage).
- **Component-Based UI:** The frontend is built using reusable React components.
- **Authentication Flow:**
    1. User registers or logs in via UI forms.
    2. Supabase Auth handles authentication.
    3. `AuthContext` manages client-side session state and user information.
    4. Next.js Middleware and Server Actions verify roles for protected routes and operations.
- **Data Flow:**
    1. Client components fetch data from Supabase (often via Server Components or Server Actions).
    2. Server Actions handle data mutations (Create, Update, Delete) and interact with Supabase Admin client for privileged operations.

## 6. Database Structure (Key Tables)

The database schema is designed to support the application's functionalities. Key tables include:

1.  **`users` (Supabase `auth.users`):** Stores core authentication information. User metadata (`raw_user_meta_data`) includes `role`, `full_name`, and `is_verified`.
2.  **`user_details`:** Extends `auth.users` with additional profile information (phone, address, NIS/NIP, join date, bio, etc.). Linked via `user_id`.
3.  **`classes`:** Stores class information (name, homeroom teacher ID).
4.  **`subjects`:** Stores subject information (name, code, description).
5.  **`class_students`:** Junction table linking students to classes.
6.  **`subject_teachers`:** Junction table linking teachers to subjects they teach.
7.  **`schedules`:** Stores detailed class schedules (class, subject, teacher, day, start/end time, room).
8.  **`assignments`:** Stores assignment details (title, description, subject, class, teacher, due date, file URL - *file URL integration pending*).
9.  **`submissions`:** Stores student assignment submissions (assignment, student, submission date, file URL, score, feedback - *file URL integration pending*).
10. **`attendance`:** Stores student attendance records (student, class, subject, date, status).
11. **`grades`:** Stores student grades for various assessments.
12. **`announcements`:** Stores school announcements (title, content, creator, target role, pinned status).
13. **`audit_logs`:** Records important system activities (user, action, entity, details).
14. **`inventories`:** (For Staff) Manages school inventory items.
15. **`finances`:** (For Staff) Manages financial transactions.
16. **`documents`:** (For Staff) Manages school documents and correspondence.

For detailed schema, refer to `supabase/migrations/<timestamp>_create_initial_tables.sql`.

## 7. Current Project Status & Known Issues

*(Refer to the latest "Rangkuman Progres Proyek" for a detailed list of completed features and remaining tasks/issues.)*

Key areas still requiring significant work include:
- Full database integration for all features (replacing dummy data).
- Comprehensive RLS policy implementation.
- Supabase Storage integration for file uploads.
- Full functionality for Teacher, Student, Staff, and Principal roles.
- Robust error handling and data validation.
- Genkit AI feature integration.
- Fixing existing bugs (e.g., chunk loading errors, hydration errors).
```