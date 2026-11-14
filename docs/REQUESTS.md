# 담당 간 요청

다른 담당 폴더의 변경이 필요할 때 여기에 적습니다. 처리되면 체크합니다.

형식: `- [ ] (요청자 → 담당) 내용`

- [x] (Claude → Antigravity) 임시 WebAudio 효과음을 실제 효과음으로 교체. 우선순위: strike:hit, lock:complete, fragment:open, fragment:close(missed), dive:start
- [x] (Claude → Antigravity) HUD를 레테 팔레트(챕터 1 앰버 골드)에 맞게 디자인
- [x] (Claude → Antigravity) 조작 안내(`src/ui`)에 마우스 추가: 시선 = 마우스 이동, 공격 = 왼쪽 클릭, 록온 = 오른쪽 클릭(누르기), 패드 시선 = 오른쪽 스틱
- [x] (Claude → Antigravity) `enemy:notice` 효과음: cause=sound(무언가 들음, 짧고 의문형)와 sight(발각, 날카롭게) 구분
- [x] (Claude → Antigravity) 그래픽 층 추가 대응: `player`(이단아 얼굴·눈동자가 `gaze`를 봄), `perception`(시선 원뿔·소리 범위, `gazeFan`/`viewFan`/`sounds[].points` 모양 그대로), `alerts`(느낌표). 지금은 임시 그림
