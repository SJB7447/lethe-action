# 역할 분담

## Claude Code (Opus) — 메인 구현
- 게임 구조 전체, 조작·전투·적·록온 연쇄, 튜닝 시스템, 빌드와 배포.
- `src/core`, `src/game`, `src/scenes`, `src/debug`, 빌드 설정.
- 이벤트 목록(`src/core/events.ts`, `docs/EVENTS.md`)의 관리자.

## Antigravity — 효과음과 UI
- `src/audio/`: 이벤트를 받아 효과음을 재생. 지금은 WebAudio로 만든 임시음.
  실제 효과음 파일은 `public/assets/audio/`에 넣고 `src/audio/sfx.ts`에서 교체.
- `src/ui/`: HUD(연결 게이지, 콤보, 체력), 고스트 다이빙 연출 오버레이, 도움말, 이후 메뉴.
- 진입점: `src/audio/index.ts`의 `initAudio(bus)`, `src/ui/index.ts`의 `initUI(bus)`.
  이 두 함수의 이름과 인자만 유지하면 내부는 자유롭게 바꿔도 됩니다.
- 게임 코드가 필요한 정보를 주지 않으면 `docs/REQUESTS.md`에 이벤트 추가를 요청합니다.

## Codex — 코드 리뷰와 점검
- 모든 PR을 리뷰합니다. 기준: 버그, 프레임 의존 코드(dt 누락), 하드코딩된 튜닝값,
  담당 폴더 규칙 위반, 이벤트 계약 위반.
- 리뷰 결과는 PR 코멘트 또는 `docs/reviews/YYYY-MM-DD-주제.md`.
- 직접 수정이 필요하면 `codex/…` 브랜치로 별도 PR을 엽니다. `main`에 직접 커밋하지 않습니다.

## 사람(기획자) — 손맛 판단
- 직접 플레이하고 튜닝 패널로 수치를 조정합니다.
- 마음에 드는 값은 패널의 "JSON 복사"로 뽑아 이슈나 `docs/presets/`에 남깁니다.
- 1단계 통과 여부를 판정합니다(`docs/STAGE1.md`).
