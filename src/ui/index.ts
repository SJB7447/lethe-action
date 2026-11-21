/**
 * [담당: Antigravity] UI 진입점. 레테 챕터 1(앰버 골드) 팔레트 HUD, 스테이지 오버레이, 도움말.
 * initUI(bus)의 이름과 인자만 유지하면 내부는 자유롭게 바꿔도 됩니다.
 * src/game을 import하지 말고 이벤트만 구독합니다.
 */
import type { EventBus } from '../core/events';
import './styles.css';

export function initUI(bus: EventBus): void {
  const root = document.getElementById('hud');
  if (!root) return;

  root.innerHTML = `
    <div class="hud-flash" id="hud-flash"></div>
    <header class="hud-top">
      <div class="hud-panel hp-panel" id="hud-hp-panel">
        <div class="panel-label">기억 안정도</div>
        <div class="hp" id="hud-hp"></div>
      </div>

      <div class="hud-panel gauge" id="hud-gauge-panel">
        <div class="gauge-head">
          <span class="panel-label">연결 게이지</span>
          <span class="gauge-status" id="hud-gauge-status">0%</span>
        </div>
        <div class="gauge-bar">
          <div class="gauge-fill" id="hud-gauge"></div>
          <div class="gauge-ticks"><i></i><i></i><i></i></div>
        </div>
      </div>

      <div class="hud-panel mode" id="hud-mode">
        <span class="mode-dot"></span>
        <span class="mode-label">록온</span>
        <strong class="mode-value" id="hud-mode-val">수동</strong>
      </div>
    </header>

    <div class="room-banner" id="hud-room">
      <div class="room-id" id="hud-room-id"></div>
      <div class="room-name" id="hud-room-name"></div>
    </div>

    <div class="checkpoint-toast" id="hud-checkpoint">
      <span class="cp-dot"></span>
      <span>CHECKPOINT // 기억 동기화 완료</span>
    </div>

    <div class="combo-wrap">
      <div class="combo" id="hud-combo"></div>
      <div class="perfect-pop" id="hud-perfect-pop">PERFECT</div>
      <div class="perfect-badge" id="hud-perfect-badge">PERFECT CHAIN · 전방위 록온</div>
    </div>

    <div class="dive-overlay" id="hud-dive">
      <div class="dive-lines"></div>
      <div class="dive-emblem">
        <div class="dive-sub">LINK PROTOCOL // SEO JIN-HYUK</div>
        <div class="dive-text">서진혁 연결<span>고스트 다이빙</span></div>
        <div class="dive-count" id="hud-dive-count"></div>
      </div>
    </div>

    <div class="death-overlay" id="hud-death">
      <div class="death-emblem">
        <div class="death-sub">MEMORY LINK SEVERED</div>
        <div class="death-title">기억 연결 끊김</div>
        <div class="death-hint">체크포인트에서 재구성 중...</div>
      </div>
    </div>

    <div class="clear-overlay" id="hud-clear">
      <div class="clear-card">
        <div class="clear-sub">CHAPTER 1 // STAGE CLEAR</div>
        <h2 class="clear-title">구간 돌파 완료</h2>
        <div class="clear-grid" id="hud-clear-stats"></div>
        <div class="clear-foot"><kbd>R</kbd> 처음부터 다시 시작</div>
      </div>
    </div>

    <aside class="help" id="hud-help">
      <div class="help-head">
        <span class="help-title">조작 안내</span>
        <span class="help-toggle"><kbd>H</kbd> 숨기기</span>
      </div>
      <div class="help-grid">
        <div><kbd>←→</kbd> <kbd>AD</kbd> 이동</div>
        <div><kbd>Space</kbd> <kbd>Z</kbd> 점프</div>
        <div><kbd>Shift</kbd> <kbd>X</kbd> 대시(무적)</div>
        <div><kbd>마우스</kbd> 시선</div>
        <div><kbd>J</kbd> <kbd>C</kbd> <kbd>좌클릭</kbd> 파고들기 / 바늘</div>
        <div><kbd>K</kbd> <kbd>V</kbd> <kbd>우클릭</kbd> 록온 (누르기)</div>
        <div><kbd>E</kbd> 고스트 다이빙</div>
        <div><kbd>T</kbd> 자동 보조</div>
        <div><kbd>R</kbd> 방 초기화 · <kbd>\`</kbd> 범위</div>
      </div>
      <div class="help-pad">패드: R스틱 시선 · A 점프 · B/RT 대시 · X 공격 · RB/LT 록온 · Y 다이빙 · Select 보조</div>
    </aside>

    <div class="help-hint hidden" id="hud-help-hint"><kbd>H</kbd> 조작 안내</div>
  `;

  const flash = byId('hud-flash');
  const hpPanel = byId('hud-hp-panel');
  const hp = byId('hud-hp');
  const gaugePanel = byId('hud-gauge-panel');
  const gauge = byId('hud-gauge');
  const gaugeStatus = byId('hud-gauge-status');
  const mode = byId('hud-mode');
  const modeVal = byId('hud-mode-val');
  const roomBanner = byId('hud-room');
  const roomIdEl = byId('hud-room-id');
  const roomNameEl = byId('hud-room-name');
  const checkpointToast = byId('hud-checkpoint');
  const combo = byId('hud-combo');
  const perfectPop = byId('hud-perfect-pop');
  const perfectBadge = byId('hud-perfect-badge');
  const dive = byId('hud-dive');
  const diveCount = byId('hud-dive-count');
  const deathOverlay = byId('hud-death');
  const clearOverlay = byId('hud-clear');
  const clearStats = byId('hud-clear-stats');
  const help = byId('hud-help');
  const helpHint = byId('hud-help-hint');

  let flashTimer = 0;
  let roomTimer = 0;
  let cpTimer = 0;
  let perfectPopTimer = 0;

  const triggerFlash = (kind: 'hurt' | 'impact' | 'respawn') => {
    flash.classList.remove('hurt', 'impact', 'respawn');
    void flash.offsetWidth;
    flash.classList.add(kind);
    window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => {
      flash.classList.remove('hurt', 'impact', 'respawn');
    }, 340);
  };

  bus.on('room:reset', () => {
    combo.classList.remove('show', 'high');
    perfectBadge.classList.remove('show');
    perfectPop.classList.remove('show');
    dive.classList.remove('show');
    diveCount.textContent = '';
    deathOverlay.classList.remove('show');
    clearOverlay.classList.remove('show');
  });

  bus.on('room:enter', ({ roomId, name }) => {
    roomIdEl.textContent = `AREA // ${roomId.toUpperCase()}`;
    roomNameEl.textContent = name;
    roomBanner.classList.remove('show');
    void roomBanner.offsetWidth;
    roomBanner.classList.add('show');
    window.clearTimeout(roomTimer);
    roomTimer = window.setTimeout(() => {
      roomBanner.classList.remove('show');
    }, 2200);
  });

  bus.on('checkpoint', () => {
    checkpointToast.classList.remove('show');
    void checkpointToast.offsetWidth;
    checkpointToast.classList.add('show');
    window.clearTimeout(cpTimer);
    cpTimer = window.setTimeout(() => {
      checkpointToast.classList.remove('show');
    }, 2100);
  });

  bus.on('player:death', () => {
    deathOverlay.classList.add('show');
  });

  bus.on('player:respawn', () => {
    deathOverlay.classList.remove('show');
    triggerFlash('respawn');
  });

  bus.on('stage:clear', ({ time, deaths, maxCombo, perfects, spotted }) => {
    clearStats.innerHTML = `
      <div class="stat-item"><span class="stat-label">클리어 시간</span><strong class="stat-val">${time.toFixed(1)}s</strong></div>
      <div class="stat-item"><span class="stat-label">최대 연쇄</span><strong class="stat-val amber">${maxCombo}</strong></div>
      <div class="stat-item"><span class="stat-label">퍼펙트</span><strong class="stat-val white">${perfects}</strong></div>
      <div class="stat-item"><span class="stat-label">발각</span><strong class="stat-val">${spotted}</strong></div>
      <div class="stat-item"><span class="stat-label">사망</span><strong class="stat-val">${deaths}</strong></div>
    `;
    clearOverlay.classList.add('show');
  });

  bus.on('player:hp', ({ hp: v, maxHp }) => {
    hp.innerHTML = Array.from({ length: maxHp }, (_, i) => {
      const on = i < v;
      return `<i class="hp-pip ${on ? 'on' : ''}"></i>`;
    }).join('');
  });

  bus.on('player:hurt', () => {
    triggerFlash('hurt');
    hpPanel.classList.remove('shake');
    void hpPanel.offsetWidth;
    hpPanel.classList.add('shake');
  });

  bus.on('strike:hit', ({ perfect }) => {
    if (!perfect) return;
    perfectPop.classList.remove('show');
    void perfectPop.offsetWidth;
    perfectPop.classList.add('show');
    window.clearTimeout(perfectPopTimer);
    perfectPopTimer = window.setTimeout(() => {
      perfectPop.classList.remove('show');
    }, 650);
  });

  bus.on('perfect:start', () => {
    perfectBadge.classList.add('show');
  });

  bus.on('perfect:end', () => {
    perfectBadge.classList.remove('show');
  });

  bus.on('gauge:change', ({ value, max }) => {
    const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    const pct = Math.round(ratio * 100);
    const full = value >= max;
    gauge.style.width = `${ratio * 100}%`;
    gaugePanel.classList.toggle('full', full);
    gaugeStatus.textContent = full ? 'READY [E]' : `${pct}%`;
  });

  bus.on('dive:ready', () => {
    gaugePanel.classList.remove('ready-ping');
    void gaugePanel.offsetWidth;
    gaugePanel.classList.add('ready-ping');
  });

  bus.on('mode:change', ({ assist }) => {
    modeVal.textContent = assist ? '자동 보조' : '수동';
    mode.classList.toggle('assist', assist);
  });

  bus.on('combo:change', ({ count }) => {
    if (count <= 0) {
      combo.classList.remove('show', 'high');
      return;
    }
    combo.innerHTML = `
      <span class="combo-num">${count}</span>
      <span class="combo-meta"><small>연쇄</small><b>CHAIN</b></span>
    `;
    combo.classList.add('show');
    combo.classList.toggle('high', count >= 3);
    combo.classList.remove('pop');
    void combo.offsetWidth;
    combo.classList.add('pop');
  });

  bus.on('dive:start', () => {
    diveCount.textContent = '';
    dive.classList.add('show');
  });

  bus.on('dive:impact', ({ count }) => {
    triggerFlash('impact');
    if (count > 0) {
      diveCount.textContent = `${count} MEMORY CLEAVED`;
    }
  });

  bus.on('dive:end', () => {
    dive.classList.remove('show');
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') {
      const hidden = help.classList.toggle('hidden');
      helpHint.classList.toggle('hidden', !hidden);
    }
  });
}

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 없음`);
  return el;
}
