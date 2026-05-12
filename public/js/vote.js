// vote.js - 投票页逻辑
let allContent = [];
let selectedIds = new Set();
let currentMonth = '';
let autoRefreshTimer = null;

async function init() {
  await Promise.all([loadMonth(), loadContent()]);
  renderVoteCards(allContent);
  initFilter();
  checkAlreadyVoted();
  // 每 10 秒自动刷新内容列表
  autoRefreshTimer = setInterval(async () => {
    await loadContent();
    const savedIds = new Set(selectedIds);
    renderVoteCards(allContent);
    // 恢复已选状态
    savedIds.forEach(id => {
      if (document.getElementById(`card-${id}`)) {
        selectedIds.add(id);
        document.getElementById(`card-${id}`).classList.add('selected');
        document.getElementById(`check-${id}`).textContent = '✓';
      }
    });
    updateSelectionUI();
  }, 10000);
}

async function loadMonth() {
  try {
    const res = await fetch('/api/current-month');
    const data = await res.json();
    currentMonth = data.month;
    const label = document.getElementById('vote-month-label');
    if (label) label.textContent = `📅 ${data.month.replace('-', '年')}月 · 投票进行中`;
  } catch (e) {
    document.getElementById('vote-month-label').textContent = '📅 月度投票';
  }
}

async function loadContent() {
  try {
    const res = await fetch('/api/content');
    const data = await res.json();
    allContent = data.items || [];
  } catch (e) {
    console.error('加载内容失败', e);
  }
}

function renderVoteCards(items) {
  const grid = document.getElementById('vote-feed');
  const empty = document.getElementById('empty-state');

  if (!items || !items.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const typeIcons = { article: '📄', video: '🎬', poster: '🖼️', ppt: '📊' };

  grid.innerHTML = items.map(item => `
    <div class="story-card vote-card" id="card-${item.id}" onclick="toggleVote('${item.id}')">
      <div class="story-card__cover">
        <span>${typeIcons[item.type] || '📄'}</span>
        <span class="story-card__cover-badge">${item.typeLabel || item.type}</span>
        <span class="story-card__cover-platform">${item.platform || ''}</span>
        <div class="vote-checkbox" id="check-${item.id}">${selectedIds.has(item.id) ? '✓' : ''}</div>
      </div>
      <div class="story-card__body">
        <div class="story-card__title">${item.title}</div>
        <div class="story-card__desc">${item.description || ''}</div>
        <div class="story-card__footer">
          <span class="story-card__author">👤 ${item.author || ''}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleVote(id) {
  const card = document.getElementById(`card-${id}`);
  const check = document.getElementById(`check-${id}`);

  if (selectedIds.has(id)) {
    selectedIds.delete(id);
    card.classList.remove('selected');
    check.textContent = '';
  } else {
    if (selectedIds.size >= 5) {
      alert('最多只能选 5 个内容，请先取消一个再选。');
      return;
    }
    selectedIds.add(id);
    card.classList.add('selected');
    check.textContent = '✓';
  }
  updateSelectionUI();
}

function updateSelectionUI() {
  const num = selectedIds.size;
  const bar = document.getElementById('submit-bar');
  const btn = document.getElementById('submit-vote-btn');
  const countEl = document.getElementById('selected-num');

  if (countEl) countEl.textContent = num;

  if (num >= 3) {
    bar.style.display = 'flex';
    if (btn) {
      btn.textContent = `提交投票（已选 ${num}/5）`;
      btn.disabled = false;
    }
  } else {
    bar.style.display = 'flex';
    if (btn) {
      btn.textContent = `还需选 ${3 - num} 个内容`;
      btn.disabled = true;
    }
  }
}

async function submitVote() {
  const voterName = document.getElementById('voter-name').value.trim();
  if (!voterName) {
    alert('请先输入您的姓名 / 昵称后再提交投票。');
    document.getElementById('voter-name').focus();
    return;
  }

  if (selectedIds.size < 3 || selectedIds.size > 5) {
    alert('请选择 3～5 个内容进行投票。');
    return;
  }

  try {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: currentMonth,
        contentIds: Array.from(selectedIds),
        voterName: voterName
      })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '提交失败，请稍后重试。');
      return;
    }
    localStorage.setItem(`voted_${currentMonth}`, 'true');
    localStorage.setItem(`voter_${currentMonth}`, voterName);
    document.getElementById('vote-success').style.display = 'flex';
  } catch (e) {
    alert('提交失败，请检查网络后重试。');
  }
}

function checkAlreadyVoted() {
  const voted = localStorage.getItem(`voted_${currentMonth}`);
  if (voted) {
    const successDiv = document.getElementById('vote-success');
    successDiv.style.display = 'flex';
    const h3 = successDiv.querySelector('h3');
    const p = successDiv.querySelector('p');
    if (h3) h3.textContent = '您本月已投票';
    if (p) p.textContent = `感谢参与！您（${localStorage.getItem(`voter_${currentMonth}`)}）的投票已记录。`;
    const link = successDiv.querySelector('a');
    if (link) link.style.display = 'none';
  }
}

function initFilter() {
  document.querySelectorAll('#filter-bar .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      renderVoteCards(filter === 'all' ? allContent : allContent.filter(c => c.type === filter));
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
