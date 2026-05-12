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

// ============ 管理后台 API ============

// 获取内容数据文件路径
function getContentFilePath() {
  return path.join(DATA_DIR, 'content-data.json');
}

// 读取内容数据
function readContentData() {
  const filePath = getContentFilePath();
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return { lastUpdated: '', items: [] };
  }
}

// 保存内容数据
function saveContentData(data) {
  const filePath = getContentFilePath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// POST /api/admin/content/add - 添加内容
app.post('/api/admin/content/add', (req, res) => {
  try {
    const data = readContentData();
    const newItem = req.body;
    
    // 生成ID
    if (!newItem.id) {
      newItem.id = 'cnt-' + Date.now();
    }
    
    // 确保 typeLabel 存在
    const typeLabels = { article: '文章/图文', video: '视频', poster: '长图/海报', ppt: 'PPT' };
    if (!newItem.typeLabel && typeLabels[newItem.type]) {
      newItem.typeLabel = typeLabels[newItem.type];
    }
    
    data.items.push(newItem);
    data.lastUpdated = new Date().toISOString().split('T')[0];
    saveContentData(data);
    
    res.json({ success: true, message: '内容添加成功' });
  } catch (err) {
    console.error('添加内容失败:', err);
    res.status(500).json({ error: '添加内容失败' });
  }
});

// POST /api/admin/content/update/:id - 更新内容
app.post('/api/admin/content/update/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readContentData();
    const index = data.items.findIndex(item => item.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '内容不存在' });
    }
    
    // 保留原ID，更新其他字段
    const updatedItem = { ...data.items[index], ...req.body, id };
    data.items[index] = updatedItem;
    data.lastUpdated = new Date().toISOString().split('T')[0];
    saveContentData(data);
    
    res.json({ success: true, message: '内容更新成功' });
  } catch (err) {
    console.error('更新内容失败:', err);
    res.status(500).json({ error: '更新内容失败' });
  }
});

// POST /api/admin/content/delete/:id - 删除内容
app.post('/api/admin/content/delete/:id', (req, res) => {
  try {
    const { id } = req.params;
    const data = readContentData();
    const index = data.items.findIndex(item => item.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '内容不存在' });
    }
    
    data.items.splice(index, 1);
    data.lastUpdated = new Date().toISOString().split('T')[0];
    saveContentData(data);
    
    res.json({ success: true, message: '内容删除成功' });
  } catch (err) {
    console.error('删除内容失败:', err);
    res.status(500).json({ error: '删除内容失败' });
  }
});

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
