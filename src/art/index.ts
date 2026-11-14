/**
 * [담당: Antigravity] 그래픽 진입점.
 * createArtPainter()의 이름과 반환 형식(ArtPainter)만 유지하면 내부는 자유롭게 바꿔도 됩니다.
 * 계약은 ./contract.ts, 규칙은 docs/ART_GUIDE.md.
 */
import type { ArtPainter } from './contract';
import { drawAlertsLayer } from './alerts';
import { drawPerceptionLayer } from './perception';
import { drawPlayerLayer } from './player';

export function createArtPainter(): ArtPainter {
  return {
    perception: drawPerceptionLayer,
    player: drawPlayerLayer,
    alerts: drawAlertsLayer,
  };
}
