// File: supabase/functions/halo-dunia/index.ts

// Kita akan butuh ini untuk CORS (Cross-Origin Resource Sharing)
// File cors.ts ini akan kita buat di langkah berikutnya.
import { corsHeaders } from '../_shared/cors.ts'

// Ini cuma buat nandain di log server kalau function kita dipanggil
console.log("Halo Dunia function dipanggil!");

// Deno.serve() adalah cara standar untuk menjalankan server HTTP di Deno,
// runtime yang dipakai Supabase Edge Functions.
Deno.serve(async (req: Request) => {
  // Bagian ini penting untuk menangani permintaan 'OPTIONS' dari browser.
  // Ini adalah bagian dari protokol CORS (sering disebut preflight request).
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Siapkan data yang mau kita kirim balik sebagai jawaban.
    // Formatnya JSON (JavaScript Object Notation).
    const dataYangDikirim = {
      message: "Halo dari Supabase Edge Function!",
      timestamp: new Date().toISOString() // Kita tambahin waktu biar seru
    };

    // Kirim jawaban (Response) dengan status 200 (OK).
    // Jawabannya dalam format JSON.
    return new Response(
      JSON.stringify(dataYangDikirim), // Ubah objek JavaScript jadi string JSON
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // Set header
    );
  } catch (error) {
    // Kalau ada error pas proses di atas, kita kirim jawaban error.
    console.error("Error di dalam Edge Function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 } // Status 500 artinya Internal Server Error
    );
  }
});