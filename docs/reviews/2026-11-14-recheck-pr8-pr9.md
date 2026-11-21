# PR #8 재검토 / PR #9 신규 리뷰 / PR #7·#9 충돌 확인

실제 검토일: **2026-11-16 (Asia/Seoul)**. 파일명은 요청한 `2026-11-14-recheck-pr8-pr9.md`를 유지한다. 검토자: Codex.

## 결론

- **PR #8: PER-1~6 해결 확인.** 최신 PR #8 단독 소스 기준이다.
- **PR #9: P2 1건, P3 1건. 수정 후 재검토 권고.** 정식 perception 렌더러가 PER-3의 표시/판정 불일치를 다시 일으킨다. 최신 PR #8의 fallback 수정만으로는 해결되지 않는다.
- **PR #7 + PR #9: `src/art/index.ts`, `docs/art/AI_LOG.md`에서 실제 충돌.** 해결 방법을 아래에 기록했으며 파일을 직접 수정하거나 병합하지 않았다.
- PR #8·#9 각각 타입 검사 및 production build 통과. 실제 브라우저 화면, 960×540 60fps, 실청취는 미검증이다.

## 대상과 기준

`git fetch origin` 실행 후 아래 커밋을 고정했다. 원본 작업 트리는 시작 시 깨끗했다. 이전 리뷰는 **PR #10 브랜치의 파일을 `git show`로 직접 읽었다.**

| 대상 | 원격 브랜치 | 커밋 |
|---|---|---|
| main | `origin/main` | `61868ab3489533b11c3d3ecb3b70cb562bf7338e` |
| PR #7 | `origin/antigravity/art-fragment` | `637953c35a40615f010d4b3e35bd0e9a507d12c9` |
| PR #8 | `origin/claude/gaze-perception` | `50e4386e68831f3719bd3349fc867d9d058aded8` |
| PR #9 | `origin/antigravity/gaze-perception-art-sfx` | `34989e01eda6835c317eac8004c6cc1191dd6d0f` |
| 이전 리뷰(PR #10) | `origin/codex/review-pr7-pr8` | `65aadbcea5577a295f14552829607ab2899fa3a9` |

기준: `AGENTS.md`, `docs/ROLES.md`의 Codex 항목, `docs/ART_GUIDE.md` 3·4·6장, 각 브랜치의 이벤트 계약. 아래 파일:줄은 해당 PR head 기준이다.

PR #9는 PR #8 최초 구현 커밋 `6b7755e` 위에 `34989e0`을 추가한 브랜치다. main 대비 diff에 나타나는 게임·입력·계약 변경 전부를 Antigravity의 담당 폴더 위반으로 취급하지 않았다. PR #9 고유 변경은 art/audio/ui, WAV 2개, REQUESTS, AI_LOG다. **PR #9 단독에는 PR #8의 후속 튜닝과 PER 수정이 아직 없다.** 최신 PR #8과 함께 통합해야 한다.

## 1. PR #8 — PER-1~6 재검토

| 항목 | 판정 | 변경과 실행 근거 |
|---|---|---|
| PER-1 경계 출발 레이 | 해결 | `src/game/perception.ts:22-45`: 진입/이탈 거리를 분리하고 `tExit <= EPS` 접촉을 제외한다. 벽 `(0,0,100,20)`, 표면 `(50,0)`에서 바깥 방향 거리 **130**, 안쪽 **0**, 평행 **130**. 모서리에서 바깥 방향도 **130**. 위쪽 80px 대상 LOS 및 점프 청각 판정 모두 **true** |
| PER-2 다각형/청각 불일치 | 해결 | `src/game/perception.ts:104-120`, `src/game/sim.ts:954-960`: `hears(shape,tx,ty)`가 표시용으로 생성한 동일 다각형을 사용한다. 소리 형태는 96개 레이. 기존 모서리 벽 사례의 격자 19,881점에서 독립 point-in-polygon 검사와 불일치 **0건** |
| PER-3 성장 표시 | 해결(PR #8 단독) | `src/scenes/placeholderArt.ts:46-57`: 실제 범위 외곽선을 처음부터 유지하고 안쪽 파동만 별도로 축소한다. 반경 100, 수명 0.6초, 발생 0.05초 뒤 Graphics 명령의 최대 반경 **100px**. 80px 대상도 들음. **PR #9의 정식 렌더러에는 이 수정이 없다(ART9-1)** |
| PER-4 이벤트 계약 | 해결 | `docs/EVENTS.md:23`을 `idle→heard`는 sound, `idle/heard→alert`는 sight, 같은 단계에서는 반복하지 않는 계약으로 명확히 바꿨다. 실제 Sim에 소리 두 번, 시야 관측 두 번을 넣어 이벤트가 **sound 1회 + sight 1회**인 것을 확인. 시야 상실 후 alert→heard→idle도 확인 |
| PER-5 방향 전환 록온 | 해결 | `src/game/sim.ts:253-257`: fixed step에서 updatePlayer 전후 updateGaze 호출. 키보드 왼쪽 전환, 오른쪽 적 배치 시 `frame(1/120)`, `frame(1/60)`, `frame(1/30)` 모두 **facing=-1, gaze=π, 오른쪽 적 lockProgress=0** |
| PER-6 AI_LOG 누락 | 해결 | `docs/art/AI_LOG.md:8`에 placeholderArt의 얼굴·눈동자·시선·소리·느낌표, 도구/모델, 기획자 요구와 Claude 제안을 구분해 기록 |

PER-2는 정확한 연속 레이 영역과 그림을 맞춘 것이 아니라 **다각형을 실제 판정 기준으로 채택**한 해결이다. 따라서 레이 표본 사이의 근사 오차는 물리 모델에도 반영되지만 이전의 '표시와 hears가 서로 다르다'는 문제는 해소됐다. 다각형 경계선의 stroke 두께까지 청각 판정에 포함하는 것은 아니다.

재검토 범위에서 기존 PER 지적을 미해결로 남길 증거는 발견하지 못했다. 이 결론은 PR #9와 결합한 정식 그림의 동작까지 승인한다는 뜻은 아니다.

## 2. PR #9 — 신규 발견 사항

### ART9-1 · P2 — 정식 소리 그림이 PER-3을 재도입한다

- 위치: **`src/art/perception.ts:15-22`**. 연결 지점: **`src/art/index.ts:13`**.
- `sounds[].points`는 발생 즉시 적용되는 청각 판정 범위인데, 정식 렌더러는 `grow=min(1,age/0.25)`로 모든 점을 중심 방향으로 축소한다. 실제 경계를 그리는 별도 외곽선이 없다. ART_GUIDE 3장의 범위 형태 보존 및 계약의 '보이는 범위 = 들리는 범위'를 위반한다.
- 재현: **최신 PR #8이 생성한 96점 shape**를 PR #9의 `drawPerceptionLayer`에 전달했다. 반경 100, 수명 0.6초, 발생 후 0.05초에서 그려지는 최대 반경은 **33.33px**, 80px 대상의 최신 `hears(shape,80,0)`는 **true**였다. 동일 입력을 최신 fallback에 넣으면 100px이다. 생명주기 처음 25%(기본값 0.15초) 동안 불일치한다.
- `showArt=true`에서는 LabScene이 등록된 custom perception을 호출하고 fallback을 건너뛰므로, PR #8의 placeholder 수정이 있어도 기본 정식 그림에서 문제가 남는다. `?art=0`과 정식 그림 사이에서 판정 안내가 달라진다.
- 권고: 실제 shape의 외곽선을 처음부터 그대로 그리고 성장 파동은 별도 장식으로 분리한다. 수정 후 `?art=0/1` 양쪽에서 동일 범위인지 확인한다. 이번 리뷰에서는 수정하지 않았다.

### ART9-2 · P3 — AI_LOG에서 생성 모델을 식별할 수 없다

- 위치: **`docs/art/AI_LOG.md:8`**.
- player/perception/alerts/palette의 생성 내용과 사람이 정한 규칙은 있지만 `도구·모델` 칸이 `Antigravity`뿐이다. ART_GUIDE 6장의 생성 이력에서 실제 사용 모델을 확인할 수 없다. 이전 PR #7의 ART-1과 같은 종류의 기록 누락이다.
- 권고: 실제 사용한 모델을 확인해 기입한다. ROLES의 역할 설명만 보고 실제 사용 모델을 추정해 채우면 안 된다.

### 그 외 점검 결과

| 기준 | 확인 결과 |
|---|---|
| 판정/그림 분리 | art 함수는 계약 타입과 팔레트만 import하고 위치·속도·상태를 쓰지 않는다. 실제 크기 22×40을 바꾸지 않는다. 몸체/후드/코트는 판정 박스를 기준으로 그리며 공격처럼 보이는 외부 무기를 새로 추가하지 않는다. 회피 오라는 시각 표시다 |
| 상태 불변/히트스톱 | frozen view로 player/perception/alerts를 실행해 쓰기 오류 없음. 같은 time/상태로 재호출하면 명령 동일. player blink는 view.time, 소리와 느낌표는 게임의 life/markTimer를 읽으며 실시간 시계나 프레임별 누적 상태 없음 |
| 읽기 순서 | 기존 계약의 perception→enemies→player→particles→alerts→fragments→screen, debug=1000 유지. 원뿔은 낮은 alpha, 경고는 amber/crimson 및 sight 추가 스파이크로 구별. 조각 층 등록은 PR #7과 충돌 해결 시 보존해야 함. 실제 전투 화면 가독성은 미검증 |
| 성능 예산 | 신규 파티클/전체 화면 셰이더 없음. perception 비용은 소리 점 수와 적 수에 비례. 테스트 입력(소리 96점 1개/적 원뿔 1개)에서 perception Graphics 호출 111회, player 21회, alerts 16회. 이는 60fps 측정이 아님 |
| dt/튜닝값 | 자체 프레임 누적 없음. 고정 수치는 그림 크기·alpha·연출 및 SFX 음량이며 전투 판정 튜닝을 변경하지 않는다 |
| 이벤트/SFX | `src/audio/index.ts:72-76`은 bus의 cause만 읽는다. 실제 handler 호출 시 sound→notice_sound(0.52), sight→notice_sight(0.72). SFX_KEYS와 파일명 일치, 기존 preload/decode 경로에 포함됨. 게임 상태 직접 import 없음 |
| WAV 유효성 | 두 파일 모두 읽기 가능한 mono 44.1kHz WAV. notice_sound 약 0.132초, notice_sight 0.160초. 음질·청감은 판단하지 않음 |
| 입력 안내 | `src/ui/index.ts:59-66`: 마우스 이동/좌클릭/우클릭/오른쪽 스틱 안내가 실제 Input 구현과 맞음. UI에서 게임 모듈을 직접 import하지 않음 |
| 담당 경로 | PR #9 고유 커밋은 담당 art/audio/ui 및 에셋·요청/기록 문서에 한정됨. 상속된 Claude 커밋을 역할 위반으로 중복 계산하지 않음 |

## 3. PR #7 + PR #9 병합 충돌

`git merge-tree --write-tree origin/antigravity/art-fragment origin/antigravity/gaze-perception-art-sfx`에서 다음 두 경로의 content conflict를 확인했다. 결과 tree `11046fb8c726aac3902e5db0c5cf41a57eb8f5d9`는 충돌 표식이 포함된 분석용 결과이며 완료된 병합이 아니다.

### MERGE-1 · P2 — index 충돌을 한쪽 선택으로 해결하면 다른 그림 등록이 사라진다

- 위치: **PR #7 `src/art/index.ts:7-11`**, **PR #9 `src/art/index.ts:7-16`**.
- PR #7은 drawFragmentsLayer import/등록, PR #9는 drawPerceptionLayer/drawPlayerLayer/drawAlertsLayer import/등록을 같은 위치에 추가했다.
- PR #7 쪽만 남기면 새 player/perception/alerts는 fallback으로 돌아간다. PR #9 쪽만 남기면 PR #7의 fragments가 fallback으로 돌아간다. 파일이 존재하는 것만으로 렌더러가 호출되지는 않는다.
- 해결 기준: 네 함수의 import를 모두 유지하고 반환 객체에 **fragments, perception, player, alerts**를 모두 등록한다. 동일 팔레트 파일은 양쪽 blob이 같아 추가 충돌이 없었다.
- 이 항목은 독립 PR의 실행 버그가 아니라 **현재 확인된 병합 차단 요인과 잘못된 해결의 영향**이다. 실제 해결은 하지 않았다.

### MERGE-2 · P3 — AI_LOG 충돌에서 두 생성 기록을 모두 보존해야 한다

- 위치: **PR #7 `docs/art/AI_LOG.md:8`**, **PR #9 `docs/art/AI_LOG.md:8`**.
- 같은 표 끝에 서로 다른 행을 추가해 충돌한다. 한쪽만 선택하면 조각 또는 player/perception/alerts 생성 기록이 유실된다.
- 해결 기준: 표 머리말은 한 번만, 두 행은 각각 보존한다. 두 행의 모델명 누락도 별도 보완한다. 같은 palette 파일을 언급한다는 이유로 서로 다른 생성 작업을 한쪽 행으로 대체하면 안 된다.

### 최신 PR #8을 함께 넣는 경우

- 최신 #8과 #9만 merge-tree 해도 **`docs/art/AI_LOG.md`가 추가로 충돌**한다(분석 tree `ec831f0d7b10ffd9244b7a2bfecf0b726552152c`). #8의 placeholder 생성 이력도 유지해야 하므로 #7·#8·#9 전체 통합 시에는 서로 다른 **세 기록 행**이 필요하다.
- 최신 #8의 수정과 #9의 art 파일은 소리 관련 코드가 서로 다른 경로에 있어 자동 병합 충돌로 ART9-1을 알려 주지 않는다. AI_LOG 충돌을 해결해 빌드가 성공하더라도 정식 perception의 축소 표시 문제는 남는다.
- PR #9 자체는 최초 시선 구현에 기반하므로 #7+#9만 합쳐서는 PER 수정이 들어오지 않는다. 최신 #8의 판정·시선 갱신·이벤트 문서 수정까지 통합해야 한다.
- 사용자 요청에 따라 충돌을 실제로 해결하거나 가상의 해결본 코드를 작성하지 않았다. **충돌 해결 후 통합 빌드는 미실행**이며 통합 통과를 주장하지 않는다.

## 4. 실행 검증과 남은 한계

- PR #8, PR #9 각각 추출한 사본에서 `npm.cmd run build`(tsc --noEmit + vite build) 통과. 두 빌드 모두 500kB 초과 chunk 경고가 있으나 실패는 아니다.
- 추출한 원본 TypeScript를 Node 24의 stripTypeScriptTypes로 실행했다. 알고리즘을 다른 구현으로 바꿔 검사하지 않았다. 점-다각형 비교용 독립 함수와 Graphics 명령 기록 객체, 오디오 라우팅용 mock만 테스트 하네스에 사용했다.
- PR #8 Sim의 실제 `frame()`을 120/60/30Hz 입력으로 호출했다. PR #9 정식 렌더러에는 최신 #8이 만든 소리 shape를 직접 전달해 교차 호환 시 문제도 재현했다.
- 실제 브라우저 `?art=0/1` 플레이, 픽셀 가독성, GPU 프레임 시간, 실제 오디오 청취는 하지 않았다. 기록 객체 기반 검사를 이러한 검증으로 간주하지 않는다.
- 보조 재현 파일: `C:/Users/우야야/Documents/Codex/2026-09-08/realtime-voice-chat-3/work/recheck-pr8-pr9/check.mjs`. 해당 workspace에서 `node work/recheck-pr8-pr9/check.mjs`로 실행할 수 있다. 게임 저장소에는 보조 파일을 추가하지 않았다.

**저장소 작업 결과:** 지정한 리뷰 Markdown만 작업 폴더에 작성. 게임 코드 수정, 실제 브랜치 병합, 커밋, push, GitHub 코멘트 게시 없음.
