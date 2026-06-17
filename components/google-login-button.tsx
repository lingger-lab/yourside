'use client'

import { useState } from 'react'
import { signInWithGoogle } from '@/lib/auth/actions'
import { GoogleIcon } from '@/components/icons/google'
import { isInAppBrowser, escapeInAppBrowser } from '@/lib/utils/in-app-browser'
import type { UserRole } from '@/lib/types'

type Phase = 'idle' | 'confirm' | 'redirecting' | 'manual'

// 구글 로그인 버튼.
// 인앱 브라우저(카카오톡 등)에서는 구글 OAuth가 disallowed_useragent로
// 차단되므로, 클릭 시 서버 액션을 막고 확인 오버레이를 띄운다.
// 사용자가 "외부 브라우저로 열기"를 고르면 이동하고, "취소"면 닫는다.
export function GoogleLoginButton({
  role,
  label,
  className,
}: {
  role: UserRole
  label: string
  className: string
}) {
  const [phase, setPhase] = useState<Phase>('idle')

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isInAppBrowser()) return // 일반 브라우저: 서버 액션 그대로 진행
    e.preventDefault()
    setPhase('confirm') // 외부 이동 여부를 사용자가 선택
  }

  const handleOpenExternal = () => {
    // 오버레이를 먼저 그린 뒤(다음 프레임) 외부 브라우저로 이동
    setPhase('redirecting')
    requestAnimationFrame(() => {
      const escaped = escapeInAppBrowser()
      if (!escaped) setPhase('manual') // iOS 기타 인앱: 자동 이동 불가
    })
  }

  return (
    <>
      <form action={signInWithGoogle.bind(null, role)}>
        <button type="submit" className={className} onClick={handleClick}>
          <GoogleIcon />
          {label}
        </button>
      </form>

      {phase !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center shadow-xl">
            {phase === 'confirm' ? (
              <>
                <p className="text-base font-semibold text-text">
                  외부 브라우저로 이동할까요?
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  구글 로그인은 안전한 브라우저(크롬·사파리)에서만 가능합니다.
                  <br />
                  지금 화면(인앱 브라우저)에서는 로그인이 차단됩니다.
                </p>
                <div className="mt-1 flex w-full gap-2">
                  <button
                    type="button"
                    onClick={() => setPhase('idle')}
                    className="flex-1 rounded-lg border border-border-light px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenExternal}
                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    외부 브라우저로 열기
                  </button>
                </div>
              </>
            ) : phase === 'redirecting' ? (
              <>
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-base font-semibold text-text">
                  외부 브라우저로 이동합니다
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  잠시 후 자동으로 열립니다.
                  <br />
                  열리지 않으면 아래 닫기를 누른 뒤 다시 시도해주세요.
                </p>
                <button
                  type="button"
                  onClick={() => setPhase('idle')}
                  className="mt-1 text-xs text-text-subtle hover:text-text-muted transition-colors"
                >
                  닫기
                </button>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-text">
                  외부 브라우저에서 열어주세요
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  인앱 브라우저에서는 구글 로그인이 차단됩니다.
                  <br />
                  우측 하단 메뉴 &rarr; <b>&ldquo;다른 브라우저로 열기&rdquo;</b>(Safari)를
                  선택한 뒤 다시 시도해주세요.
                </p>
                <button
                  type="button"
                  onClick={() => setPhase('idle')}
                  className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
                >
                  확인
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
