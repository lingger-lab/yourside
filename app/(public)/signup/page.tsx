'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { signInWithGoogle, signInWithKakao } from '@/lib/auth/actions'
import { GoogleIcon } from '@/components/icons/google'
import { KakaoIcon } from '@/components/icons/kakao'

function SignupContent() {
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') === 'partner' ? 'partner' : 'client'
  const [selectedRole, setSelectedRole] = useState<'client' | 'partner'>(initialRole)

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 animate-slide-up">
      <main className="flex w-full max-w-md flex-col items-center gap-8">
        <Link href="/" className="self-start text-sm text-text-muted hover:text-text transition-colors">
          &larr; 홈으로
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">회원가입</h1>
          <p className="mt-2 text-sm text-text-muted">
            지사네에서 시작할 공간을 선택하세요
          </p>
        </div>

        {/* 역할 선택 카드 */}
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={() => setSelectedRole('client')}
            className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${
              selectedRole === 'client'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border-light bg-white hover:border-primary/30'
            }`}
          >
            <span className={`text-lg font-bold ${selectedRole === 'client' ? 'text-primary' : 'text-text-muted'}`}>
              기업공간
            </span>
            <span className="text-xs text-text-muted text-center leading-relaxed">
              시니어 인력을 신청하고
              <br />
              전문 서비스를 받으세요
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('partner')}
            className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${
              selectedRole === 'partner'
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-border-light bg-white hover:border-accent/30'
            }`}
          >
            <span className={`text-lg font-bold ${selectedRole === 'partner' ? 'text-accent' : 'text-text-muted'}`}>
              시니어공간
            </span>
            <span className="text-xs text-text-muted text-center leading-relaxed">
              기업 매칭을 신청하고
              <br />
              경험을 가치로 만드세요
            </span>
          </button>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="flex w-full flex-col gap-3">
          <form action={signInWithKakao.bind(null, selectedRole)}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-base font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
            >
              <KakaoIcon />
              카카오로 회원가입
            </button>
          </form>
          <form action={signInWithGoogle.bind(null, selectedRole)}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-medium text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
            >
              <GoogleIcon />
              Google로 회원가입
            </button>
          </form>
        </div>

        <p className="text-xs text-text-subtle text-center leading-relaxed">
          이미 계정이 있으시면 자동으로 로그인됩니다.
          <br />
          가입 시{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-text-muted">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
      </main>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  )
}
