# 이벤트 계약 (게임 → 효과음·UI)

`src/core/events.ts`의 `GameEventMap`이 원본입니다. 이 문서와 항상 같이 갱신합니다.
효과음·UI는 `bus.on('이벤트', (payload) => …)`로만 게임 상태를 받습니다.

| 이벤트 | 내용 | 언제 |
|---|---|---|
| `player:jump` | `{ wall }` | 점프 (벽 점프면 wall=true) |
| `player:land` | `{ impact }` 0~1 | 빠르게 떨어지다 착지 |
| `player:dash` | `{ perfect }` | 대시 시작. perfect=회피 성공(록온 단축 보너스) |
| `player:hurt` | `{ hp, maxHp }` | 피격, 그리고 방 초기화 시 현재 체력 |
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
| `combo:change` | `{ count }` | 콤보 수 변경 (0이면 종료) |
| `combo:end` | `{ total }` | 콤보 끝, 최종 수 |
| `gauge:change` | `{ value, max }` | 연결 게이지 변경 |
| `dive:ready` | `{}` | 게이지가 가득 참 |
| `dive:start` | `{}` | 고스트 다이빙 시작 (서진혁 연결 연출) |
| `dive:impact` | `{ count }` | 다이빙 타격 순간, 쓰러뜨린 적 수 |
| `dive:end` | `{}` | 다이빙 연출 끝 |
| `mode:change` | `{ assist }` | 록온 수동/자동 보조 전환 |
| `room:reset` | `{}` | 방 초기화 |

새 이벤트가 필요하면 `docs/REQUESTS.md`에 적어 주세요.
