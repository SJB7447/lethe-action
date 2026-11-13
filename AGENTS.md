# AGENTS.md — 모든 AI 도구 공통 규칙

이 저장소는 **레테(LETHE) 2D 액션 게임**(가제)의 1단계 "조작감 실험실"입니다.
Claude Code, Antigravity, Codex 세 도구가 함께 작업합니다. 작업 전에 이 파일과
`docs/ROLES.md`, `docs/EVENTS.md`를 반드시 읽으세요.

## 프로젝트 한 줄 요약
이단아가 적의 "찢긴 기억"을 록온해 연쇄로 파고들며 쓰러뜨리고, 연결 게이지가 차면
서진혁의 연결로 "고스트 다이빙" 필살기를 쓰는 2D 액션. 지금 목표는 **손맛 검증**입니다.

## 기술 스택
- TypeScript + Vite + Phaser 4 (렌더링·게임 루프만 사용, 물리는 자체 구현)
- Tweakpane 4 (튜닝 슬라이더)
- 실행: `npm install` → `npm run dev` / 검사: `npm run build`

## 폴더와 담당 (자세한 내용은 docs/ROLES.md)
| 경로 | 담당 | 내용 |
|---|---|---|
| `src/core/` | Claude Code | 이벤트 버스, 튜닝값, 입력 |
| `src/game/` | Claude Code | 물리, 플레이어, 적, 록온·연쇄 |
| `src/scenes/` | Claude Code | 씬, 렌더링 |
| `src/debug/` | Claude Code | 튜닝 패널 |
| `src/audio/` | **Antigravity** | 효과음 |
| `src/ui/` | **Antigravity** | HUD, 메뉴, 오버레이, CSS |
| `public/assets/audio/`, `public/assets/ui/` | **Antigravity** | 사운드·UI 에셋 |
| 리뷰 | **Codex** | PR 리뷰, `docs/reviews/` |

## 절대 규칙
1. **담당 폴더 밖의 파일은 고치지 않습니다.** 필요하면 `docs/REQUESTS.md`에 요청을 적습니다.
2. 게임 로직과 효과음·UI는 **이벤트로만 연결**합니다. `src/audio`, `src/ui`는
   `src/game`을 import하지 않고 `src/core/events.ts`의 이벤트만 구독합니다.
3. 새 이벤트가 필요하면 Claude Code가 `src/core/events.ts`와 `docs/EVENTS.md`를 함께 갱신합니다.
4. 충돌 판정(히트박스)과 그림은 분리합니다. 그림을 바꿔도 판정 크기는 바뀌면 안 됩니다.
5. 손맛에 관련된 숫자는 코드에 직접 쓰지 말고 `src/core/tuning.ts`에 둡니다.
6. `main`에 직접 커밋하지 않습니다. 브랜치 → PR → 리뷰 → 병합.
   - 브랜치 이름: `claude/…`, `antigravity/…`, `codex/…`
7. PR을 열기 전에 `npm run build`가 통과해야 합니다.

## 코드 스타일
- TypeScript strict. `any` 금지.
- 주석과 문서는 한국어, 식별자는 영어.
- 시간 단위는 초(s), 거리 단위는 픽셀(px).
