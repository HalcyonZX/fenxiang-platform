// JSONBin.io 配置
// 请替换为你自己的凭证
const JSONBIN_CONFIG = {
  apiKey: '$2a$10$I8x/ZE5dwkgSufz9GClPN.XRoFYeY/qrYRdejqI7K/kwK.4PZjK0O',
  binId: '6a0aaa77c0954111d83d34e6',
  baseUrl: 'https://api.jsonbin.io/v3'
};

// 获取当前月份
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// 通用请求封装
async function jsonbinRequest(method, endpoint, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': JSONBIN_CONFIG.apiKey
  };

  const options = {
    method,
    headers
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${JSONBIN_CONFIG.baseUrl}${endpoint}`, options);
  return res.json();
}

// 获取投票数据
async function getVotesData() {
  const data = await jsonbinRequest('GET', `/b/${JSONBIN_CONFIG.binId}/latest`);
  return data.record || { votes: {}, voters: [] };
}

// 保存投票数据
async function saveVotesData(data) {
  await jsonbinRequest('PUT', `/b/${JSONBIN_CONFIG.binId}`, data);
}
