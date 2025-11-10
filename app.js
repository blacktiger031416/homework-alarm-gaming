// 아직 기능은 없음(로컬 임시 상태만). Firebase/푸시/스케줄은 다음 단계에서 붙임.
const state = {
  user: null,           // 로그인 사용자
  level: 1,             // 게이밍 레벨 (과제 완료 시 증가 예정)
  xp: 0,                // 경험치
  tasks: []             // {id, title, dueISO, done}
};

// DOM 참조
const el = {
  loginBtn: document.querySelector('#loginBtn'),
  logoutBtn: document.querySelector('#logoutBtn'),
  userBadge: document.querySelector('#userBadge'),
  levelSpan: document.querySelector('#levelSpan'),
  addForm: document.querySelector('#addForm'),
  titleInput: document.querySelector('#titleInput'),
  dueInput: document.querySelector('#dueInput'),
  list: document.querySelector('#taskList'),
  empty: document.querySelector('#empty'),
};

// 🔐 구글 로그인/로그아웃 (Firebase Auth 사용)
el.loginBtn?.addEventListener('click', async () => {
  try {
    await window.auth.signInWithPopup(window.googleProvider);
    // 로그인 후 onAuthStateChanged가 자동으로 호출됨
  } catch (err) {
    alert('로그인 실패: ' + err.message);
  }
});

el.logoutBtn?.addEventListener('click', async () => {
  try {
    await window.auth.signOut();
  } catch (err) {
    alert('로그아웃 실패: ' + err.message);
  }
});

// 로그인 상태 변경 감시
window.auth.onAuthStateChanged((user) => {
  state.user = user
    ? { displayName: user.displayName || 'User', uid: user.uid, email: user.email || '' }
    : null;
  render();
});


// 과제 추가(임시 로컬 저장)
el.addForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = el.titleInput.value.trim();
  const dueISO = el.dueInput.value;
  if (!title || !dueISO) return;
  state.tasks.push({ id: crypto.randomUUID(), title, dueISO, done: false });
  el.titleInput.value = '';
  el.dueInput.value = '';
  render();
});

// 완료 토글
function toggleDone(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  // 임시 보상 규칙: 완료 시 XP+10 (나중에 서버 동기화/업적 규칙 추가)
  if (t.done) {
    state.xp += 10;
    if (state.xp >= 100) { state.level++; state.xp = 0; }
  }
  render();
}

function timeLeftText(dueISO) {
  const ms = new Date(dueISO) - new Date();
  const min = Math.round(ms / 60000);
  if (min < 0) return '마감 지남';
  if (min < 60) return `약 ${min}분 남음`;
  const hr = Math.floor(min/60);
  const rem = min % 60;
  return rem ? `약 ${hr}시간 ${rem}분 남음` : `약 ${hr}시간 남음`;
}

function render() {
  // 헤더(로그인 뱃지)
  if (state.user) {
    el.userBadge.textContent = `${state.user.displayName}`;
    el.userBadge.classList.remove('hidden');
    el.logoutBtn.classList.remove('hidden');
    el.loginBtn.classList.add('hidden');
  } else {
    el.userBadge.classList.add('hidden');
    el.logoutBtn.classList.add('hidden');
    el.loginBtn.classList.remove('hidden');
  }
  // 레벨 표시
  el.levelSpan.textContent = `Lv.${state.level} (XP ${state.xp}/100)`;

  // 리스트
  el.list.innerHTML = '';
  if (state.tasks.length === 0) {
    el.empty.classList.remove('hidden');
  } else {
    el.empty.classList.add('hidden');
    state.tasks
      .slice()
      .sort((a,b) => new Date(a.dueISO) - new Date(b.dueISO))
      .forEach(t => {
        const row = document.createElement('div');
        row.className = 'item';
        row.innerHTML = `
          <div class="meta">
            <input type="checkbox" ${t.done ? 'checked':''} aria-label="완료" />
            <div>
              <div>${t.title}</div>
              <small>${new Date(t.dueISO).toLocaleString()} · ${timeLeftText(t.dueISO)}</small>
            </div>
          </div>
          <button class="secondary">토글</button>
        `;
        // 접근성: 체크박스/버튼 모두 토글 가능
        row.querySelector('input').addEventListener('change', () => toggleDone(t.id));
        row.querySelector('button').addEventListener('click', () => toggleDone(t.id));
        el.list.appendChild(row);
      });
  }
}
render();
