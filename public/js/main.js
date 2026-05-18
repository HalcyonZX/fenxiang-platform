// main.js - 首页逻辑（GitHub Pages 版本）
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
    await loadContent();
    renderCards(allContent);
    updateStats();
  }, 10000);
}

async function loadContent() {
  try {
    const res = await fetch('./data/content.json');
    const data = await res.json();
    allContent = data.items || [];
  } catch (e) {
    console.error('加载内容失败', e);
  }
}

async function loadCriteria() {
  try {
    const res = await fetch('./data/criteria.json');
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

  const typeIcons = { insight: '💡', daily: '📝', tool: '🛠️', poster: '🎨', video: '🎬', article: '📄', ppt: '📊' };
  const typeGradients = {
    article: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    video: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    poster: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    ppt: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    insight: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    daily: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    tool: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  };

  grid.innerHTML = items.map((item, i) => {
    const coverHtml = item.cover
      ? `<img class="story-card__cover-img" src="${item.cover}" alt="${item.title}" loading="lazy">`
      : `<div class="story-card__cover-icon" style="background:${typeGradients[item.type] || typeGradients.article};"><span style="font-size:36px;">${typeIcons[item.type] || '📄'}</span></div>`;

    return `
    <div class="story-card" onclick="openContent('${item.platformUrl || ''}', '${item.id}')">
      <div class="story-card__cover">
        ${coverHtml}
        <span class="story-card__cover-badge">${item.typeLabel || item.type}</span>
      </div>
      <div class="story-card__body">
        <div class="story-card__meta">
          <span class="story-card__issue">NO.${String(i + 1).padStart(2, '0')}</span>
          <span class="story-card__dot"></span>
          <span class="story-card__date">${item.productionTime || ''}</span>
        </div>
        <div class="story-card__title">${escapeHtml(item.title)}</div>
        <div class="story-card__desc">${escapeHtml(item.description || '')}</div>
        <div class="story-card__footer">
          <span class="story-card__author">👤 ${escapeHtml(item.author || '')}</span>
          <span class="story-card__arrow">↗</span>
        </div>
      </div>
    </div>
  `}).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openContent(url, id) {
  if (url && url.trim() && !url.includes('example')) {
    window.open(url, '_blank');
  }
  // 无链接或示例链接时不执行任何操作
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
    insight: ['💡 洞察类', '行业深度文章、标杆客户案例'],
    daily:   ['📝 日常类', '案例文章、产品内容、活动资讯'],
    tool:    ['🛠️ 工具类', '演讲素材、公司介绍PPT、销售工具'],
    poster:  ['🎨 视觉类', '海报、长图、活动物料'],
    video:   ['🎬 视频类', '产品演示、客户采访、品牌视频'],
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
