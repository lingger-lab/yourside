export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          곁에
        </h1>
        <p className="text-lg text-text-muted">
          부울경 시니어·청년의 경험을 검증해
          <br />
          지역 사장님과 직접 연결합니다.
        </p>

        <div className="flex w-full flex-col gap-4">
          <a
            href="/request"
            className="flex h-14 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-white transition-colors hover:bg-primary-light"
          >
            사장님 — 일 맡기기
          </a>
          <a
            href="/register"
            className="flex h-14 items-center justify-center rounded-xl border-2 border-primary text-lg font-semibold text-primary transition-colors hover:bg-surface"
          >
            파트너 — 경험으로 일하기
          </a>
        </div>

        <div className="flex flex-col gap-2 text-sm text-text-muted">
          <p>사장님 작업료 0% 수수료 · 에스크로 안전결제</p>
          <p>곁에 3인 검토진이 직접 검증합니다</p>
        </div>
      </main>
    </div>
  );
}
