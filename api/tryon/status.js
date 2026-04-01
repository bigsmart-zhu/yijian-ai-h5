/**
 * 衣见AI - 换装任务状态查询
 * GET /api/tryon/status?taskId=xxx
 */

const crypto = require('crypto');

const ACCESS_KEY = process.env.LIBLIB_ACCESS_KEY || 'eNymY87RaksbJmGywqgboA';
const SECRET_KEY = process.env.LIBLIB_SECRET_KEY || 'tpdQpCbd2kRnU4s6N8odu7mXJmNj2ZyD';
const LIBLIB_BASE = 'https://openapi.liblibai.cloud';

function sign(uri) {
  const ts = String(Date.now());
  const nonce = Math.random().toString(36).substring(2, 12);
  const hmac = crypto.createHmac('sha1', SECRET_KEY);
  hmac.update(`${uri}&${ts}&${nonce}`);
  const sig = hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { sig, ts, nonce };
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { taskId } = req.query;
  if (!taskId) {
    return res.status(400).json({ error: '缺少 taskId' });
  }

  try {
    const uri = '/api/generate/webui/status';
    const { sig, ts, nonce } = sign(uri);
    const url = `${LIBLIB_BASE}${uri}?AccessKey=${ACCESS_KEY}&Signature=${sig}&Timestamp=${ts}&SignatureNonce=${nonce}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generateUuid: taskId }),
    });

    const data = await response.json();

    if (data.code !== 0) {
      return res.status(500).json({ error: data.msg || '查询失败' });
    }

    const { generateStatus, images, percentCompleted } = data.data;

    // generateStatus: 1=等待 2=生成中 3=完成 4=失败 5=超时
    if (generateStatus === 3 && images && images.length > 0) {
      return res.status(200).json({
        status: 'completed',
        imageUrl: images[0].imageUrl || images[0],
        progress: 100,
      });
    }

    if (generateStatus === 4 || generateStatus === 5) {
      return res.status(200).json({
        status: 'failed',
        error: generateStatus === 5 ? '生成超时' : '生成失败',
      });
    }

    // 生成中
    return res.status(200).json({
      status: 'processing',
      progress: percentCompleted || 0,
    });
  } catch (err) {
    console.error('[status] error:', err);
    return res.status(500).json({ error: err.message || '服务器错误' });
  }
};
