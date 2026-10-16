<div align="center">

# ⚡ seo-google-indexer

**Google 官方秒级收录推送工具 (Google Indexing API v3)**  
*适用于 Astro / Next.js / Nuxt / Vue / Vite / 纯 HTML 等任意前端网站*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18.0.0](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Google Indexing API](https://img.shields.io/badge/Google%20API-v3-orange.svg)](https://developers.google.com/search/apis/indexing-api/v3/quickstart)

[特性介绍](#-核心特性) • [一键安装](#-一键安装与使用) • [快速接入](#-网站极速接入两步走) • [隐私与安全](#-隐私安全与风控规范) • [常见问题](#-常见问题-faq)

</div>

---

## 📖 简介

在网站部署或发布更新时，传统的搜索引擎爬虫往往需要数天甚至数周才会重新索引你的新网页。  
**`seo-google-indexer`** 基于 Google 官方提供的 `Web Search Indexing API (v3)`，使用服务账号（Service Account）凭据，以程序化方式直接通知 Google 调度系统立即抓取。

结合本工具，爬虫通常会在**数分钟到数小时内**前来访问页面，大幅加速 SEO 收录效率。

---

## ✨ 核心特性

- 🚀 **极速抓取通知**：告别漫长等待，更新即推，直达 Googlebot 调度中心。
- 📦 **零复杂第三方依赖**：纯原生 Node.js 实现（利用内置 `crypto`, `net`, `fetch`），轻量稳定，不依赖笨重的官方全家桶 SDK。
- 🌐 **智能代理自动识别**：国内开发环境自动识别 Clash / Mihomo / v2ray 本地代理端口（7897, 7890, 10809 等），告别连接超时。
- 🔒 **隐私与安全第一**：
  - 绝不硬编码任何私钥或邮箱。
  - 支持多阶凭据隔离（优先读取项目根目录，其次读取系统用户全局目录）。
  - 自动加固 `.gitignore`，杜绝密钥泄露风险。
- 🗺️ **多技术栈 Sitemap 适配**：自动智能探测 `public/sitemap.xml`、`dist/sitemap.xml` 等路径，开箱即用。

---

## 🛠️ 一键安装与使用

### 方式 1：作为 Antigravity / Claude Code Skill 安装（推荐）

直接在终端或 Agent 中运行安装：

```bash
# 复制或克隆本仓库到技能目录
git clone https://github.com/<your-username>/seo-google-indexer.git ~/.gemini/config/skills/seo-google-indexer
```

安装后即可直接在对话中通过自然语言或命令触发：
```text
/seo-google-indexer init      # 为当前项目一键配置推送环境
/seo-google-indexer push      # 批量推送 sitemap.xml 到 Google
/seo-google-indexer status    # 检查凭据与网络就绪状态
/seo-google-indexer gsc       # 查看 Google Search Console 授权指引
```

---

### 方式 2：作为独立项目脚本使用

即使不作为 Agent Skill，你也可以直接将本仓库作为独立脚本集成进任何前端工程：

1. 将 `templates/google-index.template.js` 复制到你项目的 `scripts/google-index.js`。
2. 在 `package.json` 的 `scripts` 中添加：
   ```json
   {
     "scripts": {
       "seo:push": "node scripts/google-index.js"
     }
   }
   ```
3. 执行推送：
   ```bash
   npm run seo:push
   ```

---

## 🚀 网站极速接入（两步走）

### 第一步：获取凭据（一次性准备）

你可以选择以下两种方式之一准备 Google Cloud 服务账号凭据：

- **重隐私用户（推荐）**：  
  在 Google Cloud Console 创建服务账号并下载 JSON 密钥，重命名为 `service-account.json`，放置于电脑的全局配置目录：  
  `~/.config/google-seo/service-account.json`（Windows 对应 `C:\Users\<你的用户名>\.config\google-seo\service-account.json`）。  
  *所有站点均可永久复用此文件，无需在每个代码仓库中复制密钥！*

- **交互式录入**：  
  在 Agent 中运行 `/seo-google-indexer init`，Agent 会主动询问你的凭据存放路径并协助完成安全就绪检查。

---

### 第二步：在 Google Search Console (GSC) 授权

1. 登录 [Google Search Console](https://search.google.com/search-console)，选择你的站点属性。
2. 点击左下角 **「设置」 (Settings)** ➡️ **「用户和权限」 (Users and permissions)**。
3. 点击 **「添加用户」 (Add user)**：
   - **电子邮件地址**：输入你的机器人服务账号邮箱（例如 `xxx@xxx.iam.gserviceaccount.com`）。
   - **权限**：**必须选择「所有者」 (Owner)**。
   - 点击保存。

> ⚠️ **重要**：权限必须是「所有者」，否则 Google API 会抛出 `403 Permission Denied` 错误。

---

## 🔐 隐私安全与风控规范

1. **防泄漏机制**：
   - 项目根目录的 `.gitignore` 务必包含：
     ```gitignore
     *service-account*.json
     *indexer*.json
     *.secret.json
     ```
   - **切勿将任何 `.json` 私钥文件提交至公开 GitHub 仓库。**
2. **API 调用配额**：
   - Google Cloud 项目默认配额为 **200 个 URL / 天**（所有关联站点共享）。
   - 个人独立站矩阵日常更新量通常在 10~50 个 URL 之间，配额完全充裕。

---

## ❓ 常见问题 (FAQ)

<details>
<summary><b>Q: 出现 403 Permission Denied 是什么原因？</b></summary>
A: 通常是因为在 Google Search Console 中没有将服务账号添加为「所有者 (Owner)」权限，或者当前提交的 URL 协议/域名与 GSC 中绑定的属性不完全一致。
</details>

<details>
<summary><b>Q: 国内本地网络连接超时怎么办？</b></summary>
A: 脚本已内置针对 7897、7890、10809 等常见代理端口的智能环回探测；也可以通过系统环境变量指定代理：
<code>set HTTPS_PROXY=http://127.0.0.1:7890</code>（Windows）或 <code>export HTTPS_PROXY=http://127.0.0.1:7890</code>（macOS/Linux）。
</details>

---

## 📄 开源许可证

本项目基于 [MIT 许可证](LICENSE) 开源。
