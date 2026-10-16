# 3 分钟极简指南：Google Cloud 凭据申请与 GSC 授权

本文档将原本繁琐的后台流程浓缩为最简路径。请注意区分：
- **终身只做一次**：创建 Google Cloud 凭据（此后你的第 2、第 10、第 100 个网站都永久复用）。
- **每个新网站做一次**：在 GSC 后台授权机器人（耗时 30 秒）。
- **日常发布文章**：全自动 `npm run seo:push`，**0 人工干预**。

---

## 步骤一：创建 Google Cloud 机器人凭据（🌟 终身只做 1 次，全站永久通用）

1. **登录控制台**：
   访问 [Google Cloud Console](https://console.cloud.google.com/)，在顶部新建一个项目（如命名为 `my-seo-indexer`）。
2. **启用 Indexing API**：
   进入 [Web Search Indexing API 页面](https://console.cloud.google.com/apis/library/indexing.googleapis.com)，点击 **「启用 (Enable)」**。
3. **创建服务账号 (Service Account)**：
   - 导航至 **「API 和服务」 ➡️ 「凭据」 (Credentials)**，点击顶部 **「创建凭据」 ➡️ 「服务账号」**。
   - 账号名称任意（如 `seo-bot`），点击 **完成**。
4. **下载 JSON 密钥**：
   - 在服务账号列表中点击刚建好的账号，切换到 **「密钥 (KEYS)」** 选项卡。
   - 点击 **「添加密钥」 ➡️ 「创建新密钥」**，选择 **JSON** 格式并点击创建，浏览器会自动下载一个 `.json` 文件。
5. **本地放置（二选一）**：
   - **推荐（全局永久复用）**：将文件重命名为 `service-account.json`，放进电脑用户目录：  
     - Windows: `C:\Users\<你的用户名>\.config\google-seo\service-account.json`  
     - macOS/Linux: `~/.config/google-seo/service-account.json`
   - **或项目级使用**：直接放进当前网站根目录（本项目自动配置 `.gitignore` 防止泄露）。

---

## 步骤二：在 Google Search Console (GSC) 授权（🌟 每个新网站只做 1 次，耗时 30 秒）

> 💡 **原理**：Google 必须验证你确实拥有该网站，才允许机器人代表你提交抓取通知。

1. 打开 [Google Search Console](https://search.google.com/search-console)，切换到你的网站域名。
2. 左下角点击 **「设置」 (Settings)** ➡️ **「用户和权限」 (Users and permissions)**。
3. 点击右上角 **「添加用户」 (Add user)**：
   - **电子邮件地址**：填入你的服务账号邮箱（例如 `seo-bot@xxxx.iam.gserviceaccount.com`，即 JSON 文件中的 `client_email`）。
   - **权限**：**务必选择「所有者 (Owner)」**。
   - 点击保存即可！

---

## 步骤三：日常使用（🤖 100% 全自动化）

每次网站更新发布后，只需在终端运行：
```bash
npm run seo:push
```
或在 Agent 中说：“帮我推送到 Google 抓取”。
脚本将自动读取凭据、展开全站 sitemap 链接、控制频控并批量直达 Googlebot。无需再登录任何后台！

---

## 常见排查手册

| 报错信息 | 核心原因 | 10秒解决方案 |
| :--- | :--- | :--- |
| `403 Permission Denied` | GSC 权限未给到「所有者」 | 回到 GSC 用户列表，确认该邮箱角色是 **所有者 (Owner)** 而非“完整/受限”。 |
| `429 Quota Exceeded` | 超出每日 200 条默认限制 | 脚本已内置防抖限流与 200 配额截取，超出部分次日 UTC 午夜重置后再推。 |
| `未找到有效 sitemap` | 本地未 build 或路径特殊 | 运行 `npm run build`，或直接使用线上地址：`npm run seo:push https://yoursite.com/sitemap.xml`。 |
