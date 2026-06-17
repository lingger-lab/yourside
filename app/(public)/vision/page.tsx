'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function VisionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const role = searchParams.get('role') || 'client'
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('yourside_vision_seen')
    if (seen) {
      redirectToMain(role)
      return
    }
    setVisible(true)
  }, [role])

  function handleContinue() {
    localStorage.setItem('yourside_vision_seen', 'true')
    redirectToMain(role)
  }

  function handleSkip() {
    localStorage.setItem('yourside_vision_seen', 'true')
    redirectToMain(role)
  }

  function redirectToMain(r: string) {
    if (r === 'partner') {
      router.replace('/register')
    } else {
      router.replace('/request')
    }
  }

  if (!visible) return null

  const isPartner = role === 'partner'

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 animate-slide-up">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <h1 className="whitespace-pre-line text-3xl font-bold leading-tight text-primary">
          {isPartner
            ? '당신의 경험이\n월 100만원 이상의 가치가 됩니다'
            : '월 100만원 이상의\n전문가 효과를 경험하세요'}
        </h1>

        <p className="text-base leading-relaxed text-text-muted">
          {isPartner
            ? '지사네는 검증된 시니어에게 정당한 작업료를 보장합니다.\n수수료 0%, 작업료 전액을 지급합니다.'
            : '지사네가 검증한 시니어 전문가가\n기업의 일을 곁에서 도와드립니다.'}
        </p>

        <ul className="flex flex-col gap-3 text-left text-sm">
          {isPartner ? (
            <>
              <li>시니어 수수료 0% — 작업료 전액 지급</li>
              <li>지사네 에스크로로 안전하게 보관</li>
              <li>지사네 전문가 네트워크의 공정한 평가</li>
            </>
          ) : (
            <>
              <li>지사네 전문가 네트워크가 직접 검증</li>
              <li>에스크로 안전결제 — 검수 후 정산</li>
              <li>기업 수수료 0% — 매칭비만 별도</li>
            </>
          )}
        </ul>

        <div className="flex w-full flex-col gap-3">
          <button
            onClick={handleContinue}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-primary text-lg font-semibold text-white shadow-md transition-all hover:bg-primary-light hover:shadow-lg btn-press"
          >
            시작하기
          </button>
          <button
            onClick={handleSkip}
            className="text-sm text-text-muted underline underline-offset-4 transition-colors hover:text-text"
          >
            건너뛰기
          </button>
        </div>

        <p className="text-xs leading-relaxed text-text-subtle">
          ※ &quot;월 100만원 이상&quot;은 수익을 보장하는 것이 아니라, 지사네가 함께
          지향하는 목표입니다. 실제 수입은 거래 건수와 내용에 따라 더 클 수도 있습니다.
        </p>
      </main>
    </div>
  )
}

export default function VisionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      }
    >
      <VisionContent />
    </Suspense>
  )
}
