// 提交投票 API
const fs = require('fs');

const VOTES_FILE = '/tmp/votes.json';

// 初始化投票数据
function getVotesData() {
  try {
    if (fs.existsSync(VOTES_FILE)) {
      return JSON.parse(fs.readFileSync(VOTES_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
}

// 保存投票数据
function saveVotesData(data) {
  fs.writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = (req, res) => {
  // Vercel serverless functions 使用 req.body 直接获取解析后的 JSON
  const { month, contentIds, voterName } = req.body || req.query || {};
  
  if (!month || !Array.isArray(contentIds) || contentIds.length < 3 || contentIds.length > 5) {
    return res.status(400).json({ error: '请选择 3-5 个内容进行投票' });
  }
  
  const votesData = getVotesData();
  
  if (!votesData[month]) {
    votesData[month] = { month, votes: {}, totalVoters: 0, voterList: [] };
  }
  
  const monthData = votesData[month];
  if (!monthData.voterList) monthData.voterList = [];
  if (!monthData.votes) monthData.votes = {};
  
  // 简单去重：同一名字当月只能投一次
  if (voterName && monthData.voterList.includes(voterName)) {
    return res.status(400).json({ error: '您本月已经投过票了，每人每月只能投一次' });
  }
  
  // 累加票数
  contentIds.forEach(id => {
    if (!monthData.votes[id]) monthData.votes[id] = 0;
    monthData.votes[id]++;
  });
  
  if (voterName) {
    monthData.voterList.push(voterName);
  }
  monthData.totalVoters++;
  
  saveVotesData(votesData);
  res.json({ success: true, message: '投票成功！感谢您的参与。' });
};
