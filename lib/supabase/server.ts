import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-only client — never expose this to the browser
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey
)