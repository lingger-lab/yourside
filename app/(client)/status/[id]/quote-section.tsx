'use client'

import { useState } from 'react'
import { approveDeal } from '@/lib/deal/actions'
import { SubmitButton } from '@/components/submit-button'
import type { DealRow, PartnerRow } from '@/lib/types'

interface QuoteSectionProps {
  deal: DealRow
  partner: PartnerRow | null
}

export function QuoteSection({ deal, partner }: QuoteSectionProps) {
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    const result = await approveDeal(deal.id)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <h2 className="mb-4 font-semibold text-text">견적이 도착했습니다</h2>

      {/* 익명 파트너 카드 */}
      <div className="mb-4 rounded-lg border border-border bg-background p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            P
          </div>
          <div>
            <p className="font-medium text-text">
              {partner?.career_yrs
                ? `경력 ${partner.career_yrs}년 파트너`
                : '곁에 인증 파트너'}
            </p>
            {partner?.field && (
              <p className="text-xs text-text-muted">전문 분야: {partner.field}</p>
            )}
          </div>
        </div>
      </div>

      {/* 총 금액 — total_pay만 표시 (직거래 방지) */}
      <div className="mb-4 text-center">
        <p className="text-sm text-text-muted">총 비용</p>
        <p className="text-3xl font-bold text-primary">
          {deal.total_pay.toLocaleString('ko-KR')}
          <span className="text-base font-normal">원</span>
        </p>
        <p className="mt-1 text-xs text-text-muted">VAT 별도</p>
      </div>

      {/* 에스크로 안내 */}
      <div className="mb-4 rounded-lg bg-background p-3">
        <p className="text-xs text-text-muted">
          곁에 에스크로 안전결제로 진행됩니다. 결제 금액은 작업 완료 및 검수
          확인 후 파트너에게 정산됩니다.
        </p>
      </div>

      {/* 납기일 */}
      {deal.due_date && (
        <p className="mb-4 text-sm text-text-muted">
          예상 납기일: {new Date(deal.due_date).toLocaleDateString('ko-KR')}
        </p>
      )}

      {/* 에러 */}
      {error && <p className="mb-2 text-sm text-accent">{error}</p>}

      {/* 버튼 */}
      <div className="flex gap-3">
        <form action={handleApprove} className="flex-1">
          <SubmitButton className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
            견적 승인
          </SubmitButton>
        </form>
        <a
          href="https://pf.kakao.com/_placeholder"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-lg border border-border px-4 py-3 text-sm text-text-muted transition-colors hover:bg-surface"
        >
          금액 상의
        </a>
      </div>
    </div>
  )
}
