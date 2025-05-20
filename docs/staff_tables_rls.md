
# Kode SQL dan Kebijakan RLS untuk Tabel Fitur Staf (Tata Usaha)

Dokumen ini berisi perintah SQL untuk membuat tabel-tabel yang terkait dengan fitur Staf (Tata Usaha) serta kebijakan Row Level Security (RLS) dasar untuk tabel-tabel tersebut.

## Fungsi Trigger Umum

Fungsi ini akan secara otomatis memperbarui kolom `updated_at` setiap kali sebuah baris diubah.

```sql
-- Fungsi untuk memperbarui kolom updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 1. Tabel `student_payments`

Tabel ini digunakan untuk mencatat semua transaksi pembayaran dari siswa.

```sql
-- Membuat tabel student_payments
CREATE TABLE public.student_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT, -- Merujuk ke auth.users.id siswa
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  payment_type TEXT NOT NULL, -- Contoh: 'SPP Bulan Juli 2024', 'Uang Gedung Tahap 1', 'Pembelian Buku Paket IPA'
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'Belum Lunas', -- Contoh: 'Lunas', 'Belum Lunas', 'Cicilan Ke-2'
  method TEXT, -- Contoh: 'Tunai', 'Transfer Bank', 'Virtual Account'
  reference_number TEXT, -- Nomor referensi jika ada (misal dari transfer)
  notes TEXT,
  recorded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT, -- Merujuk ke auth.users.id staf/admin yang mencatat
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX idx_student_payments_student_user_id ON public.student_payments(student_user_id);
CREATE INDEX idx_student_payments_recorded_by_user_id ON public.student_payments(recorded_by_user_id);
CREATE INDEX idx_student_payments_payment_date ON public.student_payments(payment_date);

-- Trigger untuk updated_at
CREATE TRIGGER update_student_payments_updated_at
BEFORE UPDATE ON public.student_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Aktifkan RLS
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS untuk student_payments
CREATE POLICY "Staf dan Admin bisa melihat semua pembayaran"
ON public.student_payments FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin');

CREATE POLICY "Siswa bisa melihat pembayaran mereka sendiri"
ON public.student_payments FOR SELECT
TO authenticated
USING (auth.uid() = student_user_id AND (auth.jwt() ->> 'role')::text = 'Siswa');

CREATE POLICY "Staf dan Admin bisa mencatat pembayaran baru"
ON public.student_payments FOR INSERT
TO authenticated
WITH CHECK (((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin') AND auth.uid() = recorded_by_user_id);

CREATE POLICY "Staf dan Admin bisa mengubah data pembayaran"
ON public.student_payments FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin')
WITH CHECK (((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin') AND auth.uid() = recorded_by_user_id);

CREATE POLICY "Hanya Admin yang bisa menghapus data pembayaran"
ON public.student_payments FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'Admin');

```

## 2. Tabel `school_expenses`

Tabel ini digunakan untuk mencatat semua pengeluaran sekolah.

```sql
-- Membuat tabel school_expenses
CREATE TABLE public.school_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL, -- Contoh: 'Operasional Kantor', 'Pembelian ATK', 'Listrik & Air', 'Perbaikan Gedung'
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  receipt_url TEXT, -- URL ke bukti pembayaran jika ada (disimpan di Supabase Storage)
  vendor TEXT, -- Nama vendor atau pihak ketiga
  recorded_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT, -- Merujuk ke auth.users.id staf/admin yang mencatat
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX idx_school_expenses_recorded_by_user_id ON public.school_expenses(recorded_by_user_id);
CREATE INDEX idx_school_expenses_expense_date ON public.school_expenses(expense_date);
CREATE INDEX idx_school_expenses_category ON public.school_expenses(category);

-- Trigger untuk updated_at
CREATE TRIGGER update_school_expenses_updated_at
BEFORE UPDATE ON public.school_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Aktifkan RLS
ALTER TABLE public.school_expenses ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS untuk school_expenses
CREATE POLICY "Staf dan Admin bisa melihat semua pengeluaran sekolah"
ON public.school_expenses FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin');

CREATE POLICY "Staf dan Admin bisa mencatat pengeluaran baru"
ON public.school_expenses FOR INSERT
TO authenticated
WITH CHECK (((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin') AND auth.uid() = recorded_by_user_id);

CREATE POLICY "Staf dan Admin bisa mengubah data pengeluaran"
ON public.school_expenses FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin')
WITH CHECK (((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin') AND auth.uid() = recorded_by_user_id);

CREATE POLICY "Hanya Admin yang bisa menghapus data pengeluaran"
ON public.school_expenses FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'Admin');

```

## 3. Tabel `inventory_items`

Tabel ini digunakan untuk mencatat barang-barang inventaris sekolah.

```sql
-- Membuat tabel inventory_items
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL, -- Contoh: 'Elektronik', 'Mebel', 'Alat Tulis Kantor', 'Peralatan Olahraga'
  location TEXT NOT NULL, -- Contoh: 'Ruang Guru', 'Lab Komputer A', 'Gudang Utama', 'Perpustakaan'
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'unit', -- Contoh: 'unit', 'buah', 'set', 'lusin', 'pak'
  condition TEXT NOT NULL DEFAULT 'Baik', -- Contoh: 'Baik', 'Perlu Perbaikan', 'Rusak Ringan', 'Rusak Berat', 'Tidak Layak Pakai'
  purchase_date DATE,
  supplier TEXT,
  price_per_unit NUMERIC CHECK (price_per_unit >= 0),
  notes TEXT,
  last_checked_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- User yang terakhir mengecek
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX idx_inventory_items_item_name ON public.inventory_items(item_name);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX idx_inventory_items_location ON public.inventory_items(location);

-- Trigger untuk updated_at
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Aktifkan RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS untuk inventory_items
CREATE POLICY "Staf dan Admin bisa melihat semua item inventaris"
ON public.inventory_items FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin');

CREATE POLICY "Staf dan Admin bisa menambah item inventaris baru"
ON public.inventory_items FOR INSERT
TO authenticated
WITH CHECK (((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin'));

CREATE POLICY "Staf dan Admin bisa mengubah data item inventaris"
ON public.inventory_items FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin')
WITH CHECK ((auth.jwt() ->> 'role')::text = 'Tata Usaha' OR (auth.jwt() ->> 'role')::text = 'Admin');

CREATE POLICY "Hanya Admin yang bisa menghapus data item inventaris"
ON public.inventory_items FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'role')::text = 'Admin');
```

**Catatan Penting:**

*   **Foreign Keys ke `users` (bukan `user_details`):** Untuk kolom seperti `student_user_id`, `recorded_by_user_id`, `last_checked_by_user_id`, saya mereferensikannya langsung ke tabel `public.users(id)` (yang merupakan alias untuk `auth.users(id)` setelah skema `auth` diekspos ke `public` atau Anda membuat view/replikasi). Ini karena `auth.uid()` yang digunakan dalam RLS akan mengembalikan ID dari `auth.users`. Jika Anda ingin menyimpan informasi detail pengguna yang melakukan aksi, Anda bisa join ke `user_details` menggunakan `user_id` dari `users` saat melakukan query.
*   **Peran dalam RLS:** Kebijakan RLS di atas menggunakan `(auth.jwt() ->> 'role')::text` untuk mendapatkan peran pengguna yang sedang terautentikasi. Pastikan metadata peran (`role`) sudah tersimpan dengan benar di `raw_user_meta_data` pengguna di Supabase Auth.
*   **Kebijakan Lebih Spesifik:** Kebijakan RLS ini adalah contoh dasar. Anda mungkin perlu menyesuaikannya lebih lanjut. Misalnya, untuk `student_payments`, Anda mungkin ingin siswa hanya bisa melihat riwayat pembayaran mereka sendiri, atau guru wali kelas bisa melihat pembayaran siswa di kelasnya.
*   **Testing:** Setelah menerapkan skema dan RLS ini, uji secara menyeluruh dari sisi aplikasi untuk memastikan izin akses berfungsi sesuai harapan.
*   **Migrasi:** Gunakan sistem migrasi Supabase untuk menerapkan perubahan skema ini ke database Anda, jangan langsung menjalankan query di SQL Editor untuk lingkungan produksi.

Anda dapat menyalin dan menjalankan kode SQL ini di SQL Editor Supabase Anda. Pastikan Anda memahami setiap bagian sebelum menjalankannya, terutama bagian RLS.