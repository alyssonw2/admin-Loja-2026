import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://idmhjpsuoxzyshzttgmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbWhqcHN1b3h6eXNoenR0Z21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjQ0OTMsImV4cCI6MjA3OTg0MDQ5M30.SGlFj9_niUk6n2TxkxYnWtbrP-x2dYIlisabTx5rw7w';

export const supabase = createClient(supabaseUrl, supabaseKey);