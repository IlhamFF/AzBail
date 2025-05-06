# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Deskripsi Fitur Menu Siswa

Berikut adalah deskripsi untuk fitur-fitur pada menu siswa beserta aksi yang dapat dilakukan:

*   **Dashboard:** Halaman ringkasan yang menampilkan informasi penting bagi siswa.
    *   **Aksi:**
        *   Melihat ringkasan tugas yang belum selesai.
        *   Melihat pengingat ujian mendatang.
        *   Melihat persentase kehadiran.
        *   Melihat grafik performa nilai.
        *   Navigasi cepat ke halaman detail terkait (misalnya, ke halaman Tugas atau Nilai).

*   **Jadwal Pelajaran:** Menampilkan jadwal pelajaran siswa untuk minggu ini.
    *   **Aksi:**
        *   Melihat jadwal pelajaran harian dan mingguan.
        *   Melihat nama mata pelajaran, guru pengampu, dan waktu pelajaran.

*   **Nilai:** Menampilkan daftar nilai siswa per mata pelajaran.
    *   **Aksi:**
        *   Melihat nilai untuk setiap jenis penilaian (ulangan harian, tugas, UTS, UAS).
        *   Melihat status kelulusan atau remedial (jika ada).
        *   Melihat rata-rata nilai per mata pelajaran.

*   **Absensi:** Menampilkan rekap kehadiran siswa.
    *   **Aksi:**
        *   Melihat riwayat kehadiran (hadir, sakit, izin, alpa) per mata pelajaran dan per tanggal.
        *   Melihat ringkasan persentase kehadiran.

*   **Materi Pelajaran:** Menampilkan daftar materi pelajaran yang diunggah oleh guru.
    *   **Aksi:**
        *   Melihat daftar materi berdasarkan mata pelajaran.
        *   Mengunduh file materi pelajaran yang diunggah guru.
        *   Melihat deskripsi atau instruksi terkait materi.

*   **Tugas:** Menampilkan daftar tugas yang diberikan oleh guru.
    *   **Aksi:**
        *   Melihat daftar tugas beserta judul, mata pelajaran, guru pemberi tugas, dan batas waktu pengumpulan.
        *   Melihat instruksi detail untuk setiap tugas.
        *   Mengunduh file lampiran tugas (jika ada).
        *   Mengunggah file jawaban/pengumpulan tugas.
        *   Melihat status pengumpulan tugas (belum dikumpulkan, sudah dikumpulkan, terlambat, dinilai).

*   **Pengumuman:** Menampilkan pengumuman yang ditujukan untuk siswa atau seluruh sekolah.
    *   **Aksi:**
        *   Membaca isi pengumuman.
        *   Melihat pengumuman yang diprioritaskan (pinned).
        *   Melihat tanggal dan pembuat pengumuman.

*   **Profil:** Menampilkan informasi profil siswa.
    *   **Aksi:**
        *   Melihat detail data diri (nama, NIS, kelas, dll.).
        *   Memperbarui informasi kontak (nomor telepon, alamat email jika diizinkan).
        *   Mengganti foto profil (jika fitur diaktifkan).
        *   Mengubah kata sandi.
