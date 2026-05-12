// 投票存储 API - 使用 Vercel KV 或文件系统
const fs = require('fs');
const path = require('path');

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
  const { month } = req.query;
  
  if (!month) {
    return res.status(400).json({ error: '缺少月份参数' });
  }
  
  const votesData = getVotesData();
  const monthVotes = votesData[month] || { month, votes: {}, totalVoters: 0, voterList: [] };
  
  res.json(monthVotes);
};
