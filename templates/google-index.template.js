import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import net from 'node:net';

/**
 * 智能网络代理检测与配置（兼容 Clash / Mihomo / v2ray / 系统环境代理）
 */
async function setupProxy() {
  const envProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
  let targetProxy = envProxy;

  if (!targetProxy) {
    const probePort = (port) =>
      new Promise((resolve) => {
        const socket = net.createConnection({ port, host: '127.0.0.1', timeout: 300 });
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(false);
        });
      });

    // 常见本地代理端口检测
    for (const port of [7897, 7890, 10809, 10808]) {
      if (await probePort(port)) {
        targetProxy = `http://127.0.0.1:${port}`;
        break;
      }
    }
  }

  if (targetProxy) {
    try {
      const { ProxyAgent, setGlobalDispatcher } = await import('undici');
      setGlobalDispatcher(new ProxyAgent(targetProxy));
      console.log(`🌐 [Proxy] 已自动配置网络代理通道: ${targetProxy}`);
    } catch {
      // 若当前环境未预装 undici，Node 18+ 原生 fetch 在部分系统代理生效时仍可直接使用
    }
  }
}

/**
 * 读取 Google 凭据文件：
 * 1. 优先读取项目本地根目录的 service-account.json
 * 2. 其次读取系统全局用户目录 ~/.config/google-seo/service-account.json
 */
function getCredentials() {
  const localPath = path.resolve(process.cwd(), 'service-account.json');
  const globalPath = path.resolve(os.homedir(), '.config', 'google-seo', 'service-account.json');

  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, 'utf8'));
  }
  if (fs.existsSync(globalPath)) {
    return JSON.parse(fs.readFileSync(globalPath, 'utf8'));
  }

  throw new Error(
    `未找到 Google 服务账号凭据！\n` +
    `请将 service-account.json 放置于以下任一位置：\n` +
    `  - 当前项目根目录: ${localPath}\n` +
    `  - 用户全局配置目录: ${globalPath}\n` +
    `（提示：切勿将该私钥文件提交至公开 Git 仓库）`
  );
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * 原生 Node.js 构造 JWT Bearer 签名并换取 Google OAuth2 Token
 */
async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(credentials.private_key, 'base64url');
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!res.ok) {
    throw new Error(`Google OAuth2 Token 获取失败 (HTTP ${res.status}): ${await res.text()}`);
  }
  return (await res.json()).access_token;
}

/**
 * 自动定位并解析 sitemap.xml 提取所有 URL
 * 兼容 public/sitemap.xml, dist/sitemap.xml, build/sitemap.xml 等
 */
function findAndExtractUrls() {
  const candidatePaths = [
    path.resolve(process.cwd(), 'public', 'sitemap.xml'),
    path.resolve(process.cwd(), 'dist', 'sitemap.xml'),
    path.resolve(process.cwd(), 'dist', 'client', 'sitemap.xml'),
    path.resolve(process.cwd(), 'build', 'sitemap.xml'),
    path.resolve(process.cwd(), 'sitemap.xml')
  ];

  let chosenPath = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      chosenPath = p;
      break;
    }
  }

  if (!chosenPath) {
    console.warn(`⚠️ 未检测到有效 sitemap.xml。已检查候选路径:\n${candidatePaths.map(p => `  - ${p}`).join('\n')}`);
    return [];
  }

  console.log(`🗺️ 成功加载站点地图文件: ${chosenPath}`);
  const content = fs.readFileSync(chosenPath, 'utf8');
  const urls = [];
  const regex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const url = match[1].trim();
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }
  return urls;
}

/**
 * 向 Google Indexing API 发送单条收录请求
 */
async function publishUrl(accessToken, url) {
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url, type: 'URL_UPDATED' })
  });

  if (!res.ok) {
    return { success: false, status: res.status, error: await res.text() };
  }
  return { success: true };
}

/**
 * 命令行执行入口
 */
async function main() {
  console.log('🚀 [Google Indexer] 正在初始化收录推送任务...');
  await setupProxy();

  const credentials = getCredentials();
  console.log(`🔑 已就绪服务账号: ${credentials.client_email}`);

  const accessToken = await getAccessToken(credentials);
  console.log('✅ Google 授权凭据交换成功！');

  const targetUrls = findAndExtractUrls();
  if (targetUrls.length === 0) {
    console.warn('⚠️ 未从 sitemap.xml 中提取到有效 URL。如刚构建完成，请确认 sitemap 文件位置。');
    return;
  }

  console.log(`📋 共发现 ${targetUrls.length} 个目标网址，开始向 Googlebot 发送更新通知:\n`);

  let successCount = 0;
  for (const [index, url] of targetUrls.entries()) {
    process.stdout.write(`[${index + 1}/${targetUrls.length}] 推送: ${url} ... `);
    const resp = await publishUrl(accessToken, url);
    if (resp.success) {
      console.log('✅ 成功 (HTTP 200)');
      successCount++;
    } else {
      console.log(`❌ 失败: ${resp.error}`);
    }
  }

  console.log(`\n🎉 推送执行完成: 成功 ${successCount}/${targetUrls.length} 个 URL。`);
  if (successCount < targetUrls.length) {
    console.log('💡 若出现 403 Permission Denied 错误，请在 Google Search Console 中将该服务账号添加为站点「所有者 (Owner)」。');
  }
}

main().catch(err => {
  console.error('\n❌ 执行异常中断:', err.message);
  process.exit(1);
});
