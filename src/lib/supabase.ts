import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export const BUCKET = 'attachments'

export function getPublicUrl(templateId: string, filename: string) {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`${templateId}/${filename}`)
  return data.publicUrl
}
