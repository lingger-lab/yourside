// 인앱 브라우저(WebView) 감지 및 외부 브라우저 탈출 유틸
//
// 구글 OAuth는 2021.09 이후 인앱 브라우저(WebView)를 보안상 차단한다
// (disallowed_useragent). 카카오톡 등 인앱 브라우저에서 구글 로그인을
// 누르면 막히므로, 시스템 기본 브라우저(크롬/사파리)로 내보낸다.

const IN_APP_UA_PATTERNS = [
  'kakaotalk',
  'kakaostory',
  'naver',        // 네이버 앱 인앱 브라우저
  'instagram',
  'fban',         // 페이스북
  'fbav',         // 페이스북
  'line',
  'daumapps',
  'everytimeapp',
] as const

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return IN_APP_UA_PATTERNS.some((pattern) => ua.includes(pattern))
}

// 인앱 브라우저에서 현재 페이지를 외부 브라우저로 다시 연다.
// 반환값: 자동 탈출을 시도했으면 true, iOS 비카카오 인앱처럼
//         자동 탈출이 불가능하면 false (호출 측에서 안내 필요).
export function escapeInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent.toLowerCase()
  const url = window.location.href

  // 카카오톡: 공식 스킴으로 iOS/안드로이드 모두 외부 브라우저 열기
  if (ua.includes('kakaotalk')) {
    window.location.href =
      'kakaotalk://web/openExternal?url=' + encodeURIComponent(url)
    return true
  }

  // 안드로이드 일반 인앱: 크롬 intent로 강제 실행
  if (ua.includes('android')) {
    const noScheme = url.replace(/^https?:\/\//, '')
    window.location.href =
      'intent://' + noScheme + '#Intent;scheme=https;package=com.android.chrome;end'
    return true
  }

  // iOS 기타 인앱: 자동 탈출 불가 → 호출 측에서 안내
  return false
}
