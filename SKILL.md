---
name: seo-google-indexer
description: >-
  Google 官方秒级收录推送工具 (Google Indexing API v3)。
  适用于任意前端技术栈（Astro、Next.js、Nuxt、Vue、HTML 等）。
  自动化全流程：自动询问配置凭据（支持交互式录入或自主配置）、项目脚本初始化、
  解析 sitemap.xml 提取全站 URL 并批量向 Googlebot 提交更新通知、
  智能检测网络代理、自动配置 .gitignore 严格防止凭据泄露。
  触发场景：接入 Google 收录、配置 google-index、推送 sitemap 到 Google、seo:push、Google 秒级抓取。
user-invocable: true
argument-hint: "[init | push | status | gsc]"
license: MIT
metadata:
  category: seo
  version: "1.0.0"
---

# Google 秒级收录推送技能 (Google Indexing API)

本技能通过官方 `Google Web Search Indexing API (v3)`，使用预先生成的服务账号（Service Account）凭据，以程序化方式通知 Google 官方爬虫加速抓取网站更新。

---

## 🔒 隐私与安全性原则（零硬编码、零隐私泄漏）

- **严禁在代码、技能文档或公开仓库中硬编码任何真实的邮箱地址、项目 ID 或私钥内容。**
- **凭据探测优先级**：
  1. 当前项目根目录的 `./service-account.json`
  2. 用户本机全局目录 `~/.config/google-seo/service-account.json`
- **重隐私用户保护策略**：
  - 如果未检测到凭据，**优先提供让用户自行放置文件的选项**，绝不强制要求在对话框粘贴敏感密钥。
  - 自动向项目根目录的 `.gitignore` 注入安全规则，彻底避免凭据意外提交到代码仓库。

---

## 常见命令与执行工作流

### 1. 接入与初始化 (`/seo-google-indexer init`)

为当前项目一键配置收录推送能力。

#### 流程步骤：

1. **凭据探测与用户沟通**：
   - 首先静默检查本机是否存在全局凭据：`~/.config/google-seo/service-account.json` 或当前项目下的 `service-account.json`。
   - **若已存在凭据**：直接读取 `client_email`，向用户确认，并输出对应 GSC 授权提示。
   - **若不存在凭据**：
     - **不可直接报错**，向用户提供两个友好选项：
       - **选项 A（自主配置 - 重隐私推荐）**：告知用户将 Google Cloud 下载的 JSON 凭据重命名为 `service-account.json`，放置在用户全局目录 `~/.config/google-seo/service-account.json`（或当前项目根目录下）。
       - **选项 B（交互式辅助）**：若用户主动希望协助配置，指导用户提供凭据路径或相关内容并安全存入本机全局目录。

2. **写入脚手架脚本**：
   - 在当前项目根目录创建 `scripts/google-index.js`（复制自 `templates/google-index.template.js`）。

3. **配置 `package.json`**：
   - 读取当前项目的 `package.json`，在 `scripts` 对象中自动增加：
     ```json
     "scripts": {
       "seo:push": "node scripts/google-index.js"
     }
     ```

4. **安全加固 `.gitignore`**：
   - 检查并确保项目根目录的 `.gitignore` 包含以下敏感文件过滤规则：
     ```gitignore
     *service-account*.json
     *indexer*.json
     *.secret.json
     ```

5. **GSC 授权引导**：
   - 明确告知用户当前服务账号邮箱，并提醒至 [Google Search Console](https://search.google.com/search-console) 将该邮箱添加为当前域名的**所有者 (Owner)**。

---

### 2. 执行批量推送 (`/seo-google-indexer push`)

将网站最新生成的 `sitemap.xml` 批量推送到 Googlebot。

#### 流程步骤：

1. 检查凭据有效性。
2. 自动定位站点地图文件（优先扫描 `public/sitemap.xml`、`dist/sitemap.xml`、`dist/client/sitemap.xml` 等）。若未找到，提示用户先执行 `npm run build`。
3. 执行 `node scripts/google-index.js`（或直接使用本技能内置推送逻辑）。
4. 输出推送统计结果（已推送总数、成功数、失败数、每日配额提醒）。

---

### 3. 环境与就绪检查 (`/seo-google-indexer status`)

诊断当前推送环境是否就绪：
- 检查凭据是否存在与格式是否合法。
- 测试网络代理连通性（7897 / 7890 / 10809 端口环回探测）。
- 测试能否通过 JWT 成功与 Google 换取 access_token。

---

### 4. 授权指引 (`/seo-google-indexer gsc`)

快速展示 GSC 授权说明及常见问题（如 403 权限不足、429 配额耗尽处理）。
可参考 `references/gsc-auth-guide.md`。
