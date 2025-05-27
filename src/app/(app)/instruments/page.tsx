import { createClient } from '@/utils/supabase/server';

export default async function Instruments() {
  try {
    const supabase = await createClient();
    const { data: instruments, error } = await supabase.from("instruments").select();

    if (error) {
      console.error("Error fetching instruments:", error);
      return <div className="p-6 text-center text-red-500">Gagal memuat data instrumen. Silakan coba lagi nanti.</div>;
    }

    if (!instruments || instruments.length === 0) {
      return <div className="p-6 text-center text-muted-foreground">Tidak ada data instrumen yang tersedia saat ini.</div>;
    }

    // Data successfully fetched and not empty. Display a placeholder message.
    return <div className="p-6 text-center text-green-600">Data instrumen berhasil dimuat. ({instruments.length} item ditemukan)</div>;
  } catch (e) {
    console.error("Unexpected error fetching instruments:", e);
    return <div className="p-6 text-center text-red-500">Terjadi kesalahan tak terduga saat memuat data instrumen.</div>;
  }
}