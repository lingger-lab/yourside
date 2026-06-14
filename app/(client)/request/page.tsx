'use client'

import { useActionState, useState } from 'react'
import { createRequest } from '@/lib/request/actions'
import { SubmitButton } from '@/components/submit-button'

const QUICK_CHIPS = [
  '창업코칭',
  '정부자금·보조금',
  '사업계획서',
  'AEO최적화',
  'AI진단',
  '디자인',
  '웹개발',
  '영상제작',
  '마케팅',
  '세무·회계',
  '법무',
  '노무',
  '기타',
] as const

export default function RequestPage() {
  const [state, formAction] = useActionState(createRequest, {})
  const [selectedChip, setSelectedChip] = useState<string | null>(null)

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-primary">일 맡기기</h1>

      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm('의뢰를 등록하시겠습니까?')) e.preventDefault()
        }}
        className="flex flex-col gap-5"
      >
        {/* 퀵칩 — req_type 선택 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text">
            어떤 일을 맡기시나요?
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setSelectedChip(selectedChip === chip ? null : chip)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selectedChip === chip
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border text-text-muted hover:border-primary/50'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <input type="hidden" name="req_type" value={selectedChip || ''} />
        </div>

        {/* 제목 */}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-text">
            의뢰 제목 <span className="text-accent">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="예: 카페 로고 디자인 의뢰"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* 상세 내용 */}
        <div>
          <label htmlFor="detail" className="mb-1 block text-sm font-medium text-text">
            상세 내용 <span className="text-accent">*</span>
          </label>
          <textarea
            id="detail"
            name="detail"
            required
            rows={6}
            placeholder="원하시는 작업 내용을 자유롭게 적어주세요. 곁에 매니저가 확인 후 적합한 파트너를 연결해드립니다."
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* 희망 예산 (선택) */}
        <div>
          <label htmlFor="budget_hope" className="mb-1 block text-sm font-medium text-text">
            희망 예산 <span className="text-xs text-text-muted">(선택)</span>
          </label>
          <div className="relative">
            <input
              id="budget_hope"
              name="budget_hope"
              type="number"
              min="0"
              step="10000"
              placeholder="예: 500000"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-10 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
              원
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {state.error && (
          <p className="text-sm text-accent">{state.error}</p>
        )}

        {/* 제출 */}
        <SubmitButton className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
          의뢰 등록하기
        </SubmitButton>
      </form>
    </div>
  )
}
