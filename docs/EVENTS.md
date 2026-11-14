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
| `strike:hit` | `{ enemyId, chain }` | 파고들어 타격 성공 (히트스톱 시작 순간) |
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
| `room:reset` | `{}` | 방 초기화 |

피격 시 순서: `player:hurt` → `player:hp` (이어서 콤보가 있었다면 `combo:end` → `combo:change`)

새 이벤트가 필요하면 `docs/REQUESTS.md`에 적어 주세요.
