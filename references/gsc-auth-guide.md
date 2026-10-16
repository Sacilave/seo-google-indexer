# Google Search Console (GSC) 授权与常见问题排查指南

为了让 Google Indexing API 代表你的域名提交页面更新请求，必须将 Google Cloud 服务账号添加为对应 GSC 站点的**所有者 (Owner)**。

---

## 极速授权 3 步走（耗时 1 分钟）

1. **登录 GSC**：
   访问 [Google Search Console](https://search.google.com/search-console)，并在左上角下拉菜单切换到目标网站属性。

2. **进入权限配置**：
   在左侧导航栏滑动到底部，点击 **「设置」 (Settings)** ➡️ **「用户和权限」 (Users and permissions)**。

3. **添加服务账号**：
   - 点击右上角 **「添加用户」 (Add user)**。
   - **电子邮件地址 (Email address)**：填写你的 Service Account 邮箱（例如 `your-bot@your-project.iam.gserviceaccount.com`）。
   - **权限 (Permission)**：**必须选择「所有者」 (Owner)**。
   - 点击 **添加 (Add)** 保存。

---

## 常见错误与排查手册

### 1. `403 Permission Denied: Failed to verify the URL ownership`
- **原因**：
  - 授权未赋予「所有者」权限（仅给了“完整”或“受限”权限）。
  - GSC 中的域名网址与推送脚本提取的 `sitemap.xml` 域名协议不匹配（例如 GSC 属性是 `https://example.com/`，推送的却是 `http://...` 或子域名不同）。
- **解决办法**：
  - 在 GSC「用户和权限」页面确认权限为 **所有者**。
  - 若使用「网域属性 (Domain Property)」，请确保服务账号被添加至根网域属性下。

### 2. `429 Too Many Requests: Quota exceeded`
- **原因**：
  - 触发了 Google Indexing API 的每日调用限额。
- **说明**：
  - 默认情况下，每个 Google Cloud 项目拥有每日 **200 URLs** 的推送配额。
  - 次日（UTC 时间午夜）会自动重置。如果是超大型站点初次上线，可分批分天推送，或者在 Google Cloud Console 中申请提升配额。

### 3. `400 Invalid Request: Failed to parse notification`
- **原因**：推送的 URL 格式非法或包含无效字符。
- **解决办法**：检查 `sitemap.xml` 中的 `<loc>` 标签，确保每个链接均为符合规范的完整绝对路径（如 `https://example.com/blog/article-1`）。
