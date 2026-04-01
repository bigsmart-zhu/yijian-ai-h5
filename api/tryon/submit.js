/**
 * 衣见AI - 换装任务提交接口
 * POST /api/tryon/submit
 * 接收模特图 + 服装图（base64），上传到 Liblib，提交换装工作流
 */

const crypto = require('crypto');

const ACCESS_KEY = process.env.LIBLIB_ACCESS_KEY || 'eNymY87RaksbJmGywqgboA';
const SECRET_KEY = process.env.LIBLIB_SECRET_KEY || 'tpdQpCbd2kRnU4s6N8odu7mXJmNj2ZyD';
const LIBLIB_BASE = 'https://openapi.liblibai.cloud';

const TEMPLATE_UUID = '4df2efa0f18d46dc9758803e478eb51c';
const WORKFLOW_UUID = 'bc0c8c2b8060416badc3642dbb80d220';

// 生成签名
function sign(uri) {
  const ts = String(Date.now());
  const nonce = Math.random().toString(36).substring(2, 12);
  const hmac = crypto.createHmac('sha1', SECRET_KEY);
  hmac.update(`${uri}&${ts}&${nonce}`);
  const sig = hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { sig, ts, nonce };
}

// 上传图片到 Liblib（base64 → URL）
async function uploadImage(base64Data) {
  const uri = '/api/upload/image';
  const { sig, ts, nonce } = sign(uri);
  const url = `${LIBLIB_BASE}${uri}?AccessKey=${ACCESS_KEY}&Signature=${sig}&Timestamp=${ts}&SignatureNonce=${nonce}`;

  // 去掉 data:image/xxx;base64, 前缀
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`图片上传失败: ${data.msg || JSON.stringify(data)}`);
  }
  return data.data.imageUrl;
}

// 提交换装工作流
async function submitWorkflow(modelImageUrl, garmentImageUrl) {
  const uri = '/api/generate/comfyui/app';
  const { sig, ts, nonce } = sign(uri);
  const url = `${LIBLIB_BASE}${uri}?AccessKey=${ACCESS_KEY}&Signature=${sig}&Timestamp=${ts}&SignatureNonce=${nonce}`;

  const body = {
    templateUuid: TEMPLATE_UUID,
    generateParams: {
      '194': {
        class_type: 'LoadImage',
        inputs: { image: modelImageUrl },
      },
      '196': {
        class_type: 'LoadImage',
        inputs: { image: garmentImageUrl },
      },
      workflowUuid: WORKFLOW_UUID,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`提交任务失败: ${data.msg || JSON.stringify(data)}`);
  }
  return data.data.generateUuid;
}

// 主处理函数
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { modelImage, garmentImage } = req.body;

    if (!modelImage || !garmentImage) {
      return res.status(400).json({ error: '缺少模特图或服装图' });
    }

    // 上传两张图片
    const [modelUrl, garmentUrl] = await Promise.all([
      uploadImage(modelImage),
      uploadImage(garmentImage),
    ]);

    // 提交换装任务
    const taskId = await submitWorkflow(modelUrl, garmentUrl);

    return res.status(200).json({ taskId });
  } catch (err) {
    console.error('[submit] error:', err);
    return res.status(500).json({ error: err.message || '服务器错误' });
  }
};
