import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function GET(request, { params }) {
  const { shortcode } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // Database me short code dhundo
  const { data: link, error } = await supabase
    .from('links')
    .select('id, original_url, clicks')
    .eq('short_code', shortcode)
    .single()

  // Nahi mila toh 404
  if (error || !link) {
    return Response.json(
      { error: 'Short link not found' },
      { status: 404 }
    )
  }

  // Click count badhao
  await supabase
    .from('links')
    .update({ clicks: link.clicks + 1 })
    .eq('id', link.id)

  // Click log save karo
  await supabase
    .from('click_logs')
    .insert({ link_id: link.id })

  // Original URL pe redirect karo
  redirect(link.original_url)
}