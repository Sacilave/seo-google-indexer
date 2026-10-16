import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';

let activeProxy = null;

/**
 * 智能网络代理检测（零外部依赖，自动适配本地 Clash / Mihomo / v2ray 端口）
 */
async function setupProxy() {
  const envProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
  if (envProxy) {
    try {
      const u = new URL(envProxy);
      activeProxy = { host: u.hostname, port: parseInt(u.port, 10) };
      console.log(`🌐 [Proxy] 已加载系统环境变量代理: ${envProxy}`);
      return;
    } catch {}
  }

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

  for (const port of [7897, 7890, 10809, 10808]) {
    if (await probePort(port)) {
      activeProxy = { host: '127.0.0.1', port };
      console.log(`🌐 [Proxy] 已自动适配网络代理通道: 127.0.0.1:${port}`);
      break;
    }
  }
}

/**
 * 统一网络请求客户端：无需 undici，原生纯 Node.js 支持 HTTP CONNECT 隧道代理
 */
function requestUrl(urlStr, options = {}) {
  const targetUrl = new URL(urlStr);

  if (!activeProxy) {
    return fetch(urlStr, options);
  }

  return new Promise((resolve, reject) => {
    const isHttps = targetUrl.protocol === 'https:';
    const targetPort = targetUrl.port || (isHttps ? 443 : 80);

    const connectReq = http.request({
      host: activeProxy.host,
      port: activeProxy.port,
      method: 'CONNECT',
      path: `${targetUrl.hostname}:${targetPort}`
    });

    connectReq.on('connect', (res, socket) => {
      let clientReq;
      const onResponse = (clientRes) => {
        const chunks = [];
        clientRes.on('data', (c) => chunks.push(c));
        clientRes.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const text = buffer.toString('utf8');
          resolve({
            ok: clientRes.statusCode >= 200 && clientRes.statusCode < 300,
            status: clientRes.statusCode,
            text: async () => text,
            json: async () => JSON.parse(text)
          });
        });
      };

      if (isHttps) {
        const tlsSocket = tls.connect(
          {
            host: targetUrl.hostname,
            socket: socket,
            servername: targetUrl.hostname
          },
          () => {
            clientReq = https.request(
              targetUrl,
              {
                method: options.method || 'GET',
                headers: options.headers || {},
                createConnection: () => tlsSocket
              },
              onResponse
            );
            clientReq.on('error', reject);
            if (options.body) clientReq.write(options.body);
            clientReq.end();
          }
        );
        tlsSocket.on('error', reject);
      } else {
        clientReq = http.request(
          targetUrl,
          {
            method: options.method || 'GET',
            headers: options.headers || {},
            createConnection: () => socket
          },
          onResponse
        );
        clientReq.on('error', reject);
        if (options.body) clientReq.write(options.body);
        clientReq.end();
      }
    });

    connectReq.on('error', (err) => {
      console.warn(`⚠️ 代理连接失败 (${err.message})，正在尝试直连...`);
      fetch(urlStr, options).then(resolve).catch(reject);
    });

    connectReq.end();
  });
}

/**
 * 延迟函数（用于防并发限频）
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 读取 Google 服务账号凭据
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
 * 原生 JWT 交换 Google access_token
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

  const res = await requestUrl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString()
  });

  if (!res.ok) {
    throw new Error(`Google OAuth2 Token 获取失败 (HTTP ${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

/**
 * 从 XML 内容中提取 URL，并递归处理嵌套的 sitemap 索引文件
 */
async function parseSitemapXml(xmlContent, baseUrl = '') {
  const urls = [];
  const sitemapIndices = [];

  const sitemapIndexRegex = /<sitemap>[\s\S]*?<loc>(https?:\/\/[^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi;
  let sitemapMatch;
  while ((sitemapMatch = sitemapIndexRegex.exec(xmlContent)) !== null) {
    sitemapIndices.push(sitemapMatch[1].trim());
  }

  if (sitemapIndices.length > 0) {
    console.log(`📑 检测到 Sitemap 索引文件，包含 ${sitemapIndices.length} 个子地图，开始展开解析...`);
    for (const subSitemapUrl of sitemapIndices) {
      try {
        console.log(`  ↳ 拉取子地图: ${subSitemapUrl}`);
        const res = await requestUrl(subSitemapUrl);
        if (res.ok) {
          const subXml = await res.text();
          const subUrls = await parseSitemapXml(subXml, subSitemapUrl);
          for (const u of subUrls) {
            if (!urls.includes(u)) urls.push(u);
          }
        }
      } catch (e) {
        console.warn(`  ⚠️ 拉取子地图失败: ${subSitemapUrl} (${e.message})`);
      }
    }
    return urls;
  }

  const urlRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/gi;
  let match;
  while ((match = urlRegex.exec(xmlContent)) !== null) {
    const rawUrl = match[1].trim();
    if (!rawUrl.endsWith('.xml') && !urls.includes(rawUrl)) {
      urls.push(rawUrl);
    }
  }
  return urls;
}

/**
 * 智能解析 URL 目标
 */
async function resolveTargetUrls(inputArg) {
  if (inputArg && /^https?:\/\//i.test(inputArg) && !inputArg.toLowerCase().includes('sitemap') && !inputArg.endsWith('.xml')) {
    console.log(`🎯 识别为单 URL 即时推送模式: ${inputArg}`);
    return [inputArg];
  }

  if (inputArg && /^https?:\/\//i.test(inputArg)) {
    console.log(`🌐 正在从线上站点地图拉取 URL 列表: ${inputArg}`);
    const res = await requestUrl(inputArg);
    if (!res.ok) throw new Error(`拉取线上 sitemap 失败 (HTTP ${res.status}): ${await res.text()}`);
    const xml = await res.text();
    return await parseSitemapXml(xml, inputArg);
  }

  const candidatePaths = inputArg
    ? [path.resolve(process.cwd(), inputArg)]
    : [
        path.resolve(process.cwd(), 'public', 'sitemap.xml'),
        path.resolve(process.cwd(), 'dist', 'sitemap.xml'),
        path.resolve(process.cwd(), 'dist', 'client', 'sitemap.xml'),
        path.resolve(process.cwd(), 'dist', 'sitemap-index.xml'),
        path.resolve(process.cwd(), 'public', 'sitemap-index.xml'),
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
    console.warn(`⚠️ 未检测到有效 sitemap.xml。已检索路径:\n${candidatePaths.map((p) => `  - ${p}`).join('\n')}`);
    return [];
  }

  console.log(`🗺️ 加载本地站点地图: ${chosenPath}`);
  const content = fs.readFileSync(chosenPath, 'utf8');
  return await parseSitemapXml(content);
}

/**
 * 推送单条 URL
 */
async function publishUrl(accessToken, url, retryCount = 0) {
  try {
    const res = await requestUrl('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, type: 'URL_UPDATED' })
    });

    if (res.status === 429 && retryCount < 2) {
      console.warn(`\n  ⚠️ 触发 API 频控 (429)，等待 2 秒后自动重试...`);
      await sleep(2000);
      return await publishUrl(accessToken, url, retryCount + 1);
    }

    if (!res.ok) {
      return { success: false, status: res.status, error: await res.text() };
    }
    return { success: true };
  } catch (err) {
    if (retryCount < 2) {
      await sleep(1500);
      return await publishUrl(accessToken, url, retryCount + 1);
    }
    return { success: false, status: 0, error: err.message };
  }
}

/**
 * 诊断命令
 */
async function runDoctor() {
  console.log('\n🩺 [Google Indexer Doctor] 正在诊断系统环境...');
  console.log(`  - Node.js 版本: ${process.version} (>= 18.0.0: ${parseInt(process.version.slice(1)) >= 18 ? '✅ 通过' : '❌ 请升级 Node.js'})`);

  await setupProxy();

  let creds;
  try {
    creds = getCredentials();
    console.log(`  - 凭据检测: ✅ 成功读取 (${creds.client_email})`);
  } catch (e) {
    console.log(`  - 凭据检测: ❌ ${e.message}`);
    return;
  }

  try {
    const token = await getAccessToken(creds);
    console.log(`  - Google 身份验证与连通性: ✅ 交换 Token 成功！(Token 前 8 位: ${token.substring(0, 8)}...)`);
    console.log(`\n🎉 诊断通过！请确保在 GSC (Google Search Console) 中已将以下邮箱设为站点「所有者 (Owner)」:`);
    console.log(`👉 \x1b[32m${creds.client_email}\x1b[0m\n`);
  } catch (e) {
    console.log(`  - Google 身份验证: ❌ 失败: ${e.message}`);
  }
}

/**
 * 命令行执行入口
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--doctor') || args.includes('doctor')) {
    await runDoctor();
    return;
  }

  const isDryRun = args.includes('--dry-run');
  const cleanArgs = args.filter((arg) => !arg.startsWith('--'));
  const inputTarget = cleanArgs[0];

  console.log('🚀 [Google Indexer] 正在初始化收录推送任务...');
  await setupProxy();

  const credentials = getCredentials();
  console.log(`🔑 已就绪服务账号: ${credentials.client_email}`);

  let accessToken = null;
  if (!isDryRun) {
    accessToken = await getAccessToken(credentials);
    console.log('✅ Google 授权凭据交换成功！');
  } else {
    console.log('🔍 [DRY-RUN 演练模式] 不会产生真实 API 消耗。');
  }

  let targetUrls = await resolveTargetUrls(inputTarget);
  if (targetUrls.length === 0) {
    console.warn('⚠️ 未提取到有效 URL。如刚构建完成，请确认 sitemap 文件位置或直接传入线上 sitemap 链接。');
    return;
  }

  const DAILY_QUOTA_LIMIT = 200;
  if (targetUrls.length > DAILY_QUOTA_LIMIT) {
    console.warn(`\n⚠️ [配额警告] 共检测到 ${targetUrls.length} 个 URL，超过 Google 默认单日 200 条限制！`);
    console.warn(`🛡️ [安全保护] 本次将自动截取前 ${DAILY_QUOTA_LIMIT} 个 URL 执行推送，剩余页面建议次日再推。\n`);
    targetUrls = targetUrls.slice(0, DAILY_QUOTA_LIMIT);
  } else {
    console.log(`📋 共发现 ${targetUrls.length} 个目标网址，准备向 Googlebot 发送更新通知:\n`);
  }

  if (isDryRun) {
    console.log('--- 将要推送的 URL 预览 (前 10 条) ---');
    targetUrls.slice(0, 10).forEach((u, i) => console.log(`  [${i + 1}] ${u}`));
    if (targetUrls.length > 10) console.log(`  ... 剩余 ${targetUrls.length - 10} 条已略过`);
    console.log(`\n🎉 [DRY-RUN 完成] 演练正常，去掉 --dry-run 参数即可执行真实推送。`);
    return;
  }

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

    if (index < targetUrls.length - 1) {
      await sleep(150);
    }
  }

  console.log(`\n🎉 推送执行完成: 成功 ${successCount}/${targetUrls.length} 个 URL。`);
  if (successCount < targetUrls.length) {
    console.log('\n💡 提示：若出现 403 Permission Denied 错误，请在 Google Search Console 中将该邮箱添加为站点「所有者 (Owner)」:');
    console.log(`👉 \x1b[32m${credentials.client_email}\x1b[0m`);
  }
}

main().catch((err) => {
  console.error('\n❌ 执行异常中断:', err.message);
  process.exit(1);
});
