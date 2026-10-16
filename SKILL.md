---
name: seo-google-indexer
description: >-
  Google 官方秒级收录推送工具 (Google Indexing API v3)。
  适用于任意前端技术栈（Astro、Next.js、Nuxt、Vue、HTML 等）。
  自动化全流程：自动探测凭据（支持交互式或自主配置）、项目初始化（脚本注入与 .gitignore 安全加固）、
  解析本地/线上/嵌套 sitemap.xml 或单条 URL 批量向 Googlebot 提交更新通知、
  内置智能网络代理探测、429 重试、防抖限速、每日 200 条配额熔断保护与 dry-run 演练。
  触发场景：接入 Google 收录、配置 google-index、推送 sitemap 到 Google、seo:push、Google 秒级抓取。
user-invocable: true
argument-hint: "[init | push | doctor | gsc | --dry-run]"
license: MIT
metadata:
  category: seo
  version: "1.1.0"
---

# Google 秒级收录推送技能 (Google Indexing API)

本技能通过官方 `Google Web Search Indexing API (v3)`，使用预先生成的服务账号凭据直接通知 Google 官方爬虫加速抓取网站。

---

## 🔒 隐私与安全性原则（零隐私泄漏）

- **严禁在代码、技能文档或公开对话中硬编码任何真实用户的邮箱地址、项目 ID 或私钥内容。**
- **凭据探测优先级**：
  1. 当前项目根目录的 `./service-account.json`
  2. 用户本机全局目录 `~/.config/google-seo/service-account.json`
- **重隐私用户保护策略**：
  - 如果未检测到凭据，**优先告知用户自行在本地放置文件的路径**，不强制在对话中索要敏感密钥。
  - 自动向当前项目根目录的 `.gitignore` 注入安全规则，防止私钥上传到 Git 仓库。

---

## 🎯 核心工作流与 Agent 对话交互规范

### 1. 接入与初始化 (`/seo-google-indexer init`)

为当前项目一键配置秒级收录推送环境。

#### Agent 交互流程：

1. **静默探测凭据**：
   - 检查本机 `~/.config/google-seo/service-account.json` 或项目下的 `service-account.json`。
   - **Case A（凭据已存在）**：
     - 读取该 JSON 内的 `client_email`。
     - **在对话中以高亮代码块形式直接展示该邮箱**，并给出清晰指引：
       ```text
       🔑 已检测到本地 Google 服务账号凭据！
       👉 机器人邮箱: `your-bot@your-project.iam.gserviceaccount.com`
       
       【只需 30 秒手工操作】
       请前往 Google Search Console (https://search.google.com/search-console)：
       1. 选择当前网站属性 -> 点击「设置」 -> 「用户和权限」 -> 「添加用户」
       2. 粘贴上述邮箱，并将权限设为「所有者 (Owner)」保存即可。
       ```
   - **Case B（未检测到凭据）**：
     - 友好询问并提供方案：
       - **推荐方案（自主配置，保护隐私）**：请用户参照 `references/gsc-auth-guide.md`，将 Google Cloud 下载的 JSON 命名为 `service-account.json` 放置于用户全局目录 `~/.config/google-seo/service-account.json`。
       - **交互方案**：若用户希望直接协助，可引导用户提供路径。

2. **注入推送脚本与配置**：
   - 将 `templates/google-index.template.js` 复制到当前项目 `scripts/google-index.js`。
   - 在项目的 `package.json` 的 `scripts` 中注入 `"seo:push": "node scripts/google-index.js"`。
   - 检查 `.gitignore`，自动追加安全规则（`*service-account*.json`, `*.secret.json` 等）。

---

### 2. 批量推送 (`/seo-google-indexer push`)

将网站页面的更新实时通知 Googlebot。

#### 支持的多元模式：
- **默认模式**：`npm run seo:push`（自动探测 `public/sitemap.xml` 或 `dist/sitemap.xml`，自动展开嵌套索引文件）
- **线上地图模式**：`npm run seo:push https://example.com/sitemap.xml`（免本地 build，直接推线上最新链接）
- **单页面即时模式**：`npm run seo:push https://example.com/blog/new-post`（新发单篇博客秒级单推）
- **演练预览模式**：`npm run seo:push -- --dry-run`（仅打印提取的 URL 和数量，不消耗每日 API 配额）

#### 可靠性保障：
- **防并发限频**：每条推送微延时 150ms，遇 429 自动指数退避重试。
- **每日 200 条配额保护**：超过 200 条自动安全截断，防止超额刷屏报错。

---

### 3. 环境与授权诊断 (`/seo-google-indexer doctor`)

用于一键自检：
- Node.js 环境版本（>= 18.0.0）。
- 凭据合法性校验并打印服务账号邮箱。
- 自动测试本地代理端口（7897 / 7890 / 10809）。
- 测试与 Google OAuth2 交换 access_token 的连通性。

---

### 4. GSC 指引速查 (`/seo-google-indexer gsc`)

快速展示 GSC 授权 3 步走以及 403 / 429 常见排查手册（引用 `references/gsc-auth-guide.md`）。
