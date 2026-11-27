/* ============================================================
   뽈이 비서실 · assets/app.js
   - Firebase Realtime Database(bbore-office)에 연결되어, 여러 피클·기기가 실시간으로 같은 목록을 봅니다.
   - 연결이 잠시 끊기면 이 브라우저(localStorage)에 먼저 저장해 두고 다시 연결되면 올립니다.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBtXUbHg9KQ0jdVPXYF7TBFgwkhBacgtMs',
  authDomain: 'bbore-office.firebaseapp.com',
  databaseURL: 'https://bbore-office-default-rtdb.firebaseio.com',
  projectId: 'bbore-office',
  storageBucket: 'bbore-office.firebasestorage.app',
  messagingSenderId: '230117918413',
  appId: '1:230117918413:web:cac0f33b322637f49c0b84'
};
const FIREBASE_PATH = 'bbori-office';
const STORAGE_KEY = 'bbori-office-v1';

const CATS = [
  { id: 'deal', emoji: '🛍️', name: '체험단 · 리뷰' },
  { id: 'publish', emoji: '✍️', name: '뽈로그 · 스레드 · 릴스' },
  { id: 'entry', emoji: '🎁', name: '핫딜헌터 · 응모' },
  { id: 'routine', emoji: '🌿', name: '일상 · 루틴' }
];

const ROOMS = {
  meeting: {
    emoji: '🏛️',
    name: '대회의실',
    desc: '긴 원목 테이블에서 다음 계획을 맞추는 방이에요. 회의실 탭에 올린 안건이 여기에 모여요.'
  },
  command: {
    emoji: '🎯',
    name: '지휘실',
    desc: '세 개의 책상에서 실제 작업이 처리되는 방이에요. 작업실 보드에서 아직 안 끝난 일이 여기 보여요.'
  },
  lounge: {
    emoji: '☕',
    name: '라운지',
    desc: '소파에서 잠깐 쉬어 가는 방이에요. 안약 시간과 취침 전 루틴을 알려 드려요.'
  }
};

const SEED = {
  theme: 'cream',
  motion: true,
  tasks: [
    { id: 's1', cat: 'deal', text: '쿠팡 미작성 리뷰 정리 (사진 있는 것부터)', done: false },
    { id: 's2', cat: 'deal', text: '무신사 체험단 후기 2건 등록', done: false },
    { id: 's3', cat: 'deal', text: '단하나 속눈썹펌 일정 확인 (12/3 오전 10시)', done: false },
    { id: 's4', cat: 'publish', text: '뽈로그: 사진 먼저 → 글 순서로 점검', done: false },
    { id: 's5', cat: 'publish', text: '스레드 @homebody_memo 오늘 1포', done: false },
    { id: 's6', cat: 'publish', text: '릴스 자막 대본 붙이기', done: false },
    { id: 's7', cat: 'entry', text: '핫딜헌터 오늘 응모 목록 훑기', done: false },
    { id: 's8', cat: 'entry', text: '인스타 이벤트 캡처 응모 (스토리·리포스트는 직접)', done: false },
    { id: 's9', cat: 'routine', text: '저녁 18:00 안약 (후루손 → 크릭스)', done: false },
    { id: 's10', cat: 'routine', text: 'SJPT 20시 즉답 10문항', done: false },
    { id: 's11', cat: 'routine', text: '12/4 14:00 안과 검진 알림 확인', done: false }
  ],
  minutes: [
    {
      id: 'm1',
      text: '@미니 이번 주는 체험단 후기 마감이 먼저야. 쿠팡 리뷰는 사진 있는 것부터 정리해 줘.',
      author: '보람 님',
      at: null
    }
  ],
  notes: [
    { id: 'n1', text: '12월 콘텐츠 캘린더: 월 4개만. 무리하지 않기.', at: null },
    { id: 'n2', text: '크릭스 다 쓰면 약국에 물어보기', at: null }
  ]
};

/* ---------- 저장소 ---------- */

const Store = {
  state: null,
  remoteRef: null,
  remoteOn: false,
  saveTimer: null,

  load() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (e) {
      saved = null;
    }
    this.state = Object.assign({}, JSON.parse(JSON.stringify(SEED)), saved || {});
    this.state.tasks = Array.isArray(this.state.tasks) ? this.state.tasks : [];
    this.state.minutes = Array.isArray(this.state.minutes) ? this.state.minutes : [];
    this.state.notes = Array.isArray(this.state.notes) ? this.state.notes : [];
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      /* 저장 공간이 막힌 브라우저에서는 조용히 넘어갑니다 */
    }
    if (this.remoteOn) {
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        this.saveTimer = null;
        try {
          this.remoteRef
            .set(JSON.parse(JSON.stringify(this.state)))
            .catch(e => console.warn('[뽈이 비서실] 원격 저장 실패', e));
        } catch (e) {
          console.warn('[뽈이 비서실] 원격 저장 실패', e);
        }
      }, 350);
    }
  },

  async initRemote() {
    const cfg = FIREBASE_CONFIG;
    if (!cfg || !cfg.databaseURL) return;
    try {
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js');
      /* global firebase */
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      const db = firebase.database();
      const ref = db.ref(FIREBASE_PATH);
      this.remoteRef = ref;
      this.remoteOn = true;

      /* 처음 열 때 원격이 비어 있으면 이 기기의 내용을 그대로 올려 둡니다. */
      const first = await ref.once('value');
      if (!first.exists()) {
        await ref.set(JSON.parse(JSON.stringify(this.state)));
      }

      ref.on('value', snap => {
        const value = snap.val();
        if (!value || !Array.isArray(value.tasks)) return;
        /* 이 기기에서 아직 못 올린 변경이 있으면 원격 값으로 덮지 않습니다. */
        if (this.saveTimer) return;
        this.state = Object.assign({}, JSON.parse(JSON.stringify(SEED)), value);
        this.state.tasks = Array.isArray(this.state.tasks) ? this.state.tasks : [];
        this.state.minutes = Array.isArray(this.state.minutes) ? this.state.minutes : [];
        this.state.notes = Array.isArray(this.state.notes) ? this.state.notes : [];
        renderAll();
      });

      const el = document.getElementById('saveState');
      db.ref('.info/connected').on('value', s => {
        if (!el) return;
        el.textContent = s.val() === true
          ? '실시간으로 함께 저장 중'
          : '연결 기다리는 중 (이 브라우저에도 저장)';
      });
    } catch (e) {
      console.warn('[뽈이 비서실] Firebase 연결 실패 — 브라우저 저장으로 계속합니다', e);
      const el = document.getElementById('saveState');
      if (el) el.textContent = '이 브라우저에만 저장 중';
    }
  }
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ---------- 작은 도구들 ---------- */

const $ = sel => document.querySelector(sel);
const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linkMentions(str) {
  return esc(str).replace(/(@[\w가-힣]+)/g, '<span class="mention-tag">$1</span>');
}

function timeLabel(ts) {
  if (!ts) return '처음 열 때';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const today = new Date();
  const same = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  return (same ? '오늘 ' : `${d.getMonth() + 1}/${d.getDate()} `) + `${hh}:${mm}`;
}

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

/* ---------- 렌더 ---------- */

function counts() {
  const s = Store.state;
  const total = s.tasks.length;
  const done = s.tasks.filter(t => t.done).length;
  return {
    total,
    done,
    open: total - done,
    minutes: s.minutes.length,
    notes: s.notes.length,
    cats: CATS.map(c => ({
      ...c,
      items: s.tasks.filter(t => t.cat === c.id),
      open: s.tasks.filter(t => t.cat === c.id && !t.done).length
    }))
  };
}

function renderBanner() {
  const c = counts();
  const d = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateLine = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일 · ${d.getHours() < 12 ? '오전' : '오후'}`;
  $('#todayLine').textContent = dateLine;
  $('#chipMeeting').textContent = `안건 ${c.minutes}`;
  $('#chipCommand').textContent = `진행 ${c.open}`;
  $('#chipLounge').textContent = c.done > 0 ? `오늘 ${c.done}개 끝냄` : '여유';
  $('#chipSeats').textContent = '1 / 3';
  const roomsOn = [
    c.minutes > 0,
    c.open > 0,
    Store.state.tasks.some(t => t.cat === 'routine')
  ].filter(Boolean).length;
  $('#activeRooms').textContent = String(roomsOn);
  $('#workSummary').textContent = `남은 일 ${c.open}개 · 끝낸 일 ${c.done}개`;
}

function renderBoard() {
  const c = counts();
  $('#board').innerHTML = c.cats.map(cat => `
    <section class="column" aria-label="${esc(cat.name)}">
      <div class="column-head">
        <span class="title">${cat.emoji} ${esc(cat.name)}</span>
        <span class="count">${cat.open}</span>
      </div>
      <ul class="tasks">
        ${cat.items.length ? cat.items.map(t => `
          <li class="task ${t.done ? 'done' : ''}" data-id="${t.id}">
            <button class="check" type="button" data-act="toggle" data-id="${t.id}"
                    aria-label="${t.done ? '완료 취소' : '완료로 표시'}" aria-pressed="${t.done}">✓</button>
            <span class="text">${esc(t.text)}</span>
            <button class="del" type="button" data-act="del" data-id="${t.id}" aria-label="삭제">✕</button>
          </li>`).join('') : '<li class="empty">아직 없어요</li>'}
      </ul>
      <form class="add-row" data-cat="${cat.id}">
        <input type="text" name="text" placeholder="할 일 추가" maxlength="120" aria-label="${esc(cat.name)} 할 일 추가" />
        <button type="submit" aria-label="추가">＋</button>
      </form>
    </section>`).join('');
}

function renderStats() {
  const c = counts();
  const rate = c.total ? Math.round((c.done / c.total) * 100) : 0;
  $('#statGrid').innerHTML = `
    <div class="stat"><div class="label">오늘 할 일</div><div class="value">${c.total}<small>개</small></div></div>
    <div class="stat"><div class="label">끝낸 일</div><div class="value">${c.done}<small>개</small></div></div>
    <div class="stat"><div class="label">남은 일</div><div class="value">${c.open}<small>개</small></div></div>
    <div class="stat"><div class="label">완료율</div><div class="value">${rate}<small>%</small></div></div>`;
}

function renderRoom(roomId) {
  const room = ROOMS[roomId] || ROOMS.meeting;
  const s = Store.state;
  let items = [];
  if (roomId === 'meeting') {
    items = s.minutes.slice(0, 4).map(m => `<li><span class="bullet">•</span><span>${linkMentions(m.text)}</span></li>`);
    if (!items.length) items = ['<li><span class="bullet">•</span><span>아직 안건이 없어요. 회의실 탭에서 올려 주세요.</span></li>'];
  } else if (roomId === 'command') {
    const open = s.tasks.filter(t => !t.done).slice(0, 5);
    items = open.map(t => `<li><span class="bullet">${t.done ? '✓' : '•'}</span><span>${esc(t.text)}</span></li>`);
    if (!items.length) items = ['<li><span class="bullet">✓</span><span>오늘 할 일을 다 끝냈어요. 라운지에서 쉬어요.</span></li>'];
  } else {
    const lounge = s.tasks.filter(t => t.cat === 'routine');
    items = lounge.map(t => `<li class="${t.done ? 'done' : ''}"><span class="bullet">${t.done ? '✓' : '☾'}</span><span>${esc(t.text)}</span></li>`);
    if (!items.length) items = ['<li><span class="bullet">☾</span><span>루틴 목록이 비어 있어요.</span></li>'];
  }

  $('#roomPanel').innerHTML = `
    <div class="room-top">
      <span class="room-emoji" aria-hidden="true">${room.emoji}</span>
      <div>
        <h3>${room.name}</h3>
        <span class="hint" style="font-size:12px; color:var(--ink-faint);">${roomId === 'meeting' ? '계획 · 안건' : roomId === 'command' ? '작업 · 처리' : '휴식 · 루틴'}</span>
      </div>
    </div>
    <p class="room-desc">${room.desc}</p>
    <ul class="room-list">${items.join('')}</ul>
    <div style="margin-top:14px;">
      <button class="btn ghost" type="button" data-goto="${roomId === 'meeting' ? 'meeting' : roomId === 'command' ? 'work' : 'team'}">
        ${roomId === 'meeting' ? '💬 회의실 열기' : roomId === 'command' ? '📋 작업실 열기' : '📊 루틴 보기'}
      </button>
    </div>`;
}

function renderMinutes() {
  const list = Store.state.minutes;
  $('#minuteList').innerHTML = list.length
    ? list.map(m => `
      <article class="minute" data-id="${m.id}">
        <span class="mini-avatar" aria-hidden="true">🗣️</span>
        <div class="body">
          <div class="meta"><b>${esc(m.author || '보람 님')}</b><span>${timeLabel(m.at)}</span></div>
          <p>${linkMentions(m.text)}</p>
        </div>
        <button class="del" type="button" data-act="del-minute" data-id="${m.id}" aria-label="안건 삭제">✕</button>
      </article>`).join('')
    : '<p class="empty">아직 올린 안건이 없어요.</p>';
}

function renderNotes() {
  const list = Store.state.notes;
  $('#noteList').innerHTML = list.length
    ? list.map(n => `<article class="note" data-id="${n.id}">${esc(n.text)}<span class="note-meta">${timeLabel(n.at)}</span><span class="note-actions"><button type="button" data-act="del-note" data-id="${n.id}">삭제</button></span></article>`).join('')
    : '<p class="empty">첫 메모를 붙여 보세요.</p>';
}

function renderToggles() {
  const night = Store.state.theme === 'night';
  document.documentElement.dataset.theme = night ? 'night' : 'cream';
  document.querySelector('meta[name="theme-color"]').setAttribute('content', night ? '#241b14' : '#f7efe2');
  $('#themeToggle').setAttribute('aria-pressed', String(night));
  const motion = Store.state.motion !== false;
  $('#motionToggle').setAttribute('aria-pressed', String(motion));
  const map = $('#mapWrap');
  if (map) map.classList.toggle('motion', motion);
}

function renderAll() {
  renderToggles();
  renderBanner();
  renderBoard();
  renderStats();
  renderMinutes();
  renderNotes();
  const active = document.querySelector('.pin[aria-pressed="true"]');
  renderRoom(active ? active.dataset.room : 'meeting');
}

/* ---------- 동작 ---------- */

function switchTab(id) {
  document.querySelectorAll('.tab').forEach(t => {
    const on = t.id === 'tab-' + id;
    t.setAttribute('aria-selected', String(on));
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + id));
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initEvents() {
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.id.replace('tab-', '')));
  });

  document.querySelectorAll('.pin').forEach(pin => {
    pin.addEventListener('click', () => {
      document.querySelectorAll('.pin').forEach(p => p.setAttribute('aria-pressed', 'false'));
      pin.setAttribute('aria-pressed', 'true');
      renderRoom(pin.dataset.room);
    });
  });

  $('#roomPanel').addEventListener('click', e => {
    const btn = e.target.closest('[data-goto]');
    if (btn) switchTab(btn.dataset.goto);
  });

  $('#motionToggle').addEventListener('click', () => {
    Store.state.motion = Store.state.motion === false;
    Store.save();
    renderToggles();
    toast(Store.state.motion ? '움직임 효과를 켰어요' : '움직임 효과를 껐어요');
  });

  $('#themeToggle').addEventListener('click', () => {
    Store.state.theme = Store.state.theme === 'night' ? 'cream' : 'night';
    Store.save();
    renderToggles();
    toast(Store.state.theme === 'night' ? '밤 테마로 바꿨어요' : '낮 테마로 바꿨어요');
  });

  /* 작업실 */
  $('#board').addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === 'toggle') {
      const t = Store.state.tasks.find(x => x.id === id);
      if (t) { t.done = !t.done; Store.save(); renderAll(); }
    } else if (btn.dataset.act === 'del') {
      Store.state.tasks = Store.state.tasks.filter(x => x.id !== id);
      Store.save(); renderAll(); toast('할 일을 지웠어요');
    }
  });

  $('#board').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target.closest('form[data-cat]');
    if (!form) return;
    const input = form.querySelector('input[name="text"]');
    const text = (input.value || '').trim();
    if (!text) return;
    Store.state.tasks.push({ id: uid(), cat: form.dataset.cat, text, done: false });
    Store.save(); renderAll();
    const again = document.querySelector(`form[data-cat="${form.dataset.cat}"] input`);
    if (again) again.focus();
    toast('할 일을 추가했어요');
  });

  /* 회의실 */
  document.querySelectorAll('.mention').forEach(b => {
    b.addEventListener('click', () => {
      const ta = $('#minuteInput');
      const tag = b.dataset.mention + ' ';
      const start = ta.selectionStart || ta.value.length;
      ta.value = ta.value.slice(0, start) + tag + ta.value.slice(ta.selectionEnd || start);
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + tag.length;
    });
  });

  $('#addMinute').addEventListener('click', () => {
    const ta = $('#minuteInput');
    const text = ta.value.trim();
    if (!text) { toast('안건을 먼저 적어 주세요'); ta.focus(); return; }
    Store.state.minutes.unshift({ id: uid(), text, author: '보람 님', at: Date.now() });
    ta.value = '';
    Store.save(); renderAll();
    toast(text.includes('@미니') ? '@미니에게 전달할 안건으로 올렸어요' : '회의실에 안건을 올렸어요');
  });

  $('#minuteList').addEventListener('click', e => {
    const btn = e.target.closest('button[data-act="del-minute"]');
    if (!btn) return;
    Store.state.minutes = Store.state.minutes.filter(m => m.id !== btn.dataset.id);
    Store.save(); renderAll();
  });

  /* 메모 */
  $('#addMemo').addEventListener('click', () => {
    const ta = $('#memoInput');
    const text = ta.value.trim();
    if (!text) { toast('메모를 먼저 적어 주세요'); ta.focus(); return; }
    Store.state.notes.unshift({ id: uid(), text, at: Date.now() });
    ta.value = '';
    Store.save(); renderAll();
    toast('메모를 붙였어요');
  });

  $('#noteList').addEventListener('click', e => {
    const btn = e.target.closest('button[data-act="del-note"]');
    if (!btn) return;
    Store.state.notes = Store.state.notes.filter(n => n.id !== btn.dataset.id);
    Store.save(); renderAll();
  });

  /* 탭 링크(#work 같은 주소)로 바로 열기 */
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (['map', 'meeting', 'work', 'team', 'memo'].includes(id)) switchTab(id);
  });
}

/* ---------- 시작 ---------- */

Store.load();
renderAll();
initEvents();
Store.initRemote();

const initialTab = location.hash.slice(1);
if (['map', 'meeting', 'work', 'team', 'memo'].includes(initialTab)) switchTab(initialTab);
