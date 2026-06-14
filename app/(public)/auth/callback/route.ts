import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/?error=exchange_failed`)
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.redirect(`${origin}/?error=no_user`)
  }

  const role = (cookieStore.get('yourside_role')?.value as UserRole) || 'client'
  cookieStore.delete('yourside_role')

  const provider = (user.app_metadata.provider as string) || 'google'

  const { data: existingClient } = await adminClient
    .from('client')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: existingPartner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  let isNewUser = false
  let effectiveRole: UserRole = role

  if (existingClient) {
    effectiveRole = 'client'
  } else if (existingPartner) {
    effectiveRole = 'partner'
  } else {
    isNewUser = true
    if (role === 'partner') {
      await adminClient.from('partner').insert({
        auth_user_id: user.id,
        provider,
        email: user.email!,
      })
    } else {
      await adminClient.from('client').insert({
        auth_user_id: user.id,
        provider,
        email: user.email!,
      })
    }
  }

  if (isNewUser) {
    return NextResponse.redirect(`${origin}/vision?role=${effectiveRole}`)
  }

  if (effectiveRole === 'partner') {
    return NextResponse.redirect(`${origin}/register`)
  }
  return NextResponse.redirect(`${origin}/request`)
}
