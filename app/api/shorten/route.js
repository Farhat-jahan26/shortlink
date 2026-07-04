import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const { original_url, custom_code } = await request.json()

    if (!original_url) {
      return Response.json(
        { error: 'URL is required' },
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

    // Supabase client banao
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Auth header frontend se lo
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Token se user verify karo
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const short_code = custom_code?.trim() || nanoid(6)

    // Check duplicate short code
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

    // Insert with verified user id
    const { data, error } = await supabase
      .from('links')
      .insert({
        user_id: user.id,
        original_url,
        short_code,
        clicks: 0
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, link: data }, { status: 201 })

  } catch (err) {
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}