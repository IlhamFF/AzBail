# Database Table Structure

This document outlines the database table structure for the project, based on the provided schema images. It includes descriptions for each table, their columns, data types, primary keys, and foreign key relationships. Two options are presented for managing schedule data.

## Option 1: Separate Student and Teacher Schedule Tables

This option uses two distinct tables for student and teacher schedules, as shown in the initial schema.

### `auth.users`

*(This table is managed by Supabase Auth and contains user authentication information.)*

-   `id` (uuid, Primary Key)
-   `created_at` (timestamp with time zone)
-   ... (other default Supabase auth columns)

### `announcements`

-   `id` (uuid, Primary Key, Identity)
-   `title` (text)
-   `content` (text)
-   `created_by` (uuid, Foreign Key referencing `auth.users.id`)
-   `is_pinned` (boolean)
-   `target_role` (text)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `student_schedules`

-   `id` (uuid, Primary Key, Identity)
-   `student_id` (uuid, Foreign Key referencing `auth.users.id`)
-   `class_id` (uuid, Foreign Key referencing `classes.id`)
-   `subject_id` (uuid, Foreign Key referencing `subjects.id`)
-   `day` (text)
-   `time_start` (time with time zone)
-   `time_end` (time with time zone)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `teacher_schedules`

-   `id` (uuid, Primary Key, Identity)
-   `teacher_id` (uuid, Foreign Key referencing `auth.users.id`)
-   `class_id` (uuid, Foreign Key referencing `classes.id`)
-   `subject_id` (uuid, Foreign Key referencing `subjects.id`)
-   `day` (text)
-   `time_start` (time with time zone)
-   `time_end` (time with time zone)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `classes`

-   `id` (uuid, Primary Key, Identity)
-   `name` (text)
-   `homeroom_teacher_id` (uuid, Foreign Key referencing `auth.users.id`)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `subjects`

-   `id` (uuid, Primary Key, Identity)
-   `subject_name` (text)
-   `subject_code` (text)
-   `description` (text)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `attendance`

-   `id` (uuid, Primary Key, Identity)
-   `student_id` (uuid, Foreign Key referencing `auth.users.id`)
-   `class_id` (uuid, Foreign Key referencing `classes.id`)
-   `date` (date)
-   `status` (text, e.g., 'Present', 'Absent', 'Late')
-   `recorded_by` (uuid, Foreign Key referencing `auth.users.id`)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `materials`

-   `id` (uuid, Primary Key, Identity)
-   `title` (text)
-   `description` (text)
-   `subject_id` (uuid, Foreign Key referencing `subjects.id`)
-   `teacher_id` (uuid, Foreign Key referencing `auth.users.id`)
-   `class_id` (uuid, Foreign Key referencing `classes.id`)
-   `file_url` (text)
-   `upload_date` (timestamp with time zone)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `assignments`

-   `id` (uuid, Primary Key, Identity)
-   `title` (text)
-   `description` (text)
-   `subject_id` (uuid, Foreign Key referencing `subjects.id`)
-   `class_id` (uuid, Foreign Key referencing `classes.id`)
-   `teacher_id` (uuid, Foreign Key referencing `auth.users.id`)
-   `deadline` (timestamp with time zone)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `submissions`

-   `id` (uuid, Primary Key, Identity)
-   `assignment_id` (uuid, Foreign Key referencing `assignments.id`)
-   `student_id` (uuid, Foreign Key referencing `auth.users.id`)
-   `file_url` (text)
-   `submitted_at` (timestamp with time zone)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `grades`

-   `id` (uuid, Primary Key, Identity)
-   `student_id` (uuid, Foreign Key referencing `auth.users.id`)
-   `subject_id` (uuid, Foreign Key referencing `subjects.id`)
-   `assignment_id` (uuid, Foreign Key referencing `assignments.id`)
-   `assessment_type` (text)
-   `score` (numeric)
-   `feedback` (text)
-   `graded_by` (uuid, Foreign Key referencing `auth.users.id`)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `audit_logs`

-   `id` (uuid, Primary Key, Identity)
-   `timestamp` (timestamp with time zone)
-   `user_id` (uuid, Foreign Key referencing `auth.users.id`)
-   `action` (text)
-   `target_type` (text)
-   `target_id` (uuid)
-   `details` (jsonb)
-   `created_at` (timestamp with time zone)

## Option 2: Consolidated Schedules Table

This option uses a single `schedules` table to store schedules for both students and teachers, using a column to differentiate the user type.

### `auth.users`

*(Same as Option 1)*

### `announcements`

*(Same as Option 1)*

### `schedules`

-   `id` (uuid, Primary Key, Identity)
-   `user_id` (uuid, Foreign Key referencing `auth.users.id`) - Can be either student or teacher
-   `user_type` (text, e.g., 'student', 'teacher') - To differentiate student/teacher schedules
-   `class_id` (uuid, Foreign Key referencing `classes.id`)
-   `subject_id` (uuid, Foreign Key referencing `subjects.id`)
-   `day` (text)
-   `time_start` (time with time zone)
-   `time_end` (time with time zone)
-   `created_at` (timestamp with time zone)
-   `updated_at` (timestamp with time zone)

### `classes`

*(Same as Option 1)*

### `subjects`

*(Same as Option 1)*

### `attendance`

*(Same as Option 1)*

### `materials`

*(Same as Option 1)*

### `assignments`

*(Same as Option 1)*

### `submissions`

*(Same as Option 1)*

### `grades`

*(Same as Option 1)*

### `audit_logs`

*(Same as Option 1)*