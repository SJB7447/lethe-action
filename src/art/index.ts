/**
 * [담당: Antigravity] 그래픽 진입점.
 * createArtPainter()의 이름과 반환 형식(ArtPainter)만 유지하면 내부는 자유롭게 바꿔도 됩니다.
 * 계약은 ./contract.ts, 규칙은 docs/ART_GUIDE.md.
 *
 * 지금은 아무 층도 구현하지 않아 모든 화면이 임시 사각형 그림으로 그려집니다.
 * 층 함수를 하나씩 추가하면 그 층만 새 그림으로 바뀝니다. 예:
 *
 *   return {
 *     fragments(g, view) {
 *       for (const e of view.enemies) { ... }
 *     },
 *   };
 */
import type { ArtPainter } from './contract';

export function createArtPainter(): ArtPainter {
  return {};
}
