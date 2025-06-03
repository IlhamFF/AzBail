// File: supabase/functions/_shared/cors.ts

export const corsHeaders = {
    // 'Access-Control-Allow-Origin': '*' mengizinkan akses dari domain mana saja.
    // Ini oke untuk development dan testing awal.
    // Untuk produksi, sebaiknya ganti '*' dengan domain frontend aplikasi kamu
    // misalnya: 'https://www.aplikasikamu.com'
    'Access-Control-Allow-Origin': '*',
  
    // 'Access-Control-Allow-Headers' menentukan header apa saja yang diizinkan
    // dalam request dari client.
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  
    // 'Access-Control-Allow-Methods' menentukan metode HTTP apa saja yang diizinkan.
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Tambahkan metode lain jika perlu
  };cd 