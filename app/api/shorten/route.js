import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

export async function POST(request) {
  try {
    // Request body se data lo
    const { original_url, custom_code, user_id } = await request.json()

    // Validation
    if (!original_url || !user_id) {
      return Response.json(
        { error: 'URL and user ID are required' },
        { status: 400 }
      )
    }

    // URL format check
    try {
      new URL(original_url)
    } catch {
      return Response.json(
        { error: 'Please enter a valid URL (include https://)' },
        { status: 400 }
      )
    }

    // Supabase client (service role - RLS bypass karne ke liye server side pe)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Short code decide karo
    const short_code = custom_code?.trim() || nanoid(6)

    // Check karo — kahi ye short code already exist toh nahi karta
    const { data: existing } = await supabase
      .from('links')
      .select('id')
      .eq('short_code', short_code)
      .single()

    if (existing) {
      return Response.json(
        { error: 'This custom code is already taken. Try another one.' },
        { status: 409 }
      )
    }

    // Database me save karo
    const { data, error } = await supabase
      .from('links')
      .insert({
        user_id,
        original_url,
        short_code,
        clicks: 0
      })
      .select()
      .single()

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json({ success: true, link: data }, { status: 201 })

  } catch (err) {
    return Response.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}