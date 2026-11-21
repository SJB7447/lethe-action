# 담당 간 요청

다른 담당 폴더의 변경이 필요할 때 여기에 적습니다. 처리되면 체크합니다.

형식: `- [ ] (요청자 → 담당) 내용`

- [x] (Claude → Antigravity) 임시 WebAudio 효과음을 실제 효과음으로 교체. 우선순위: strike:hit, lock:complete, fragment:open, fragment:close(missed), dive:start
- [x] (Claude → Antigravity) HUD를 레테 팔레트(챕터 1 앰버 골드)에 맞게 디자인
- [x] (Claude → Antigravity) 조작 안내(`src/ui`)에 마우스 추가: 시선 = 마우스 이동, 공격 = 왼쪽 클릭, 록온 = 오른쪽 클릭(누르기), 패드 시선 = 오른쪽 스틱
- [x] (Claude → Antigravity) `enemy:notice` 효과음: cause=sound(무언가 들음, 짧고 의문형)와 sight(발각, 날카롭게) 구분
- [x] (Claude → Antigravity) 그래픽 층 추가 대응: `player`(이단아 얼굴·눈동자가 `gaze`를 봄), `perception`(시선 원뿔·소리 범위, `gazeFan`/`viewFan`/`sounds[].points` 모양 그대로), `alerts`(느낌표). 지금은 임시 그림
- [x] (Claude → Antigravity) 퍼펙트: `fragments` 그림에 퍼펙트 시간(`EnemyView.perfectTimer > 0`) 표시 (PR #7 그림이 임시 그림의 흰 테두리를 덮으므로 필수). `strike:hit.perfect`, `perfect:start`/`perfect:end`에 "PERFECT" HUD 표시와 효과음
- [x] (Claude → Antigravity) PR #9 Codex 지적 ART9-1: 정식 소리 그림이 처음부터 실제 범위 외곽선을 그리도록 (퍼지는 물결은 장식으로 분리). ART9-2와 PR #7 ART-1: AI_LOG에 실제 모델명
- [x] (Claude → Antigravity) 스테이지 HUD: `room:enter` 방 이름 표시, `player:death`/`player:respawn` 사망·재시작 화면, `checkpoint` 알림, `stage:clear` 기록 화면(시간·최대 연쇄·퍼펙트·발각·사망). 지금은 LabScene의 임시 글자로 대신하고 있음 — HUD가 생기면 Claude가 임시 글자를 지움
- [x] (Claude → Antigravity) 스테이지 효과음: 체크포인트, 사망, 다시 시작, 방 이동
- [x] (Claude → Antigravity) 그림: `terrain` 층에서 `view.stage`의 출입구·체크포인트(`active`)·끝 지점 표시 (지금은 임시 그림)
- [x] (Claude → Antigravity) Codex H14-1: 끝 지점 기록 카드(stage:clear)가 조작 안내·튜닝 패널에 가려짐 → 카드가 위에 오게 (튜닝 패널 z-index 조정이 필요하면 이 파일에 요청)
- [x] (Claude → Antigravity) Codex H14-2: AI_LOG에 이번 HUD(방 배너·체크포인트·사망·기록·PERFECT) 기록 추가, 실제 사용 모델명 (추측 금지)
- [x] (Claude → Antigravity) 보스 HUD: `boss:start` 이름 배너, `boss:hp` 체력 막대(페이즈 2 경계 표시), `boss:down` 다운 알림, `boss:defeat` 격파 연출. 지금은 placeholderArt의 screen 층에 임시 체력 막대
- [x] (Claude → Antigravity) 보스 효과음: `boss:pattern`(파동·돌진 예고/실행 각각), `boss:weakpoint`, `boss:down`, `boss:recover`, `boss:phase`, `boss:defeat`
- [x] (Claude → Antigravity) 보스 그림: `view.boss`(몸·예고·파동 — 파동은 판정 두께 `bossWaveWidth` 그대로), `EnemyView.bossPart` 균열 소켓. 이름·외형은 기획자 확정 후. 지금은 enemies 층 임시 그림
