import { signInWithGoogle } from '@/lib/auth/actions'
import { GoogleIcon } from '@/components/icons/google'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <main className="flex w-full max-w-md flex-col items-center gap-10 text-center">
        {/* 히어로 */}
        <section className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight text-primary">
            곁에
          </h1>
          <p className="text-lg leading-relaxed text-text-muted">
            부울경 시니어·청년의 경험을 검증해
            <br />
            지역 사장님과 직접 연결합니다.
          </p>
        </section>

        {/* 사장님 카드 */}
        <section className="flex w-full flex-col gap-4">
          <div className="rounded-2xl border border-border bg-white p-6 text-left">
            <h2 className="text-xl font-bold text-primary">사장님</h2>
            <p className="mt-1 text-sm text-text-muted">
              검증된 파트너에게 일을 맡기세요
            </p>
            <form action={signInWithGoogle.bind(null, 'client')} className="mt-4">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-light"
              >
                <GoogleIcon />
                Google로 시작하기
              </button>
            </form>
          </div>

          {/* 파트너 카드 */}
          <div className="rounded-2xl border border-border bg-white p-6 text-left">
            <h2 className="text-xl font-bold text-accent">파트너</h2>
            <p className="mt-1 text-sm text-text-muted">
              경험으로 일하고, 정당한 대가를 받으세요
            </p>
            <form action={signInWithGoogle.bind(null, 'partner')} className="mt-4">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary text-base font-semibold text-primary transition-colors hover:bg-surface"
              >
                <GoogleIcon />
                Google로 시작하기
              </button>
            </form>
          </div>
        </section>

        {/* 신뢰 근거 */}
        <section className="flex flex-col gap-2 text-sm text-text-muted">
          <p>곁에 3인 검토진이 직접 검증합니다</p>
          <p>사장님 작업료 0% 수수료 · 에스크로 안전결제</p>
          <p>파트너 작업료 100% 수령</p>
        </section>

        {/* 곁에 매니저 문의 */}
        <a
          href="#"
          className="text-sm font-medium text-accent underline underline-offset-4"
        >
          곁에 매니저에게 문의하기
        </a>
      </main>
    </div>
  )
}
