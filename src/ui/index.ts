/**
 * [담당: Antigravity] UI 진입점. HUD, 오버레이, 도움말.
 * initUI(bus)의 이름과 인자만 유지하면 내부는 자유롭게 바꿔도 됩니다.
 * src/game을 import하지 말고 이벤트만 구독합니다.
 */
import type { EventBus } from '../core/events';
import './styles.css';

export function initUI(bus: EventBus): void {
  const root = document.getElementById('hud');
  if (!root) return;
  root.innerHTML = `
    <div class="hud-top">
      <div class="hp" id="hud-hp"></div>
      <div class="gauge"><div class="gauge-label">연결 게이지</div><div class="gauge-bar"><div class="gauge-fill" id="hud-gauge"></div></div></div>
      <div class="mode" id="hud-mode">록온: 수동</div>
    </div>
    <div class="combo" id="hud-combo"></div>
    <div class="dive-overlay" id="hud-dive"><div class="dive-text">서진혁 연결<span>고스트 다이빙</span></div></div>
    <div class="help" id="hud-help">
      <b>조작</b> (H: 도움말 끄기/켜기)<br>
      이동 ←→/AD · 점프 Space/Z · 대시(무적) Shift/X<br>
      공격 J/C — 조각이 열려 있으면 파고들기, 아니면 기억 추출 바늘<br>
      록온 K/V 누르고 있기 · 고스트 다이빙 E (게이지 가득)<br>
      자동 보조 T · 방 초기화 R · 범위 표시 \`<br>
      패드: A 점프 · B/RT 대시 · X 공격 · RB/LT 록온 · Y 다이빙 · Select 보조
    </div>`;

  const hp = byId('hud-hp');
  const gauge = byId('hud-gauge');
  const mode = byId('hud-mode');
  const combo = byId('hud-combo');
  const dive = byId('hud-dive');
  const help = byId('hud-help');

  bus.on('player:hurt', ({ hp: v, maxHp }) => {
    hp.innerHTML = Array.from({ length: maxHp }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('');
  });
  bus.on('gauge:change', ({ value, max }) => {
    gauge.style.width = `${(value / max) * 100}%`;
    gauge.classList.toggle('full', value >= max);
  });
  bus.on('mode:change', ({ assist }) => {
    mode.textContent = `록온: ${assist ? '자동 보조' : '수동'}`;
  });
  bus.on('combo:change', ({ count }) => {
    if (count <= 0) {
      combo.classList.remove('show');
      return;
    }
    combo.innerHTML = `${count}<small>연쇄</small>`;
    combo.classList.add('show');
    combo.classList.remove('pop');
    void combo.offsetWidth;
    combo.classList.add('pop');
  });
  bus.on('dive:start', () => dive.classList.add('show'));
  bus.on('dive:end', () => dive.classList.remove('show'));
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') help.classList.toggle('hidden');
  });
}

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 없음`);
  return el;
}
