'use client'

import { useState } from 'react'
import { confirmDeal, requestRevision } from '@/lib/deal/actions'
import { SubmitButton } from '@/components/submit-button'

interface InspectionSectionProps {
  dealId: string
}

export function InspectionSection({ dealId }: InspectionSectionProps) {
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionError, setRevisionError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  async function handleConfirm() {
    const result = await confirmDeal(dealId)
    if (result?.error) {
      setConfirmError(result.error)
    }
  }

  async function handleRevision(formData: FormData) {
    const reason = formData.get('reason') as string
    if (!reason?.trim()) {
      setRevisionError('수정 사유를 입력해주세요.')
      return
    }
    const result = await requestRevision(dealId, reason.trim())
    if (result.error) {
      setRevisionError(result.error)
    } else {
      setShowRevisionForm(false)
      setRevisionError(null)
    }
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-2 text-sm font-semibold text-text">검수</h3>
      <p className="mb-4 text-xs text-text-muted">
        작업 결과를 확인하고 검수를 진행해주세요. 3일 내 응답이 없으면 자동으로
        검수가 확정됩니다.
      </p>

      <div className="flex flex-col gap-2">
        {confirmError && (
          <p className="text-xs text-accent">{confirmError}</p>
        )}
        {/* 검수완료 */}
        <form action={handleConfirm}>
          <SubmitButton className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50">
            검수완료
          </SubmitButton>
        </form>

        {/* 수정요청 */}
        {!showRevisionForm ? (
          <button
            type="button"
            onClick={() => setShowRevisionForm(true)}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface"
          >
            수정요청
          </button>
        ) : (
          <form action={handleRevision} className="flex flex-col gap-2">
            <textarea
              name="reason"
              rows={3}
              required
              placeholder="수정이 필요한 부분을 적어주세요."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            {revisionError && (
              <p className="text-xs text-accent">{revisionError}</p>
            )}
            <div className="flex gap-2">
              <SubmitButton className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-yellow-600 disabled:opacity-50">
                수정 요청 전송
              </SubmitButton>
              <button
                type="button"
                onClick={() => {
                  setShowRevisionForm(false)
                  setRevisionError(null)
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 문제신고 */}
        <a
          href="https://pf.kakao.com/_placeholder"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-lg border border-accent/30 px-4 py-2.5 text-center text-sm text-accent transition-colors hover:bg-accent/5"
        >
          문제신고
        </a>
      </div>
    </div>
  )
}
