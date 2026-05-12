# 纷享销客内容平台 - Vercel 部署指南

## 部署步骤

### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```
按照提示输入邮箱完成登录。

### 3. 部署项目
在项目根目录执行：
```bash
vercel --prod
```

### 4. 获取公网地址
部署成功后，Vercel 会提供一个类似 `https://your-project.vercel.app` 的地址，这个地址可以让任何人访问。

## 目录结构

```
├── api/                    # Serverless 函数
│   ├── data/              # JSON 数据文件
│   │   ├── content-data.json
│   │   └── criteria.json
│   ├── content.js        # 获取内容列表
│   ├── criteria.js        # 获取评价标准
│   ├── votes.js           # 获取投票结果
│   ├── vote.js            # 提交投票
│   └── current-month.js   # 获取当前月份
├── public/                 # 静态文件
│   ├── index.html         # 内容展示页
│   ├── vote.html          # 投票页
│   ├── results.html       # 结果页
│   ├── css/style.css
│   ├── js/main.js
│   ├── js/vote.js
│   ├── js/results.js
│   └── images/logo.png
├── vercel.json            # Vercel 配置文件
└── package.json
```

## 注意事项

⚠️ **重要**：当前投票数据存储在 `/tmp` 目录，每次冷启动后数据会重置。

如需持久化存储，可以：
1. 注册 [Vercel KV](https://vercel.com/kv) (Redis)
2. 使用 [JSONBin.io](https://jsonbin.io) 免费服务
3. 使用自己的数据库

## 三个页面地址

- 首页：https://your-project.vercel.app/
- 投票页：https://your-project.vercel.app/vote.html
- 结果页：https://your-project.vercel.app/results.html
