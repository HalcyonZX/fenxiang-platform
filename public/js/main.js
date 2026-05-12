// main.js - 首页逻辑
let allContent = [];
let criteriaData = null;
let autoRefreshTimer = null;

async function init() {
  await Promise.all([loadContent(), loadCriteria()]);
  renderCards(allContent);
  renderCriteria();
  updateStats();
  initFilter();
  // 每 10 秒自动刷新数据
  autoRefreshTimer = setInterval(async () => {
    await Promise.all([loadContent(), loadCriteria()]);
    renderCards(allContent);
    renderCriteria();
    updateStats();
  }, 10000);
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

async function loadCriteria() {
  try {
    const res = await fetch('/api/criteria');
    criteriaData = await res.json();
  } catch (e) {
    console.error('加载评价标准失败', e);
  }
}

function renderCards(items) {
  const grid = document.getElementById('card-feed');
  const empty = document.getElementById('empty-state');

  if (!items || !items.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const typeIcons = { article: '📄', video: '🎬', poster: '🖼️', ppt: '📊' };

  grid.innerHTML = items.map((item, i) => `
    <div class="story-card" onclick="openContent('${item.platformUrl || ''}', '${item.id}')">
      <div class="story-card__cover">
        <span>${typeIcons[item.type] || '📄'}</span>
        <span class="story-card__cover-badge">${item.typeLabel || item.type}</span>
        <span class="story-card__cover-platform">${item.platform || ''}</span>
      </div>
      <div class="story-card__body">
        <div class="story-card__meta">
          <span class="story-card__issue">NO.${String(i + 1).padStart(2, '0')}</span>
          <span class="story-card__dot"></span>
          <span class="story-card__date">${item.productionTime || ''}</span>
        </div>
        <div class="story-card__title">${item.title}</div>
        <div class="story-card__desc">${item.description || ''}</div>
        <div class="story-card__footer">
          <span class="story-card__author">👤 ${item.author || ''}</span>
          <span class="story-card__arrow">↗</span>
        </div>
      </div>
    </div>
  `).join('');
}

function openContent(url, id) {
  if (url && url.trim()) {
    window.open(url, '_blank');
  } else {
    alert('该内容暂无外部链接，请联系内容管理员获取文件。');
  }
}

function initFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      renderCards(filter === 'all' ? allContent : allContent.filter(c => c.type === filter));
    });
  });
}

function updateStats() {
  const statTotal = document.getElementById('stat-total');
  const statTypes = document.getElementById('stat-types');
  const statThisMonth = document.getElementById('stat-this-month');

  if (statTotal) statTotal.textContent = allContent.length;

  if (statTypes) {
    const types = new Set(allContent.map(c => c.typeLabel));
    statTypes.textContent = types.size;
  }

  if (statThisMonth) {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const count = allContent.filter(c => c.productionTime && c.productionTime.startsWith(thisMonth)).length;
    statThisMonth.textContent = count;
  }
}

function renderCriteria() {
  if (!criteriaData) return;
  const container = document.getElementById('criteria-container');

  let html = '';

  if (criteriaData.generic) {
    html += buildBlock('🌟 通用标准', '适用于所有类型内容', criteriaData.generic.criteria);
  }

  const typeMap = {
    article:  ['📄 文章/图文类', '专为文章和图文内容制定的标准'],
    video:    ['🎬 视频类', '专为视频内容制定的标准'],
    poster:   ['🖼️ 长图/海报类', '专为长图和海报内容制定的标准'],
    ppt:      ['📊 PPT类', '专为PPT演示文稿制定的标准'],
  };

  for (const [key, [label, desc]] of Object.entries(typeMap)) {
    if (criteriaData[key]) {
      html += buildBlock(label, desc, criteriaData[key].criteria);
    }
  }

  container.innerHTML = html;
}

function buildBlock(title, desc, criteria) {
  let html = `<div class="criteria-block">`;
  html += `<h3>${title}</h3>`;
  html += `<p class="block-desc">${desc}</p>`;
  html += `<table class="criteria-table">`;
  html += `<thead><tr><th style="width:160px;">评判维度</th><th>具体说明</th></tr></thead>`;
  html += `<tbody>`;
  for (const c of criteria) {
    html += `<tr><td><strong>${c.dimension}</strong></td><td>${c.description}</td></tr>`;
  }
  html += `</tbody></table></div>`;
  return html;
}

document.addEventListener('DOMContentLoaded', init);
