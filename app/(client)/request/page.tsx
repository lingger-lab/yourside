import { signOut } from '@/lib/auth/actions'

export default function RequestPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <main className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-2xl font-bold text-primary">일 맡기기</h1>
        <p className="text-text-muted">
          사장님 의뢰 화면은 Phase 3에서 구현됩니다.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-border px-6 py-2 text-sm text-text-muted transition-colors hover:bg-surface"
          >
            로그아웃
          </button>
        </form>
      </main>
    </div>
  )
}
