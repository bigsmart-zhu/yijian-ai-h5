/**
 * 衣见AI - H5版 虚拟试衣间
 * 主应用逻辑
 */

const app = {
  // 状态
  state: {
    currentPage: 'index-page',
    selectedAge: '',
    selectedModel: null,
    isCustomModel: false,
    customModelImage: null,
    customModelFile: null,
    uploadedItems: {
      top: null,    // { file: File, url: dataURL }
      bottom: null,
      shoes: null,
    },
    modelImageUrl: '',
    resultImageUrl: '',
  },

  // 初始化
  init() {
    this.bindEvents();
    this._initMPConfig();
  },

  // 事件绑定
  bindEvents() {
    // 文件选择回调
    document.getElementById('file-input').addEventListener('change', (e) => {
      if (this._fileCallback && e.target.files[0]) {
        this._fileCallback(e.target.files[0]);
      }
      // 重置以允许重复选择同一文件
      e.target.value = '';
    });
  },

  // 当前文件选择回调
  _fileCallback: null,
  _pendingUploadType: null,

  // === 页面导航 ===

  navigateTo(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // 显示目标页面
    document.getElementById(pageId).classList.add('active');
    this.state.currentPage = pageId;

    // 滚动到顶部
    window.scrollTo(0, 0);
  },

  // === 首页逻辑 ===

  selectAge(age, el) {
    this.state.selectedAge = age;

    // 更新 UI
    document.querySelectorAll('.age-card').forEach(card => {
      card.classList.remove('active');
    });
    if (el) el.classList.add('active');
  },

  toModelSelect() {
    if (!this.state.selectedAge) {
      this.showToast('请先选择模特类型');
      return;
    }
    this.state.isCustomModel = false;
    this._renderModelGrid();
    this.navigateTo('model-select-page');
  },

  goCustomModel() {
    this.state.isCustomModel = true;
    // 重置自定义模特状态
    this.state.customModelImage = null;
    this.state.customModelFile = null;
    this.state.uploadedItems = { top: null, bottom: null, shoes: null };

    this._renderCustomPage();
    this.navigateTo('custom-upload-page');
  },

  // === 模特选择 ===

  _renderModelGrid() {
    const age = this.state.selectedAge;
    const models = MODEL_DATA[age] || [];

    // 更新标题
    document.getElementById('age-label').textContent = (AGE_LABELS[age] || '') + '模特';

    // 渲染模特卡片
    const grid = document.getElementById('model-grid');
    grid.innerHTML = models.map(model => `
      <div class="model-card" onclick="app.selectModel('${model.id}')" data-id="${model.id}">
        <div class="check-badge" style="display: none;">✓</div>
        <img class="model-image" src="${model.imageUrl}" alt="${model.name}" loading="lazy">
        <div class="model-info">
          <div class="model-name">${model.name}</div>
          <div class="model-desc">${model.desc}</div>
        </div>
      </div>
    `).join('');

    // 重置选择
    this.state.selectedModel = null;
  },

  selectModel(modelId) {
    const age = this.state.selectedAge;
    const model = (MODEL_DATA[age] || []).find(m => m.id === modelId);
    if (!model) return;

    this.state.selectedModel = model;
    this.state.modelImageUrl = model.imageUrl;

    // 更新 UI
    document.querySelectorAll('.model-card').forEach(card => {
      const isSelected = card.dataset.id === modelId;
      card.classList.toggle('active', isSelected);
      card.querySelector('.check-badge').style.display = isSelected ? 'flex' : 'none';
    });
  },

  toUpload() {
    if (!this.state.selectedModel) {
      this.showToast('请先选择一位模特');
      return;
    }

    // 更新上传页模特预览
    document.getElementById('model-preview-img').src = this.state.selectedModel.imageUrl;
    document.getElementById('model-preview-name').textContent = this.state.selectedModel.name;
    document.getElementById('model-preview-age').textContent = AGE_LABELS[this.state.selectedAge] || '';

    // 重置上传状态
    this.state.uploadedItems = { top: null, bottom: null, shoes: null };
    this._renderUploadPage();

    this.navigateTo('upload-page');
  },

  // === 上传衣服（系统模特模式）===

  _renderUploadPage() {
    ['top', 'bottom', 'shoes'].forEach(type => {
      const box = document.getElementById(`upload-${type}-box`);
      const uploaded = document.getElementById(`uploaded-${type}`);
      const img = document.getElementById(`uploaded-${type}-img`);

      if (this.state.uploadedItems[type]) {
        box.style.display = 'none';
        uploaded.style.display = 'block';
        img.src = this.state.uploadedItems[type].url;
      } else {
        box.style.display = 'flex';
        uploaded.style.display = 'none';
      }
    });

    this._updateGenerateButton();
  },

  uploadImage(type) {
    this._pendingUploadType = type;
    this._fileCallback = (file) => {
      this._handleImageFile(file, type, 'system');
    };
    document.getElementById('file-input').click();
  },

  removeImage(type) {
    this.state.uploadedItems[type] = null;
    this._renderUploadPage();
  },

  // === 自定义模特页 ===

  _renderCustomPage() {
    this._updateCustomSteps();
    this._updateCustomClothing();
  },

  uploadModelImage() {
    this._fileCallback = (file) => {
      this._handleCustomModelFile(file);
    };
    document.getElementById('file-input').click();
  },

  _handleCustomModelFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.state.customModelImage = e.target.result;
      this.state.customModelFile = file;
      this.state.modelImageUrl = e.target.result;

      // 更新 UI
      document.getElementById('model-upload-zone').style.display = 'none';
      document.getElementById('model-preview-box').style.display = 'block';
      document.getElementById('model-preview-custom').src = e.target.result;

      this._updateCustomSteps();
      this._updateCustomClothing();
    };
    reader.readAsDataURL(file);
  },

  removeModelImage() {
    this.state.customModelImage = null;
    this.state.customModelFile = null;
    this.state.modelImageUrl = '';

    document.getElementById('model-upload-zone').style.display = 'flex';
    document.getElementById('model-preview-box').style.display = 'none';

    this._updateCustomSteps();
    this._updateCustomClothing();
  },

  uploadClothing(type) {
    if (!this.state.customModelImage) {
      this.showToast('请先上传模特图');
      return;
    }
    this._fileCallback = (file) => {
      this._handleImageFile(file, type, 'custom');
    };
    document.getElementById('file-input').click();
  },

  removeClothing(type) {
    this.state.uploadedItems[type] = null;
    this._updateCustomClothing();
    this._updateCustomSteps();
  },

  _updateCustomSteps() {
    const hasModel = !!this.state.customModelImage;
    const hasClothes = !!(this.state.uploadedItems.top || this.state.uploadedItems.bottom || this.state.uploadedItems.shoes);
    const canGenerate = hasModel && hasClothes;

    const stepModel = document.getElementById('step-model-custom');
    const stepClothes = document.getElementById('step-clothes-custom');
    const stepGenerate = document.getElementById('step-generate-custom');

    // 模特步骤
    if (hasModel) {
      stepModel.className = 'step-custom done';
      stepModel.querySelector('.step-num-custom').textContent = '✓';
    } else {
      stepModel.className = 'step-custom active';
      stepModel.querySelector('.step-num-custom').textContent = '1';
    }

    // 服装步骤
    if (hasClothes) {
      stepClothes.className = 'step-custom done';
      stepClothes.querySelector('.step-num-custom').textContent = '✓';
    } else if (hasModel) {
      stepClothes.className = 'step-custom active';
      stepClothes.querySelector('.step-num-custom').textContent = '2';
    } else {
      stepClothes.className = 'step-custom';
      stepClothes.querySelector('.step-num-custom').textContent = '2';
    }

    // 生成步骤
    if (canGenerate) {
      stepGenerate.className = 'step-custom active';
      stepGenerate.querySelector('.step-num-custom').textContent = '3';
    } else {
      stepGenerate.className = 'step-custom';
      stepGenerate.querySelector('.step-num-custom').textContent = '3';
    }

    // 更新按钮
    const btn = document.getElementById('btn-generate-custom');
    if (!hasModel) {
      btn.textContent = '请先上传模特图';
      btn.disabled = true;
    } else if (!hasClothes) {
      btn.textContent = '请上传至少一件服装';
      btn.disabled = true;
    } else {
      btn.textContent = '✨ 开始 AI 换装';
      btn.disabled = false;
    }
  },

  _updateCustomClothing() {
    ['top', 'bottom', 'shoes'].forEach(type => {
      const cell = document.getElementById(`upload-cell-${type}`);
      const preview = document.getElementById(`preview-cell-${type}`);
      const img = document.getElementById(`cell-img-${type}`);

      if (this.state.uploadedItems[type]) {
        cell.style.display = 'none';
        preview.style.display = 'block';
        img.src = this.state.uploadedItems[type].url;
      } else {
        cell.style.display = 'flex';
        cell.classList.toggle('disabled', !this.state.customModelImage);
        preview.style.display = 'none';
      }
    });
  },

  // === 通用图片处理 ===

  _handleImageFile(file, type, mode) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.state.uploadedItems[type] = {
        file: file,
        url: e.target.result,
      };

      if (mode === 'system') {
        this._renderUploadPage();
      } else {
        this._updateCustomClothing();
        this._updateCustomSteps();
      }
    };
    reader.readAsDataURL(file);
  },

  _updateGenerateButton() {
    const hasClothes = !!(this.state.uploadedItems.top || this.state.uploadedItems.bottom || this.state.uploadedItems.shoes);
    const btn = document.getElementById('btn-generate');
    btn.disabled = !hasClothes;
  },

  // === 生成换装效果 ===

  startGenerate() {
    const clothFile = this.state.uploadedItems.top || this.state.uploadedItems.bottom || this.state.uploadedItems.shoes;
    if (!clothFile) {
      this.showToast('请先上传衣物图片');
      return;
    }

    this._startGenerating(
      this.state.selectedModel.imageUrl,
      clothFile.url,
      clothFile.file
    );
  },

  startGenerateCustom() {
    const clothFile = this.state.uploadedItems.top || this.state.uploadedItems.bottom || this.state.uploadedItems.shoes;
    if (!this.state.customModelImage || !clothFile) {
      this.showToast('请完善模特图和服装');
      return;
    }

    this._startGenerating(
      this.state.customModelImage,
      clothFile.url,
      clothFile.file
    );
  },

  async _startGenerating(modelImageUrl, garmentImageUrl, garmentFile) {
    this.navigateTo('generating-page');

    const tips = TIPS;
    let tipIndex = 0;

    // 开始提示语轮换
    const tipTimer = setInterval(() => {
      tipIndex = (tipIndex + 1) % tips.length;
      document.getElementById('tip-text').textContent = tips[tipIndex];
    }, 3000);

    try {
      if (CONFIG.MOCK_MODE) {
        // 模拟模式
        await this._simulateGeneration();
      } else {
        // 真实 API 模式
        await this._callRealAPI(modelImageUrl, garmentImageUrl, garmentFile);
      }
    } catch (err) {
      clearInterval(tipTimer);
      this.showToast('生成失败: ' + (err.message || '请重试'));
      setTimeout(() => {
        this.goBack();
      }, 1500);
      return;
    }

    clearInterval(tipTimer);
  },

  // 模拟生成
  async _simulateGeneration() {
    const updateStatus = (step, title, progress) => {
      document.getElementById('status-title').textContent = title;
      document.getElementById('status-progress').textContent = progress;

      for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        stepEl.classList.remove('done', 'active');
        if (i < step) stepEl.classList.add('done');
        if (i === step) stepEl.classList.add('active');
      }
      for (let i = 1; i <= 2; i++) {
        const lineEl = document.getElementById(`step-line-${i}`);
        lineEl.classList.toggle('done', i < step);
      }
    };

    // Step 1
    updateStatus(1, '读取图片中...', '正在分析图片');
    await this._delay(800);

    // Step 2
    updateStatus(2, 'AI分析中...', '正在识别服装特征');
    await this._delay(1200);

    // Step 3
    updateStatus(3, '生成效果中...', '正在合成试穿效果');
    document.getElementById('status-progress').textContent = '请耐心等待...';
    await this._delay(CONFIG.MOCK_DELAY - 2000);

    // 完成
    updateStatus(3, '完成！', '效果图已就绪 ✨');

    // 选择一个模拟结果图
    const mockUrl = MOCK_RESULT_IMAGES[Math.floor(Math.random() * MOCK_RESULT_IMAGES.length)];
    this.state.resultImageUrl = mockUrl;

    await this._delay(500);
    this._showResult();
  },

  // 调用真实 API
  async _callRealAPI(modelImageUrl, garmentImageUrl, garmentFile) {
    const updateStatus = (step, title, progress) => {
      document.getElementById('status-title').textContent = title;
      document.getElementById('status-progress').textContent = progress;

      for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        stepEl.classList.remove('done', 'active');
        if (i < step) stepEl.classList.add('done');
        if (i === step) stepEl.classList.add('active');
      }
      for (let i = 1; i <= 2; i++) {
        const lineEl = document.getElementById(`step-line-${i}`);
        lineEl.classList.toggle('done', i < step);
      }
    };

    if (!CONFIG.API_BASE_URL) {
      throw new Error('API 地址未配置，请在 config.js 中设置 API_BASE_URL');
    }

    // Step 1: 上传图片
    updateStatus(1, '上传图片中...', '正在上传模特和衣物图片');

    // Step 2: 提交任务
    updateStatus(2, '提交任务中...', '正在提交换装任务');

    const submitRes = await fetch(`${CONFIG.API_BASE_URL}/api/tryon/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelImage: modelImageUrl,
        garmentImage: garmentImageUrl,
      }),
    });

    if (!submitRes.ok) {
      const errData = await submitRes.json().catch(() => ({}));
      throw new Error(errData.error || '提交任务失败');
    }

    const submitData = await submitRes.json();
    const taskId = submitData.taskId;

    // Step 3: 轮询结果
    updateStatus(3, '生成效果中...', 'AI正在合成，请稍候...');

    const maxWait = 300000; // 5分钟
    const pollInterval = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const statusRes = await fetch(`${CONFIG.API_BASE_URL}/api/tryon/status?taskId=${taskId}`);
      if (!statusRes.ok) throw new Error('查询状态失败');

      const statusData = await statusRes.json();

      if (statusData.status === 'completed' && statusData.imageUrl) {
        this.state.resultImageUrl = statusData.imageUrl;
        updateStatus(3, '完成！', '效果图已就绪 ✨');
        await this._delay(500);
        this._showResult();
        return;
      }

      if (statusData.status === 'failed') {
        throw new Error(statusData.error || '生成失败');
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(90, Math.floor((elapsed / maxWait) * 90));
      document.getElementById('status-progress').textContent = `生成中 ${progress}%...`;

      await this._delay(pollInterval);
    }

    throw new Error('生成超时（5分钟）');
  },

  // === 结果页 ===

  _showResult() {
    document.getElementById('result-image').src = this.state.resultImageUrl;
    document.getElementById('compare-model').src = this.state.modelImageUrl;
    document.getElementById('compare-result').src = this.state.resultImageUrl;

    this.navigateTo('result-page');
  },

  saveImage() {
    const url = this.state.resultImageUrl;
    if (!url) return;

    // H5 方式：创建 a 标签下载
    const a = document.createElement('a');
    a.href = url;
    a.download = `衣见AI_试穿效果_${Date.now()}.jpg`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    // 如果是跨域图片，需要先 canvas 绘制再下载
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        this.showToast('图片已保存');
      }, 'image/jpeg', 0.95);
    };
    img.onerror = () => {
      // 跨域失败，直接打开链接
      window.open(url, '_blank');
      this.showToast('已打开图片，请长按保存');
    };
    img.src = url;
  },

  tryAgain() {
    // 重置上传状态，保留模特
    this.state.uploadedItems = { top: null, bottom: null, shoes: null };

    if (this.state.isCustomModel) {
      this._renderCustomPage();
      this.navigateTo('custom-upload-page');
    } else {
      this._renderUploadPage();
      this.navigateTo('upload-page');
    }
  },

  goHome() {
    // 重置所有状态
    this.state.selectedAge = '';
    this.state.selectedModel = null;
    this.state.isCustomModel = false;
    this.state.customModelImage = null;
    this.state.customModelFile = null;
    this.state.uploadedItems = { top: null, bottom: null, shoes: null };
    this.state.modelImageUrl = '';
    this.state.resultImageUrl = '';

    // 重置首页 UI
    document.querySelectorAll('.age-card').forEach(card => card.classList.remove('active'));

    this.navigateTo('index-page');
  },

  goBack() {
    const pageOrder = [
      'index-page',
      'model-select-page',
      'upload-page',
      'generating-page',
      'result-page',
      'custom-upload-page',
    ];

    const currentIndex = pageOrder.indexOf(this.state.currentPage);
    if (currentIndex > 0) {
      this.navigateTo(pageOrder[currentIndex - 1]);
    }
  },

  // === 工具函数 ===

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // ===== 公众号引导 =====

  showFollowGuide() {
    const modal = document.getElementById('follow-modal');
    if (modal) modal.classList.add('active');
  },

  closeFollowGuide() {
    const modal = document.getElementById('follow-modal');
    if (modal) modal.classList.remove('active');
  },

  // 初始化公众号配置
  _initMPConfig() {
    if (!CONFIG.MP || !CONFIG.MP.showFollowCTA) {
      // 隐藏关注CTA
      const cta = document.getElementById('cta-follow');
      if (cta) cta.style.display = 'none';
      return;
    }

    // 填充公众号名称
    const mpName = CONFIG.MP.name || '衣见AI实验室';
    const mpSearch = CONFIG.MP.wechatId || mpName;

    const nameEl = document.getElementById('follow-mp-name');
    if (nameEl) nameEl.textContent = mpName;

    const searchEl = document.getElementById('follow-mp-search');
    if (searchEl) searchEl.textContent = '「' + mpName + '」';

    // 检测微信环境
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);

    if (isWechat && CONFIG.MP.jsApiSignUrl) {
      // 微信环境 + 有签名接口 → 初始化自定义分享
      this._initWechatShare();
    }
  },

  // 微信 JS-SDK 自定义分享（需要后端提供签名）
  _initWechatShare() {
    // 动态加载微信 JS-SDK
    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.onload = () => {
      fetch(CONFIG.MP.jsApiSignUrl + '?url=' + encodeURIComponent(location.href.split('#')[0]))
        .then(r => r.json())
        .then(data => {
          wx.config({
            debug: false,
            appId: data.appId,
            timestamp: data.timestamp,
            nonceStr: data.nonceStr,
            signature: data.signature,
            jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
          });
          wx.ready(() => {
            wx.updateAppMessageShareData({
              title: '衣见AI - AI虚拟试衣间',
              desc: '上传衣服，AI帮你秒看上身效果！免下载，打开就能用',
              link: location.href,
              imgUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
            });
            wx.updateTimelineShareData({
              title: '衣见AI - AI虚拟试衣间',
              link: location.href,
              imgUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
            });
          });
        })
        .catch(() => {});
    };
    document.head.appendChild(script);
  },

  _dataURLtoBlob(dataURL) {
    return new Promise((resolve) => {
      const parts = dataURL.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      resolve(new Blob([u8arr], { type: mime }));
    });
  },

  showToast(msg, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, duration);
  },
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
