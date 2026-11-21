# 이벤트 계약 (게임 → 효과음·UI)

`src/core/events.ts`의 `GameEventMap`이 원본입니다. 이 문서와 항상 같이 갱신합니다.
효과음·UI는 `bus.on('이벤트', (payload) => …)`로만 게임 상태를 받습니다.

| 이벤트 | 내용 | 언제 |
|---|---|---|
| `player:jump` | `{ wall }` | 점프 (벽 점프면 wall=true) |
| `player:land` | `{ impact }` 0~1 | 빠르게 떨어지다 착지 |
| `player:dash` | `{ perfect }` | 대시 시작. perfect=회피 성공(록온 단축 보너스) |
| `player:hurt` | `{ hp, maxHp }` | **실제 피격에만** 발생. hp는 피해 직후 값(0일 수 있음). 피격음·플래시는 여기에 연결 |
| `player:hp` | `{ hp, maxHp }` | 체력 표시용. 방 초기화, 피격 후(실험실 자동 회복 포함) 현재 체력. 체력칸 갱신은 여기에 연결 |
| `needle:fire` | `{}` | 기억 추출 바늘 발사 |
| `needle:hit` | `{ enemyId, killed }` | 바늘 적중 |
| `lock:progress` | `{ enemyId, progress }` | 적에게 록온이 걸리기 시작 (progress=0) |
| `lock:complete` | `{ enemyId }` | 록온 완료 직후 |
| `fragment:open` | `{ enemyId, window, chained }` | 찢긴 기억 조각 열림. chained=연쇄로 자동 열림 |
| `fragment:close` | `{ enemyId, missed }` | 조각을 놓쳐 닫힘 (missed=true) |
| `strike:start` | `{ enemyId, chain }` | 조각으로 파고들기 시작 |
| `strike:hit` | `{ enemyId, chain, perfect }` | 파고들어 타격 성공 (히트스톱 시작 순간). perfect=조각이 열린 **뒤에 새로 누른** 공격이 퍼펙트 시간 안에 시작됨 (열리기 전 선입력은 일반 타격, 열리기 직전 `perfectMashGuard` 안에 헛공격이 있었으면 그 조각은 퍼펙트 불가, 직전 헛공격(파고들기로 이어지지 않은 입력)과의 간격이 `perfectMashGuard`보다 짧으면 연타로 보고 퍼펙트 아님. 방금 성공한 파고들기 입력은 연타로 치지 않음) |
| `perfect:start` | `{}` | 퍼펙트 연쇄 시작: 화면 안의 모든 적을 벽·시선과 상관없이 록온 가능 |
| `perfect:end` | `{}` | 퍼펙트 연쇄 끝 (연쇄·콤보가 끊김, 또는 방 초기화). `perfect:start` 뒤에는 반드시 한 번 옵니다 |
| `enemy:telegraph` | `{ enemyId, counter }` | 적 공격 예고. counter=조각 놓친 뒤 반격 |
| `enemy:down` | `{ enemyId }` | 적 쓰러짐 |
| `enemy:notice` | `{ enemyId, cause }` | 적이 알아챔. cause=`sound`(소리를 듣고 확인하러 옴, 앰버 느낌표) / `sight`(이단아를 봄·맞음·반격, 크림슨 느낌표). **알아챔 단계가 올라갈 때마다 한 번**: `idle → heard`는 sound, `idle·heard → alert`는 sight. 그래서 소리를 듣고 확인하러 왔다가 이단아를 보면 sound → sight 두 번 옵니다. 같은 단계 안(계속 보이는 동안, 확인 중 소리를 또 들음)에서는 다시 오지 않습니다 |
| `combo:change` | `{ count }` | 콤보 수 변경 (0이면 종료) |
| `combo:end` | `{ total }` | 콤보 끝, 최종 수 |
| `gauge:change` | `{ value, max }` | 연결 게이지 변경 |
| `dive:ready` | `{}` | 게이지가 가득 참 |
| `dive:start` | `{}` | 고스트 다이빙 시작 (서진혁 연결 연출) |
| `dive:impact` | `{ count }` | 다이빙 타격 순간, 쓰러뜨린 적 수 |
| `dive:end` | `{}` | 다이빙 연출 끝 |
| `mode:change` | `{ assist }` | 록온 수동/자동 보조 전환 |
| `room:reset` | `{}` | 처음부터 다시 (실험실: 방 초기화, 스테이지: 첫 방·기록 초기화) |
| `room:enter` | `{ roomId, name }` | 스테이지에서 방에 들어감 (처음 시작·출입구 이동·다시 시작 포함). 방 이름 표시용 |
| `checkpoint` | `{ id, roomId }` | 새 체크포인트에 닿음 (체력도 회복, 이어서 `player:hp`) |
| `player:death` | `{}` | 스테이지에서 체력 0. `deathRespawnDelay` 뒤 `player:respawn` |
| `player:respawn` | `{}` | 마지막 체크포인트에서 다시 시작 (쓰러뜨린 적은 모두 돌아옴, 게이지 유지) |
| `stage:clear` | `{ time, deaths, maxCombo, perfects, spotted }` | 스테이지 끝 도착. 정산 화면용 기록 (time은 게임 시간 s, spotted는 발각 횟수) |

피격 시 순서: `player:hurt` → `player:hp` (이어서 콤보가 있었다면 `combo:end` → `combo:change`)

새 이벤트가 필요하면 `docs/REQUESTS.md`에 적어 주세요.
