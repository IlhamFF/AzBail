import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://syuydfiffsduvkopeqda.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dXlkZmlmZnNkdXZrb3BlcWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTU1MTAsImV4cCI6MjA2MTQ3MTUxMH0.odTyMP6qcELDLkdd9BQAiw6Ii99oSBlfsJZhzeyCUQs'; // Gunakan variabel lingkungan untuk keaman

export const supabase = createClient(supabaseUrl, supabaseKey);