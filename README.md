# 👑 뽈이 비서실

보람 님 전용 클레이 3D 비서실 웹페이지.

- **오피스 맵** — 클레이 미니어처 사무실 위의 방 핀(대회의실 · 지휘실 · 라운지)을 눌러 방별 안내를 봅니다.
- **작업실** — 체험단·리뷰 / 뽈로그·스레드·릴스 / 핫딜헌터·응모 / 일상·루틴 보드. 할 일 추가·완료 체크·삭제. 한 기기에서 고치면 다른 피클·기기 화면에 바로 반영됩니다.
- **비서현황** — 오늘 할 일 통계, 함께 있는 비서(🐰 미니 · 🌊 바다 — 쿠파스 링크 → 릴스 제작·대본·인포크링크 등록), 매일 도는 루틴.
- **회의실** — @멘션 버튼(@미니 · @바다 · @뽈이 · @피클들 · @전체)과 안건 보드.
- **메모** — 붙여 두는 메모.

데이터는 **Firebase Realtime Database**에 실시간으로 저장되고, 연결이 끊기면 브라우저 `localStorage`(`bbori-office-v1`)에 먼저 쌓아 두었다가 다시 올립니다.

## Firebase 연결 정보

| 항목 | 값 |
| --- | --- |
| 프로젝트 | `bbore-office` (Spark 무료 요금제, Google Analytics/Gemini 미사용) |
| Realtime Database | `https://bbore-office-default-rtdb.firebaseio.com` (us-central1) |
| 데이터 경로 | `bbori-office` (할 일·안건·메모·테마가 한 문서) |
| 웹 앱 ID | `1:230117918413:web:cac0f33b322637f49c0b84` |
| 설정 위치 | `assets/app.js` 맨 위 `FIREBASE_CONFIG` (공개 웹 앱 설정 — 비밀값 아님) |

적용 중인 규칙(Realtime Database → 규칙):

```json
{
  "rules": {
    "bbori-office": {
      ".read": true,
      ".write": true
    }
  }
}
```

이 페이지는 로그인 없는 공개 GitHub Pages이고 위 경로를 인증 없이 열어 두었으므로, URL을 아는 사람은 이 목록을 읽고 쓸 수 있습니다. 잠그려면 Firebase Authentication(익명 로그인)과 규칙 `auth != null`로 바꾸고 페이지에 로그인 코드를 넣어야 합니다.

## 구조

```
index.html            단일 페이지
assets/style.css      크림·우드 톤 스타일 (라이트/밤 테마)
assets/app.js         상태·렌더·이벤트, Firebase 실시간 어댑터
assets/clay-office.jpg  클레이 3D 오피스 이미지 (1402×1122)
```

## 로컬에서 열기

`index.html`을 브라우저로 열면 됩니다. 별도 빌드 없음.

## 배포

GitHub Pages — branch `main`, root `/`.
