# AI 생성 기록

화면에 보이는 그림을 AI로 만들거나 크게 바꿀 때마다 한 줄씩 추가합니다.
스팀 AI 공개 표시와 저작권 판단의 근거가 됩니다. 규칙은 `docs/ART_GUIDE.md` 6장.

| 날짜 | 파일 | 도구·모델 | 무엇을 만들었나 | 사람이 정한 것 / 고친 것 |
|---|---|---|---|---|
| 2026-11-14 | src/scenes/placeholderArt.ts (임시 그림) | Claude Code + Claude Opus 5.5 | 이단아 얼굴(눈동자가 시선 방향), 적 눈, 이단아·적 시선 원뿔, 벽에서 잘리는 소리 범위, 소리/발각 느낌표 | 기획자: 이단아 시점 록온과 마우스 시선, 적 시선 범위, 소리 판정 느낌표, 소리 범위를 요구. "벽이 소리를 막음", "시선 안 + 록온 버튼" 방식을 선택. 느낌표 색 구분(소리 amber / 발각 crimson)은 Claude 제안 |
| 2026-11-16 | src/scenes/hitFx.ts, src/scenes/placeholderArt.ts | Claude Code + Claude Opus 5.5 | 타격 화면 효과(확대·카메라 밀림·번쩍임·집중선·파고들기 터널·놓침/록온 가장자리), 퍼펙트 시간 흰 테두리, 퍼펙트 연쇄 가장자리 흰빛 | 기획자: 록온·공격 타격감 화면 효과, 퍼펙트 록온 시스템(퍼펙트 성공 시 화면 안 모든 적 장애물 무관 록온) 요구. 효과 종류·연쇄 증가·색은 Claude 제안 |
| 2026-11-20 | src/art/palette.ts, src/art/fragments.ts | Antigravity + Gemini | 레테 팔레트 상수 및 fragments 층(록온 수축·균열선·찢긴 기억 조각·퍼펙트 수축 테두리·남은 시간 링) 그리기 코드 | 기획자/지침서: 2·3·4장 팔레트·시각 언어·히트스톱(`view.time`) 규칙 및 퍼펙트 판정(`perfectTimer`) 강조 요구 |
| 2026-11-20 | src/art/player.ts, src/art/perception.ts, src/art/alerts.ts | Antigravity + Gemini | 이단아 실루엣·시선 추적 눈동자(player), 시선 원뿔·실제 판정 소리 외곽선+장식 파동(perception), 각진 느낌표(alerts) 그리기 코드 | 기획자/리뷰: 판정 박스 내 실루엣, `gaze`/`viewFan`/`sounds[].points` 일치, ART9-1 소리 외곽선 즉시 표시 규칙 지정 |
| 2026-11-20 | src/art/terrain.ts | Antigravity + Gemini | 발판·벽(저명도 건축 톤), 출입구 앰버 문틀, 체크포인트 마름모 비콘(`active` 구분), 스테이지 끝 게이트 그리기 코드 | 기획자/지침서: 배경·지형 저명도 규칙(3장) 및 `view.stage` 출입구·체크포인트·끝 지점 구분 표시 요구 |
