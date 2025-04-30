// src/app/admin/(dashboard)/layout.tsx
import React from 'react';
// You might want to include an admin-specific sidebar or header here
// For simplicity, this layout just renders the children for now.
// You can reuse or adapt the main AppLayout or create a dedicated AdminLayout component.

// Example: Import the main AppLayout if it's suitable
// import AppLayout from '@/app/(app)/layout'; // Adjust path if necessary

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Option 1: Basic structure
  return (
    <div>
      {/* You could add an Admin Header/Sidebar here */}
      <main className="p-4 md:p-6">
          {/* <h1>Admin Area</h1> */} {/* Optional Title */}
         {children}
      </main>
    </div>
  );

  // Option 2: Reuse AppLayout (ensure AppLayout handles role-based menus correctly)
  // return <AppLayout>{children}</AppLayout>;

  // Option 3: Create a dedicated AdminLayout component
  // return <AdminLayout>{children}</AdminLayout>;
}
