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

  // 선택한 역할의 레코드가 없으면 생성 (한 계정으로 양쪽 역할 모두 가능)
  let isNewRole = false
  if (role === 'client' && !existingClient) {
    isNewRole = true
    const { error: insertErr } = await adminClient.from('client').insert({
      auth_user_id: user.id,
      provider,
      email: user.email!,
    })
    if (insertErr) {
      console.error('[auth/callback] client insert failed:', insertErr.message)
      return NextResponse.redirect(`${origin}/?error=profile_create`)
    }
  } else if (role === 'partner' && !existingPartner) {
    isNewRole = true
    const { error: insertErr } = await adminClient.from('partner').insert({
      auth_user_id: user.id,
      provider,
      email: user.email!,
    })
    if (insertErr) {
      console.error('[auth/callback] partner insert failed:', insertErr.message)
      return NextResponse.redirect(`${origin}/?error=profile_create`)
    }
  }

  // 관리자 이메일이면 대시보드로 바로 이동
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  if (adminEmails.includes(user.email || '')) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  const isFirstLogin = !existingClient && !existingPartner
  if (isFirstLogin) {
    return NextResponse.redirect(`${origin}/vision?role=${role}`)
  }

  // 선택한 역할로 라우팅
  if (role === 'partner') {
    return NextResponse.redirect(`${origin}/${isNewRole ? 'register' : 'matching'}`)
  }
  return NextResponse.redirect(`${origin}/request`)
}
