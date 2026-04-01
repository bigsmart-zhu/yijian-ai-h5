/**
 * 衣见AI - H5版 虚拟试衣间
 * 配置文件 - 请根据实际情况修改
 */

const CONFIG = {
  // API 代理地址（Vercel 部署后填写）
  // 本地开发: http://localhost:3000
  // 生产环境: /api
  API_BASE_URL: '/api',

  // 是否使用模拟模式（false = 使用真实 API）
  MOCK_MODE: false,

  // 模拟生成延迟（毫秒）
  MOCK_DELAY: 3000,

  // ===== 公众号配置 =====
  MP: {
    // 公众号名称
    name: '明天要去动物园了',
    // 公众号微信号（用于搜索）
    wechatId: 'zzw_Satan',
    // 是否显示关注引导（结果页CTA）
    showFollowCTA: true,
    // 微信 JS-SDK 签名 URL（部署后填入你的后端签名接口）
    // 留空则不启用自定义分享（使用 og meta 作为 fallback）
    jsApiSignUrl: '',
  },
};

// 模特数据
const MODEL_DATA = {
  girl: [
    {
      id: 'girl_1',
      name: '青春活力',
      desc: '清爽学院风',
      imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80',
    },
    {
      id: 'girl_2',
      name: '甜美可爱',
      desc: '元气少女感',
      imageUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80',
    },
    {
      id: 'girl_3',
      name: '运动阳光',
      desc: '活力运动风',
      imageUrl: 'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=400&q=80',
    },
  ],
  woman: [
    {
      id: 'woman_1',
      name: '都市精英',
      desc: '干练职场感',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    },
    {
      id: 'woman_2',
      name: '温柔气质',
      desc: '优雅日常风',
      imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
    },
    {
      id: 'woman_3',
      name: '时尚潮流',
      desc: '街头潮流感',
      imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&q=80',
    },
    {
      id: 'woman_4',
      name: '知性优雅',
      desc: '文艺知性风',
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
    },
  ],
  elder: [
    {
      id: 'elder_1',
      name: '优雅从容',
      desc: '端庄得体感',
      imageUrl: 'https://images.unsplash.com/photo-1566616213894-2d7d7fcfa5d8?w=400&q=80',
    },
    {
      id: 'elder_2',
      name: '活力银发',
      desc: '舒适休闲感',
      imageUrl: 'https://images.unsplash.com/photo-1581579185917-2d7d7fcfa5c3?w=400&q=80',
    },
    {
      id: 'elder_3',
      name: '知性长者',
      desc: '知性优雅风',
      imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
    },
  ],
};

const AGE_LABELS = {
  girl: '女孩',
  woman: '女士',
  elder: '中老年',
};

// 提示语
const TIPS = [
  '💡 正在读取衣物图片...',
  '🎨 AI 正在分析衣服特征...',
  '✂️ 精准匹配模特身材...',
  '🪄 正在合成试穿效果...',
  '📐 细节优化中...',
];

// 模拟效果图（测试用）
const MOCK_RESULT_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
];
