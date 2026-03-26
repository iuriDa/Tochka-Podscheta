/* ══════════════════════════════════════════
   Судья скакалки · app.js
   Данильченко Юрий · Точка Отрыва
   ══════════════════════════════════════════ */

// ── Тёмная тема ──────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = themeToggle.querySelector('.theme-icon');
let currentTheme  = localStorage.getItem('theme') || 'light';
applyTheme(currentTheme);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☾' : '☀';
  currentTheme = theme;
  localStorage.setItem('theme', theme);
  // Обновляем meta theme-color для PWA
  const metaTheme = document.getElementById('meta-theme');
  if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#0f0f0e' : '#111110');
}
themeToggle.addEventListener('click', () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark'));

// ── Подтверждение сброса ─────────────────────
function withConfirm(btn, callback) {
  let pending = false;
  let timer   = null;

  function reset() {
    pending = false;
    btn.classList.remove('confirming');
    btn.textContent = btn.dataset.origLabel;
  }

  btn.dataset.origLabel = btn.innerHTML;

  btn.addEventListener('click', () => {
    if (!pending) {
      pending = true;
      btn.classList.add('confirming');
      btn.textContent = 'Точно?';
      clearTimeout(timer);
      timer = setTimeout(reset, 3000);
    } else {
      clearTimeout(timer);
      reset();
      callback();
    }
  });

  btn.addEventListener('blur', () => { clearTimeout(timer); reset(); });
}

// ── double-tap zoom prevention ────────────────
let lastTouch = 0;
window.addEventListener('touchend', (e) => {
  const now = Date.now();
  const safe = e.target.closest('.grid-complexity,.btn-zero,.criteria-list,.actions-row,.top-tabs,.disc-tabs,.tri-controls,.penalty-block,.pm-controls');
  if (safe) { lastTouch = now; return; }
  if (now - lastTouch <= 300) e.preventDefault();
  lastTouch = now;
}, { passive: false });

// ══════════════════════════════════════════════
// ГЛАВНЫЕ ВКЛАДКИ
// ══════════════════════════════════════════════
const tabBtns = document.querySelectorAll('.tab-btn');
const panels  = {
  complexity:   document.getElementById('tab-complexity'),
  presentation: document.getElementById('tab-presentation'),
  technical:    document.getElementById('tab-technical'),
  about:        document.getElementById('tab-about'),
};
const displayEl = document.getElementById('display');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    const id = btn.dataset.tab;
    Object.values(panels).forEach(p => p.classList.remove('active'));
    panels[id].classList.add('active');
    updateDisplay(id);
    document.querySelector('.content').scrollTo({ top:0, behavior:'smooth' });
  });
});

// ══════════════════════════════════════════════
// СЛОЖНОСТЬ
// ══════════════════════════════════════════════
const seq = [];
const LV_COLORS = { 0:'#94a3b8',1:'#22c55e',2:'#84cc16',3:'#eab308',4:'#f97316',5:'#ef4444',6:'#a855f7' };
const statsBox = document.getElementById('complexity-stats');
const toggleStatsBtn = document.getElementById('toggle-stats');

function renderComplexityDisplay() {
  const total = seq.reduce((a,b)=>a+b,0);
  const avg   = seq.length ? (total/seq.length).toFixed(2) : '—';
  const avgColor = seq.length ? LV_COLORS[Math.round(total/seq.length)] : 'var(--text)';
  const chips = seq.map(v=>`<span class="chip chip-${v}">${v}</span>`).join('');
  displayEl.innerHTML = `
    <div class="score-label">Сложность</div>
    <div class="score-row">
      <div class="score-big" style="color:${avgColor}">${avg}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--muted)">${seq.length} эл.; сч. ${total}</div>
    </div>
    <div class="seq-chips">${chips || '<span style="color:var(--muted);font-size:13px">Нажимайте на уровни навыков</span>'}</div>`;
}

function renderComplexityStats() {
  const total = seq.reduce((a,b)=>a+b,0);
  document.getElementById('skills-seq').innerHTML =
    seq.map(v=>`<span class="chip chip-${v}" style="display:inline-flex">${v}</span>`).join(' ');
  document.getElementById('skills-sum').textContent    = total;
  document.getElementById('skills-amount').textContent = seq.length;
  document.getElementById('skills-coef').textContent   = seq.length ? (total/seq.length).toFixed(2) : '0.00';
  const names = {0:'Пропуск',1:'Базовый',2:'Лёгкий',3:'Средний',4:'Сложный',5:'Мастер',6:'Элита'};
  document.getElementById('skills-counts').innerHTML =
    Array.from({length:7},(_,i)=>({n:i,c:seq.filter(v=>v===i).length}))
      .filter(x=>x.c>0)
      .map(x=>`<li>
        <span class="lv-dot" style="background:${LV_COLORS[x.n]}"></span>
        <span style="color:var(--muted);font-size:12px">${names[x.n]}</span>
        <span class="mono" style="margin-left:auto;font-weight:700">${x.c}</span>
      </li>`).join('') || '<li style="color:var(--muted);font-size:12px">Нет данных</li>';
}

// ══════════════════════════════════════════════
// ЗВУК И ВИБРАЦИЯ
// ══════════════════════════════════════════════
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTick(type = 'key') {
  try {
    const ctx  = getAudio();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'key') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'erase') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch(e) {}
}

function vibrate(pattern = [8]) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function hapticTick() {
  try {
    const ctx = getAudio();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch(e) {}
}

function complexityFeedback(type = 'key') {
  playTick(type);
  vibrate(type === 'key' ? [6] : [12]);
  hapticTick();
}

document.querySelectorAll('#tab-complexity [data-level]').forEach(btn => {
  btn.addEventListener('click', () => {
    complexityFeedback('key');
    seq.push(Number(btn.dataset.level));
    renderComplexityDisplay();
    if (!statsBox.classList.contains('hidden')) renderComplexityStats();
  });
});
document.getElementById('erase-last').addEventListener('click', () => {
  complexityFeedback('erase');
  seq.pop(); renderComplexityDisplay();
  if (!statsBox.classList.contains('hidden')) renderComplexityStats();
});
withConfirm(document.getElementById('reset-complexity'), () => {
  seq.length=0; renderComplexityDisplay();
  if (!statsBox.classList.contains('hidden')) renderComplexityStats();
});
toggleStatsBtn.addEventListener('click', () => {
  statsBox.classList.toggle('hidden');
  if (!statsBox.classList.contains('hidden')) renderComplexityStats();
});

// ══════════════════════════════════════════════
// ПРЕЗЕНТАЦИЯ
// ══════════════════════════════════════════════
const plus='+', check='✓', minus='−';

function makePMControls(container) {
  const mk = label => {
    const b = document.createElement('button');
    b.className='pm-btn'; b.textContent=label; b.setAttribute('aria-pressed','false');
    return b;
  };
  const [bP,bC,bM] = [mk(plus),mk(check),mk(minus)];
  container.append(bM,bC,bP);
  [bP,bC,bM].forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.pm-btn').forEach(x=>{
        x.classList.remove('active','plus','check','minus'); x.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active');
      btn.classList.add(btn.textContent===plus?'plus':btn.textContent===check?'check':'minus');
      btn.setAttribute('aria-pressed','true');
      updateDisplay('presentation');
    });
  });
}
document.querySelectorAll('#presentation-list .pm-controls').forEach(makePMControls);
document.querySelectorAll('#creativity-list .pm-controls').forEach(makePMControls);

function valFor(sym){ return sym===plus?1:sym===check?.5:0; }
function readGroup(sel){
  const syms = Array.from(document.querySelectorAll(sel+' li')).map(li=>{
    const a=li.querySelector('.pm-btn.active'); return a?a.textContent:minus;
  });
  const counts={plus:syms.filter(s=>s===plus).length,check:syms.filter(s=>s===check).length,minus:syms.filter(s=>s===minus).length};
  return {syms,counts,sum:syms.reduce((a,s)=>a+valFor(s),0)};
}
function rangeC(c){
  if(c.plus===4)                           return [0.9,1.0];
  if(c.plus===2&&c.check===2)              return [0.7,0.8];
  if(c.plus===1&&c.check===2&&c.minus===1) return [0.5,0.6];
  if(c.check===2&&c.minus===2)             return [0.3,0.4];
  if(c.check<=1&&c.minus>=3)               return [0.0,0.2];
  const s=Math.max(0,Math.min(1,(c.plus+c.check*.5)/4));
  return [+Math.max(0,s-.1).toFixed(1),+Math.min(1,s+.1).toFixed(1)];
}
function rangeP(c){
  if(c.plus===6)                           return [1.7,2.0];
  if(c.plus===3&&c.check===3)              return [1.3,1.6];
  if(c.plus===1&&c.check===4&&c.minus===1) return [0.9,1.2];
  if(c.check===3&&c.minus===3)             return [0.5,0.8];
  if(c.check<=1&&c.minus>=4)               return [0.0,0.4];
  const s=Math.max(0,Math.min(2,((c.plus+c.check*.5)/6)*2));
  return [+Math.max(0,s-.2).toFixed(1),+Math.min(2,s+.2).toFixed(1)];
}
function scoreColor(val,max){
  const r=val/max;
  return r>=.75?'#22c55e':r>=.5?'#eab308':'#ef4444';
}

withConfirm(document.getElementById('reset-presentation'), () => {
  document.querySelectorAll('.pm-btn.active').forEach(b=>{
    b.classList.remove('active','plus','check','minus'); b.setAttribute('aria-pressed','false');
  });
  updateDisplay('presentation');
});

// ══════════════════════════════════════════════
// ТЕХНИЧЕСКИЙ
// ══════════════════════════════════════════════
const reqValues = {};
const penValues = {};
let currentDisc = 'single';

document.querySelectorAll('.req-item').forEach(item => {
  reqValues[item.dataset.key] = 0;
});

document.querySelectorAll('.pen-btn').forEach(btn => {
  penValues[btn.dataset.key] = {
    pen:    parseFloat(btn.dataset.pen),
    once:   btn.dataset.once === 'true',
    count:  0,
    active: false,
  };
});

document.querySelectorAll('.disc-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.disc-btn').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    currentDisc = btn.dataset.disc;
    document.querySelectorAll('.disc-panel').forEach(p=>p.classList.remove('active'));
    document.getElementById('disc-'+currentDisc).classList.add('active');
    updateDisplay('technical');
  });
});

document.querySelectorAll('.tri-controls').forEach(ctrl => {
  const item = ctrl.closest('.req-item');
  const key  = item.dataset.key;
  ctrl.querySelectorAll('.tri-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      ctrl.querySelectorAll('.tri-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      reqValues[key] = parseFloat(btn.dataset.val);
      item.querySelectorAll('.hint').forEach(h=>h.classList.remove('active-hint'));
      const val = reqValues[key];
      if     (val===0)   item.querySelector('.h0')?.classList.add('active-hint');
      else if(val===0.1) item.querySelector('.h1')?.classList.add('active-hint');
      else if(val===0.2) item.querySelector('.h2')?.classList.add('active-hint');
      updateTechDisplay(item.dataset.disc);
      updateDisplay('technical');
    });
  });
});

document.querySelectorAll('.pen-btn').forEach(btn => {
  const key   = btn.dataset.key;
  const once  = btn.dataset.once === 'true';
  let holdTimer = null;

  btn.addEventListener('click', () => {
    const st = penValues[key];
    if (once) {
      st.active = !st.active;
      st.count  = st.active ? 1 : 0;
    } else {
      st.count++;
      st.active = true;
    }
    btn.classList.toggle('pen-active', st.active);
    refreshPenLabel(btn);
    updateTechDisplay(currentDisc);
  });

  if (!once) {
    const startHold = () => {
      holdTimer = setTimeout(() => {
        const st = penValues[key];
        if (st.count > 0) {
          st.count--;
          if (st.count === 0) { st.active = false; btn.classList.remove('pen-active'); }
          else btn.classList.add('pen-active');
        }
        refreshPenLabel(btn);
        updateTechDisplay(currentDisc);
        if (navigator.vibrate) navigator.vibrate(40);
      }, 600);
    };
    const cancelHold = () => clearTimeout(holdTimer);
    btn.addEventListener('touchstart',  startHold,  { passive: true });
    btn.addEventListener('touchend',    cancelHold);
    btn.addEventListener('touchcancel', cancelHold);
    btn.addEventListener('mousedown',   startHold);
    btn.addEventListener('mouseup',     cancelHold);
    btn.addEventListener('mouseleave',  cancelHold);
  }

  btn.addEventListener('contextmenu', e => {
    e.preventDefault();
    const st = penValues[key];
    if (!once && st.count > 0) {
      st.count--;
      if (st.count === 0) { st.active = false; btn.classList.remove('pen-active'); }
    } else if (once && st.active) {
      st.active = false; st.count = 0; btn.classList.remove('pen-active');
    }
    refreshPenLabel(btn);
    updateTechDisplay(currentDisc);
  });
});

function refreshPenLabel(btn) {
  const base = btn.getAttribute('data-base-label') || btn.textContent.replace(/\s*×\d+$/,'');
  btn.setAttribute('data-base-label', base);
  const cnt = penValues[btn.dataset.key].count;
  btn.textContent = cnt > 1 ? base+` ×${cnt}` : base;
}

function updateTechDisplay(disc) {
  if (!disc) return;
  const prefix = disc==='single'?'single_':disc==='double'?'d_':'t_';
  const reqSum = Object.entries(reqValues)
    .filter(([k])=>k.startsWith(prefix))
    .reduce((a,[,v])=>a+v,0);
  const reqEl = document.getElementById('disp-'+disc+'-req');
  if (reqEl) reqEl.textContent = reqSum.toFixed(1);

  const penPrefix = disc==='single'?'s_p_':disc==='double'?'d_p_':'t_p_';
  const penSum = Object.entries(penValues)
    .filter(([k])=>k.startsWith(penPrefix))
    .reduce((a,[,v])=>a+v.pen*v.count,0);
  const penEl = document.getElementById('disp-'+disc+'-pen');
  if (penEl) penEl.textContent = penSum.toFixed(1);
}

document.querySelectorAll('.disc-reset').forEach(btn => {
  withConfirm(btn, () => {
    const disc  = btn.dataset.disc;
    const panel = document.getElementById('disc-'+disc);
    panel.querySelectorAll('.req-item').forEach(item => {
      reqValues[item.dataset.key] = 0;
      item.querySelectorAll('.tri-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
      item.querySelectorAll('.hint').forEach(h=>h.classList.remove('active-hint'));
      item.querySelector('.h0')?.classList.add('active-hint');
    });
    panel.querySelectorAll('.pen-btn').forEach(b => {
      const st = penValues[b.dataset.key];
      st.count=0; st.active=false;
      b.classList.remove('pen-active');
      const base = b.getAttribute('data-base-label');
      if (base) b.textContent = base;
    });
    updateTechDisplay(disc);
    updateDisplay('technical');
  });
});

// ══════════════════════════════════════════════
// ГЛАВНЫЙ ДИСПЛЕЙ
// ══════════════════════════════════════════════
function updateDisplay(tab) {
  displayEl.style.display = tab === 'technical' ? 'none' : '';
  if (tab === 'complexity') { renderComplexityDisplay(); return; }
  if (tab === 'presentation') {
    const gP=readGroup('#presentation-list'), gC=readGroup('#creativity-list');
    const sP=(gP.sum/6)*2, sC=gC.sum/4, tot=sP+sC;
    const [pLo,pHi]=rangeP(gP.counts), [cLo,cHi]=rangeC(gC.counts);
    displayEl.innerHTML=`
      <div class="score-label">Презентация + Креативность</div>
      <div class="score-row">
        <div class="score-big" style="color:${scoreColor(tot,3)}">${tot.toFixed(2)}</div>
        <div class="score-range">от ${(pLo+cLo).toFixed(1)} до ${(pHi+cHi).toFixed(1)}</div>
      </div>
      <div style="display:flex;gap:16px;margin-top:6px">
        <div><div class="label">Презентация</div>
          <span class="mono" style="font-size:15px;font-weight:700">${sP.toFixed(2)}</span>
          <span class="score-range"> (${pLo}–${pHi})</span></div>
        <div><div class="label">Креативность</div>
          <span class="mono" style="font-size:15px;font-weight:700">${sC.toFixed(2)}</span>
          <span class="score-range"> (${cLo}–${cHi})</span></div>
      </div>`;
    return;
  }
  if (tab === 'about') {
    displayEl.innerHTML=`
      <div class="score-label">О приложении</div>
      <div style="font-size:14px;color:var(--text2);margin-top:4px">Инструмент для судей соревнований по спортивным прыжкам со скакалкой</div>`;
  }
}

updateDisplay('complexity');
['single','double','team'].forEach(updateTechDisplay);
