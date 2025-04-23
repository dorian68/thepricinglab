
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kjybaatgyigpqyywlmnw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeWJhYXRneWlncHF5eXdsbW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDAwNzYsImV4cCI6MjA2MDMxNjA3Nn0.3Vj8W28J_m4Xy5nbyR9TxrP6YjlXewdj7wj1OTn6dr4'

export const supabase = createClient(supabaseUrl, supabaseKey)
