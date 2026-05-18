// results.js - 结果页逻辑（使用 JSONBin.io）
let allContent = [];
let currentMonth = getCurrentMonth();
let autoRefreshTimer = null;

async function init() {
  await loadContent();
  renderMonthSelector();
  await loadResults(currentMonth);
  // 每 10 秒自动刷新投票结果
  autoRefreshTimer = setInterval(async () => {
    await loadResults(currentMonth);
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

function renderMonthSelector() {
  const container = document.getElementById('month-selector');
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  container.innerHTML = months.map(m => {
    const label = m.replace('-', '年') + '月';
    const cls = m === currentMonth ? 'active' : '';
    return `<button class="month-btn ${cls}" onclick="selectMonth('${m}')">${label}</button>`;
  }).join('');
}

async function selectMonth(month) {
  currentMonth = month;
  document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.month-btn').forEach(b => {
    if (b.textContent.includes(month)) b.classList.add('active');
  });
  await loadResults(month);
}

async function loadResults(month) {
  try {
    const votesData = await getVotesData();
    const votes = votesData.votes || {};
    const voters = votesData.voters || [];
    const totalVoters = voters.length;
    const votedContentCount = Object.keys(votes).length;

    // 摘要
    document.getElementById('results-summary').innerHTML = `
      <div class="summary-card">
        <div class="summary-card__num">${totalVoters}</div>
        <div class="summary-card__label">投票人数</div>
      </div>
      <div class="summary-card">
        <div class="summary-card__num">${votedContentCount}</div>
        <div class="summary-card__label">被投票内容数</div>
      </div>
      <div class="summary-card">
        <div class="summary-card__num">${month}</div>
        <div class="summary-card__label">当前查看月度</div>
      </div>
    `;

    // 排行榜
    const container = document.getElementById('ranking-container');
    const typeIcons = { article: '📄', video: '🎬', poster: '🖼️', ppt: '📊', insight: '💡', daily: '📝', tool: '🛠️' };

    if (!Object.keys(votes).length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🗳️</div>
          <h3 class="empty-state__title">暂无投票数据</h3>
          <p class="empty-state__desc">本月还没有人投票，快去参与投票吧！</p>
          <br>
          <a href="./vote.html" class="btn-primary" style="text-decoration:none;">去投票 →</a>
        </div>
      `;
      return;
    }

    const sorted = Object.entries(votes)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);

    const ranked = sorted.map((v, i) => {
      const content = allContent.find(c => c.id === v.id) || {
        title: '未知内容', typeLabel: '其他', productionTime: '', platform: ''
      };
      return { rank: i + 1, ...content, voteCount: v.count };
    });

    container.innerHTML = ranked.map(item => {
      const rankCls = item.rank <= 3 ? `r-${item.rank}` : 'r-other';
      return `
        <div class="ranking-item">
          <div class="ranking-item__rank ${rankCls}">${item.rank}</div>
          <div class="ranking-item__info">
            <div class="ranking-item__title">${escapeHtml(item.title)}</div>
            <div class="ranking-item__meta">${typeIcons[item.type] || ''} ${escapeHtml(item.typeLabel)} · ${item.productionTime} · ${escapeHtml(item.platform)}</div>
          </div>
          <div class="ranking-item__votes">${item.voteCount} <span>票</span></div>
        </div>
      `;
    }).join('');

  } catch (e) {
    console.error('加载投票结果失败', e);
    document.getElementById('ranking-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">❌</div>
        <h3 class="empty-state__title">加载失败</h3>
        <p class="empty-state__desc">请稍后刷新页面重试</p>
      </div>
    `;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);
