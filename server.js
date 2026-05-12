const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'api', 'data');
const VOTES_DIR = path.join(__dirname, 'api', 'data', 'votes');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/content - 获取所有内容
app.get('/api/content', (req, res) => {
  const filePath = path.join(DATA_DIR, 'content-data.json');
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '读取内容数据失败' });
  }
});

// GET /api/criteria - 获取评价标准
app.get('/api/criteria', (req, res) => {
  const filePath = path.join(DATA_DIR, 'criteria.json');
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '读取评价标准失败' });
  }
});

// GET /api/votes/:month - 获取某月投票结果（如 2026-05）
app.get('/api/votes/:month', (req, res) => {
  const month = req.params.month;
  const filePath = path.join(VOTES_DIR, `${month}.json`);
  if (!fs.existsSync(filePath)) {
    return res.json({ month, votes: {}, totalVoters: 0 });
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '读取投票数据失败' });
  }
});

// POST /api/vote - 提交投票
app.post('/api/vote', (req, res) => {
  const { month, contentIds, voterName } = req.body;

  if (!month || !Array.isArray(contentIds) || contentIds.length < 3 || contentIds.length > 5) {
    return res.status(400).json({ error: '请选择 3-5 个内容进行投票' });
  }

  const filePath = path.join(VOTES_DIR, `${month}.json`);

  let data;
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // 确保字段存在
    if (!data.voterList) data.voterList = [];
    if (!data.votes) data.votes = {};
  } else {
    data = { month, votes: {}, totalVoters: 0, voterList: [] };
  }

  // 记录投票（简单去重：同一名字当月只能投一次）
  if (voterName && Array.isArray(data.voterList) && data.voterList.includes(voterName)) {
    return res.status(400).json({ error: '您本月已经投过票了，每人每月只能投一次' });
  }

  // 累加票数
  contentIds.forEach(id => {
    if (!data.votes[id]) data.votes[id] = 0;
    data.votes[id]++;
  });

  if (voterName) {
    data.voterList.push(voterName);
  }
  data.totalVoters++;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  res.json({ success: true, message: '投票成功！感谢您的参与。' });
});

// GET /api/current-month - 获取当前投票月度（如 2026-05）
app.get('/api/current-month', (req, res) => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  res.json({ month });
});

// 启动服务 - 监听所有网络接口以便其他设备访问
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 纷享销客内容平台已启动！`);
  console.log(`   📋 内容展示页: http://localhost:${PORT}`);
  console.log(`   🗳️  投票页:     http://localhost:${PORT}/vote.html`);
  console.log(`   📊 结果页:     http://localhost:${PORT}/results.html`);
  console.log(`\n🌐 局域网访问地址: http://172.26.2.217:${PORT}`);
});
