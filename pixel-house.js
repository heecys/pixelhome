/**
 * 像素小屋 — Roche 插件 v4.1.0
 * 重构版：宽景房间滑动平移、丰富角色对话系统、可拖动多样式窗户、精致 UI 与流畅交互
 * 功能：角色选择、房间装修、家具拖拽缩放旋转、墙纸地板切换、自定义素材上传、角色立绘更换
 */
;(function () {
  'use strict'

  // ========== 常量 ==========
  var ROOM_WIDTH_RATIO = 2.4 // 房间宽度是视口的 2.4 倍，支持横向滑动
  var FLOOR_HORIZON = 65     // 地板从 65% 处开始

  var WALLPAPER_PRESETS = [
    { name: '温馨暖白', value: 'radial-gradient(circle at 50% 50%, #fdfbf7 0%, #e2e8f0 100%)' },
    { name: '深夜蓝调', value: 'linear-gradient(to bottom, #1e293b 0%, #0f172a 100%)' },
    { name: '少女粉', value: 'radial-gradient(circle at 50% 50%, #fff1f2 0%, #ffe4e6 100%)' },
    { name: '极简灰', value: 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)' },
    { name: '木质感', value: 'repeating-linear-gradient(45deg, #f7fee7 0px, #f7fee7 10px, #ecfccb 10px, #ecfccb 20px)' },
    { name: '薰衣草', value: 'radial-gradient(circle at 50% 50%, #f3e8ff 0%, #e9d5ff 100%)' },
    { name: '薄荷绿', value: 'radial-gradient(circle at 50% 50%, #d1fae5 0%, #a7f3d0 100%)' },
    { name: '奶油黄', value: 'radial-gradient(circle at 50% 50%, #fef9c3 0%, #fde68a 100%)' },
  ]

  var FLOOR_PRESETS = [
    { name: '浅色木板', value: 'repeating-linear-gradient(90deg, #e7e5e4 0px, #e7e5e4 20px, #d6d3d1 21px)' },
    { name: '深色木板', value: 'repeating-linear-gradient(90deg, #78350f 0px, #78350f 20px, #451a03 21px)' },
    { name: '格纹地砖', value: 'conic-gradient(from 90deg at 2px 2px, #0000 90deg, #cbd5e1 0) 0 0/30px 30px' },
    { name: '素色地毯', value: '#d1d5db' },
    { name: '粉色地毯', value: 'repeating-linear-gradient(90deg, #fce7f3 0px, #fce7f3 20px, #fbcfe8 21px)' },
    { name: '大理石', value: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)' },
  ]

  var FURNITURE_PRESETS = {
    furniture: [
      { name: '床', emoji: '🛏️', defaultScale: 1.6 },
      { name: '沙发', emoji: '🛋️', defaultScale: 1.5 },
      { name: '椅子', emoji: '🪑', defaultScale: 1.0 },
      { name: '桌子', emoji: '🪵', defaultScale: 1.3 },
      { name: '书桌', emoji: '🖥️', defaultScale: 1.3 },
      { name: '书架', emoji: '📚', defaultScale: 1.2 },
      { name: '衣柜', emoji: '🚪', defaultScale: 1.4 },
      { name: '冰箱', emoji: '🧊', defaultScale: 1.1 },
    ],
    decor: [
      { name: '盆栽', emoji: '🪴', defaultScale: 0.8 },
      { name: '台灯', emoji: '💡', defaultScale: 0.8 },
      { name: '画', emoji: '🖼️', defaultScale: 1.0 },
      { name: '时钟', emoji: '🕐', defaultScale: 0.7 },
      { name: '吉他', emoji: '🎸', defaultScale: 1.0 },
      { name: '游戏机', emoji: '🎮', defaultScale: 0.7 },
      { name: '花瓶', emoji: '💐', defaultScale: 0.7 },
      { name: '蜡烛', emoji: '🕯️', defaultScale: 0.6 },
    ],
    food: [
      { name: '咖啡', emoji: '☕', defaultScale: 0.5 },
      { name: '蛋糕', emoji: '🎂', defaultScale: 0.6 },
      { name: '披萨', emoji: '🍕', defaultScale: 0.7 },
      { name: '苹果', emoji: '🍎', defaultScale: 0.5 },
      { name: '甜甜圈', emoji: '🍩', defaultScale: 0.5 },
    ],
    rug: [
      { name: '条纹地毯', emoji: '🟫', defaultScale: 1.8, isRug: true },
      { name: '圆形地毯', emoji: '⭕', defaultScale: 1.8, isRug: true },
    ],
  }

  var CATEGORY_LABELS = {
    furniture: '家具',
    decor: '装饰',
    food: '食物',
    rug: '地毯',
    custom: '自定义',
  }

  // 窗户样式预设
  var WINDOW_PRESETS = [
    {
      name: '蓝天白云',
      width: 180, height: 220,
      bg: 'linear-gradient(to bottom, #a8d8ea 0%, #c5e4f5 40%, #e8f4fc 100%)',
      frame: 'rgba(255,255,255,0.8)',
      cross: true,
      cloud: true,
    },
    {
      name: '日落暖光',
      width: 180, height: 220,
      bg: 'linear-gradient(to bottom, #ffd89b 0%, #ff9a76 50%, #ff6b6b 100%)',
      frame: 'rgba(120,80,40,0.7)',
      cross: true,
      cloud: false,
    },
    {
      name: '星空夜窗',
      width: 180, height: 220,
      bg: 'linear-gradient(to bottom, #0f172a 0%, #1e3a5f 60%, #2d4a7c 100%)',
      frame: 'rgba(200,200,220,0.5)',
      cross: true,
      cloud: false,
      stars: true,
    },
    {
      name: '青翠花园',
      width: 180, height: 220,
      bg: 'linear-gradient(to bottom, #86efac 0%, #4ade80 50%, #16a34a 100%)',
      frame: 'rgba(255,255,255,0.75)',
      cross: true,
      cloud: false,
    },
    {
      name: '圆拱窗',
      width: 160, height: 240,
      bg: 'linear-gradient(to bottom, #bae6fd 0%, #e0f2fe 60%, #f0f9ff 100%)',
      frame: 'rgba(255,255,255,0.85)',
      cross: false,
      arch: true,
      cloud: true,
    },
    {
      name: '彩色花窗',
      width: 170, height: 210,
      bg: 'conic-gradient(from 45deg, #fbbf24, #f472b6, #818cf8, #34d399, #fbbf24)',
      frame: 'rgba(255,255,255,0.6)',
      cross: true,
      cloud: false,
    },
  ]

  // ========== 对话系统 ==========
  var DIALOGUES = {
    // 点击角色时的日常闲聊（20条）
    tap: [
      '嗯？叫我了吗？',
      '今天也待在家里呢...',
      '窗外的天气不错呢',
      '要不要一起喝杯茶？',
      '这个房间我花了好久才布置好',
      '嗯...在想事情',
      '你来得正好',
      '刚才在发呆，被你吓了一跳',
      '这里的每样东西都是我精心挑的',
      '有点困了...但不舍得睡',
      '闻到什么香味了吗？',
      '今天想做点什么呢？',
      '房间有点乱，别介意啊',
      '这个角落是我最喜欢的地方',
      '嘘——猫好像睡着了',
      '我刚刚在听一首很好听的歌',
      '你要不要坐会儿？',
      '时间过得好快啊...',
      '这个灯的光线很温柔吧？',
      '总觉得还缺点什么装饰...',
    ],
    // 连续点击/戳角色时的反应（8条）
    poke: [
      '别戳啦！',
      '好痒......',
      '再戳我要生气了哦？',
      '嗯嗯嗯？怎么啦！',
      '你很烦诶...(小声)',
      '停一下！我在想事情',
      '哈...你今天怎么这么黏人',
      '好啦好啦，我在呢',
    ],
    // 观察家具时的反应（8条）
    observe: [
      '嗯，这个啊...',
      '那是我的宝贝',
      '哼，没什么特别的',
      '你喜欢这个吗？',
      '这个可有故事了',
      '摆在那里挺久了吧',
      '嗯...看着它就想起一些事',
      '特意放在这个位置的',
    ],
    // 进入房间时的问候（5条）
    greeting: [
      '你来了！快进来坐',
      '呀，是你啊',
      '门没锁，进来吧',
      '等你好一会儿了',
      '刚好在想你呢',
    ],
  }

  // ========== 状态 ==========
  var state = {
    view: 'select',
    mode: 'view',
    activeCharId: null,
    activeCharacter: null,
    characters: [],
    items: [],
    windows: [], // 窗户列表 { id, styleIdx, x, y }
    wallImage: '',
    floorImage: '',
    selectedItemId: null,
    selectedWindowId: null,
    showLibrary: false,
    showCustomModal: false,
    customAssets: [],
    customSprites: {},
    isToolbarCollapsed: false,
    // drag
    draggingId: null,
    dragStart: null,
    dragElement: null,
    pendingPos: null,
    rafId: null,
    // 窗户拖拽
    draggingWindowId: null,
    winDragStart: null,
    winDragElement: null,
    winPendingPos: null,
    // custom modal
    customName: '',
    customEmoji: '',
    customUrl: '',
    customImageData: '',
    customType: 'furniture',
    // 房间滑动
    panX: 0,
    minPanX: 0,
    isPanning: false,
    panPointer: null,
    panRAF: null,
    panVelocity: 0,
    // 对话
    lastDialogueIdx: -1,
    lastDialogueCategory: '',
    pokeCount: 0,
    lastPokeTime: 0,
    dialogueHistory: [], // 最近用过的对话，避免重复
  }

  var root = null
  var rocheApi = null
  var styleEl = null

  // ========== CSS ==========
  var CSS = `
.roche-plugin-pixel-house {
  --ph-primary: #6366f1;
  --ph-primary-light: #e0e7ff;
  --ph-bg: #f8fafc;
  --ph-text: #1e293b;
  --ph-text-muted: #94a3b8;
  --ph-border: #e2e8f0;
  --ph-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
  --ph-radius: 16px;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--ph-bg);
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.roche-plugin-pixel-house * { box-sizing: border-box; margin: 0; padding: 0; }
.roche-plugin-pixel-house button { cursor: pointer; border: none; background: none; font-family: inherit; }
.roche-plugin-pixel-house input { font-family: inherit; }

/* ===== 选人页（黑白风） ===== */
.ph-select-page {
  height: 100%; width: 100%; display: flex; flex-direction: column;
  background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 45%, #222 100%);
  position: relative; overflow: hidden;
  animation: ph-fade-in .4s ease;
}
.ph-stars {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background-image:
    radial-gradient(1.5px 1.5px at 14% 16%, rgba(255,255,255,.5), transparent),
    radial-gradient(1px 1px at 80% 12%, rgba(255,255,255,.45), transparent),
    radial-gradient(1.5px 1.5px at 42% 28%, rgba(200,200,200,.4), transparent),
    radial-gradient(1px 1px at 86% 42%, rgba(255,255,255,.35), transparent),
    radial-gradient(1px 1px at 22% 66%, rgba(255,255,255,.3), transparent),
    radial-gradient(1px 1px at 66% 80%, rgba(200,200,200,.3), transparent);
  animation: ph-twinkle 4s ease-in-out infinite alternate;
}
@keyframes ph-twinkle { from { opacity: 0.3; } to { opacity: 0.6; } }
.ph-select-header { position: relative; z-index: 2; padding: max(3rem, env(safe-area-inset-top)) 1.5rem 0; text-align: center; animation: ph-slide-down .5s ease; }
@keyframes ph-slide-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.ph-back-btn {
  position: absolute; left: 1rem; top: max(3rem, env(safe-area-inset-top));
  padding: 8px; border-radius: 50%; color: #999; transition: all .2s;
  display: flex; align-items: center; justify-content: center;
}
.ph-back-btn:active { transform: scale(0.9); }
.ph-select-title {
  font-size: 26px; letter-spacing: 0.15em; color: #f5f5f5;
  text-shadow: 0 2px 18px rgba(255,255,255,.15);
  font-family: 'Noto Serif SC', serif; font-weight: 300;
}
.ph-select-subtitle { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px; }
.ph-select-subtitle span.line { height: 1px; width: 40px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.4)); }
.ph-select-subtitle span.line.r { background: linear-gradient(270deg, transparent, rgba(255,255,255,.4)); }
.ph-select-subtitle span.text { font-size: 9px; letter-spacing: 0.45em; font-weight: 700; color: rgba(255,255,255,.5); }
.ph-select-desc { position: relative; z-index: 2; text-align: center; font-size: 11px; margin-top: 16px; padding: 0 2rem; color: rgba(255,255,255,.45); line-height: 1.6; }
.ph-char-grid { position: relative; z-index: 2; flex: 1; overflow-y: auto; padding: 16px 20px 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; align-content: start; }
.ph-char-grid::-webkit-scrollbar { display: none; }
.ph-char-card {
  position: relative; border-radius: 14px; padding: 24px 12px 18px;
  display: flex; flex-direction: column; align-items: center;
  transition: all .2s; overflow: hidden; border: 1px solid rgba(255,255,255,.12);
  box-shadow: 0 4px 12px rgba(0,0,0,.3);
  animation: ph-card-in .3s ease both;
}
@keyframes ph-card-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.ph-char-card:active { transform: scale(0.96); }
.ph-avatar-wrap { position: relative; width: 76px; height: 76px; display: flex; align-items: center; justify-content: center; }
.ph-avatar-img { width: 68px; height: 68px; border-radius: 50%; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.3); border: 2px solid rgba(255,255,255,.15); position: relative; z-index: 1; }
.ph-avatar-img img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(1.1); }
.ph-char-name { margin-top: 12px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; color: #f0f0f0; font-family: 'Noto Serif SC', serif; }
.ph-char-sub { margin-top: 2px; font-size: 10px; color: rgba(255,255,255,.4); }
.ph-empty { text-align: center; font-size: 12px; color: rgba(255,255,255,.35); padding: 64px 0; grid-column: 1 / -1; }

/* ===== 房间页 ===== */
.ph-room-page { height: 100%; width: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; background: var(--ph-bg); animation: ph-fade-in .3s ease; }

/* 房间舞台（视口） */
.ph-stage { flex: 1; position: relative; overflow: hidden; touch-action: none; }

/* 房间世界（比视口更宽，可滑动） */
.ph-room-world {
  position: absolute; top: 0; left: 0;
  width: 240%; height: 100%;
  will-change: transform;
}
.ph-wall { position: absolute; top: 0; left: 0; width: 100%; height: 65%; transition: background .5s; z-index: 0; }
.ph-floor { position: absolute; bottom: 0; left: 0; width: 100%; height: 35%; transition: background .5s; z-index: 0; }
.ph-horizon-shadow { position: absolute; top: 65%; width: 100%; height: 32px; background: linear-gradient(to bottom, rgba(0,0,0,0.1), transparent); pointer-events: none; z-index: 0; }

/* 踢脚线 */
.ph-baseboard {
  position: absolute; top: calc(65% - 6px); left: 0; width: 100%; height: 6px;
  background: rgba(0,0,0,0.08); z-index: 1; pointer-events: none;
}

/* 窗户装饰 */
.ph-window {
  position: absolute; top: 6%;
  border-radius: 8px 8px 4px 4px;
  box-shadow: inset 0 0 30px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.15);
  overflow: hidden; z-index: 1;
  transition: left .2s ease-out, top .2s ease-out;
}
.ph-window.editing { cursor: grab; border: 2px dashed rgba(99,102,241,0.6) !important; }
.ph-window.editing:active { cursor: grabbing; }
.ph-window.dragging { transition: none; z-index: 50; }
.ph-window .win-cross-h { position: absolute; top: 50%; left: 0; width: 100%; height: 5px; background: var(--win-frame, rgba(255,255,255,0.7)); transform: translateY(-50%); pointer-events: none; }
.ph-window .win-cross-v { position: absolute; left: 50%; top: 0; width: 5px; height: 100%; background: var(--win-frame, rgba(255,255,255,0.7)); transform: translateX(-50%); pointer-events: none; }
.ph-window .cloud { position: absolute; width: 40px; height: 16px; background: rgba(255,255,255,0.6); border-radius: 20px; animation: ph-cloud-drift 15s linear infinite; }
.ph-window .win-star { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.8); animation: ph-twinkle 2s ease-in-out infinite alternate; }
.ph-window.arch { border-radius: 50% 50% 4px 4px / 25% 25% 4px 4px; }
.ph-window.selected { outline: 2px solid var(--ph-primary); outline-offset: 4px; }
@keyframes ph-cloud-drift { from { left: -50px; } to { left: 200px; } }

/* 窗户光束 */
.ph-light-beam {
  position: absolute; top: 8%; width: 180px; height: 55%;
  background: linear-gradient(160deg, rgba(255,250,230,0.12) 0%, transparent 70%);
  transform: skewX(-12deg); pointer-events: none; z-index: 1;
}

/* 浮尘粒子 */
.ph-dust { position: absolute; inset: 0; pointer-events: none; z-index: 2; overflow: hidden; }
.ph-dust span {
  position: absolute; width: 3px; height: 3px; border-radius: 50%;
  background: rgba(255,255,255,0.4); animation: ph-dust-float 8s ease-in-out infinite;
}
@keyframes ph-dust-float { 0%,100% { transform: translateY(0) translateX(0); opacity: 0.2; } 50% { transform: translateY(-30px) translateX(15px); opacity: 0.6; } }

/* 家具 */
.ph-item {
  position: absolute; transform-origin: bottom center; touch-action: none;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.18)); transition: transform .2s ease-out;
}
.ph-item.dragging { transition: none; z-index: 100 !important; will-change: left, top; }
.ph-item.selected { outline: 2px solid var(--ph-primary); outline-offset: 4px; border-radius: 8px; }
.ph-item .item-visual { width: 100%; height: auto; object-fit: contain; pointer-events: none; display: block; }
.ph-item .item-emoji {
  width: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 48px; line-height: 1; pointer-events: none;
}
.ph-item .selected-label {
  position: absolute; top: -24px; left: 50%; transform: translateX(-50%);
  background: var(--ph-primary); color: #fff; font-size: 9px; padding: 2px 8px;
  border-radius: 10px; white-space: nowrap;
}

/* 角色 */
.ph-actor {
  position: absolute; transform-origin: bottom center; transition: left 1s cubic-bezier(0.4,0,0.2,1), top 1s cubic-bezier(0.4,0,0.2,1);
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2)); cursor: pointer; z-index: 98;
  animation: ph-idle-breath 3s ease-in-out infinite;
}
@keyframes ph-idle-breath { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-2px) scale(1.01); } }
.ph-actor img { width: 100%; height: 100%; object-fit: contain; }
.ph-actor.walking { animation: ph-walk-bounce 0.4s ease-in-out infinite; }
@keyframes ph-walk-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.ph-actor .bubble {
  position: absolute; bottom: 105%; left: 50%; transform: translateX(-50%);
  background: #fff; padding: 12px 16px; border-radius: 20px; border-bottom-left-radius: 4px;
  box-shadow: var(--ph-shadow); border: 2px solid rgba(0,0,0,0.05);
  min-width: 120px; max-width: 260px; z-index: 50; animation: ph-pop-in .25s cubic-bezier(0.34,1.56,0.64,1);
}
.ph-actor .bubble::after {
  content: ''; position: absolute; bottom: -8px; left: 20px;
  width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent;
  border-top: 8px solid #fff;
}
.ph-actor .bubble p { font-size: 13px; font-weight: 600; color: var(--ph-text); text-align: center; word-break: break-word; line-height: 1.5; }
.ph-actor .bubble .close-btn {
  position: absolute; top: -8px; right: -8px; background: #e2e8f0; color: #64748b;
  border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center;
  justify-content: center; font-size: 10px; font-weight: 700;
}

/* 滑动指示器 */
.ph-pan-indicator {
  position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
  width: 100px; height: 3px; background: rgba(0,0,0,0.1); border-radius: 2px;
  z-index: 20; overflow: hidden; pointer-events: none;
}
.ph-pan-indicator .fill {
  position: absolute; top: 0; height: 100%; background: rgba(99,102,241,0.5); border-radius: 2px;
  transition: left .1s ease, width .1s ease;
}
.ph-pan-hint {
  position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%);
  font-size: 9px; color: rgba(0,0,0,0.25); z-index: 20; pointer-events: none;
  letter-spacing: 1px; animation: ph-hint-pulse 2s ease-in-out infinite;
}
@keyframes ph-hint-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }

/* 顶部工具栏 */
.ph-top-bar {
  position: absolute; top: 0; left: 0; width: 100%; padding: max(3rem, env(safe-area-inset-top)) 1rem 0.5rem;
  display: flex; justify-content: space-between; z-index: 30; pointer-events: none;
}
.ph-top-bar > * { pointer-events: auto; }
.ph-char-label {
  background: rgba(255,255,255,0.9); padding: 6px 14px; border-radius: 20px;
  box-shadow: var(--ph-shadow); font-size: 13px; font-weight: 700; color: var(--ph-text);
  display: flex; align-items: center; gap: 6px;
}
.ph-char-label .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
.ph-icon-btn {
  background: rgba(255,255,255,0.9); padding: 8px; border-radius: 50%; box-shadow: var(--ph-shadow);
  display: flex; align-items: center; justify-content: center; transition: all .2s; color: var(--ph-text);
}
.ph-icon-btn:active { transform: scale(0.9); }
.ph-icon-btn:disabled { opacity: 0.4; }
.ph-icon-btn.active { background: var(--ph-primary); color: #fff; }
.ph-mode-btn {
  background: #fff; color: var(--ph-text); padding: 8px 16px; border-radius: 20px;
  font-size: 12px; font-weight: 700; box-shadow: var(--ph-shadow); transition: all .2s;
}
.ph-mode-btn.active { background: var(--ph-primary); color: #fff; }
.ph-mode-btn:active { transform: scale(0.95); }
.ph-top-right { display: flex; gap: 8px; }

/* 底部装修工具栏 */
.ph-edit-toolbar {
  position: absolute; bottom: 0; width: 100%; background: #fff; border-top: 1px solid var(--ph-border);
  z-index: 150; transition: transform .3s; display: flex; flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom); max-height: 45vh;
}
.ph-edit-toolbar.collapsed { transform: translateY(calc(100% - 2.5rem - env(safe-area-inset-bottom))); }
.ph-toolbar-handle { width: 100%; height: 2.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; border-bottom: 1px solid #f1f5f9; }
.ph-toolbar-handle div { width: 40px; height: 4px; background: #e2e8f0; border-radius: 2px; }
.ph-toolbar-content { padding: 16px; overflow-y: auto; flex: 1; }
.ph-toolbar-content::-webkit-scrollbar { display: none; }

/* 工具栏快捷按钮 */
.ph-quick-actions { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.ph-quick-actions::-webkit-scrollbar { display: none; }
.ph-quick-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
.ph-quick-btn .icon-box {
  width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: #fff; box-shadow: var(--ph-shadow); transition: transform .15s;
}
.ph-quick-btn:active .icon-box { transform: scale(0.92); }
.ph-quick-btn .label { font-size: 10px; font-weight: 700; color: var(--ph-text-muted); }

/* 预设行 */
.ph-preset-row { margin-top: 12px; }
.ph-preset-row h4 { font-size: 10px; font-weight: 700; color: var(--ph-text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
.ph-preset-list { display: flex; gap: 8px; overflow-x: auto; }
.ph-preset-list::-webkit-scrollbar { display: none; }
.ph-preset-swatch { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--ph-border); flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

/* 选中物品编辑面板 */
.ph-item-editor { display: flex; flex-direction: column; gap: 12px; }
.ph-editor-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.ph-editor-header .title { font-size: 12px; font-weight: 700; color: var(--ph-text-muted); }
.ph-editor-actions { display: flex; gap: 8px; flex-shrink: 0; }
.ph-editor-actions button { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }
.ph-editor-actions .dup { background: #e0e7ff; color: var(--ph-primary); }
.ph-editor-actions .del { background: #fef2f2; color: #ef4444; }
.ph-slider-group { display: flex; gap: 16px; align-items: stretch; }
.ph-slider-col { flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.ph-slider-row label { display: block; font-size: 10px; color: var(--ph-text-muted); margin-bottom: 4px; }
.ph-slider-row label .val { color: var(--ph-text); font-weight: 700; }
.ph-slider-row input[type=range] { width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px; -webkit-appearance: none; appearance: none; }
.ph-slider-row input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: var(--ph-primary); border-radius: 50%; cursor: pointer; }
.ph-numpad { display: grid; grid-template-columns: repeat(3, 36px); gap: 4px; flex-shrink: 0; align-self: center; }
.ph-numpad button { width: 36px; height: 36px; background: #f1f5f9; border-radius: 8px; color: var(--ph-text-muted); font-weight: 700; font-size: 14px; transition: all .15s; }
.ph-numpad button:active { background: #e0e7ff; color: var(--ph-primary); transform: scale(0.92); }
.ph-numpad .spacer { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #cbd5e1; }

/* 模态框 */
.ph-modal-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4); z-index: 400;
  display: flex; align-items: flex-end; justify-content: center; animation: ph-fade-in .2s;
}
.ph-modal {
  background: #fff; width: 100%; max-width: 500px; max-height: 85vh; border-radius: 24px 24px 0 0;
  display: flex; flex-direction: column; animation: ph-slide-up .3s ease-out;
  padding-bottom: env(safe-area-inset-bottom);
}
.ph-modal-header { padding: 20px 24px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
.ph-modal-header h3 { font-size: 16px; font-weight: 700; color: var(--ph-text); }
.ph-modal-header .close { padding: 4px; color: var(--ph-text-muted); }
.ph-modal-body { flex: 1; overflow-y: auto; padding: 16px 24px; }
.ph-modal-body::-webkit-scrollbar { display: none; }
.ph-modal-footer { padding: 12px 24px 20px; border-top: 1px solid #f1f5f9; }
.ph-modal-footer button { width: 100%; padding: 12px; border-radius: 16px; font-size: 12px; font-weight: 700; }

/* 家具库 */
.ph-library-section { margin-bottom: 24px; }
.ph-library-section h4 {
  font-size: 12px; font-weight: 700; color: var(--ph-text-muted); text-transform: uppercase;
  letter-spacing: 1px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;
}
.ph-library-section h4 .count { font-size: 9px; background: #f1f5f9; padding: 2px 8px; border-radius: 10px; }
.ph-library-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.ph-library-item { display: flex; flex-direction: column; align-items: center; gap: 8px; transition: transform .15s; }
.ph-library-item:active { transform: scale(0.92); }
.ph-library-item .icon-box {
  width: 56px; height: 56px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;
  display: flex; align-items: center; justify-content: center; font-size: 28px; overflow: hidden; transition: border-color .2s;
}
.ph-library-item:hover .icon-box { border-color: var(--ph-primary); }
.ph-library-item .icon-box img { width: 100%; height: 100%; object-fit: contain; }
.ph-library-item .name { font-size: 10px; color: var(--ph-text-muted); text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 自定义家具弹窗 */
.ph-custom-form { display: flex; flex-direction: column; gap: 16px; }
.ph-custom-top { display: flex; gap: 16px; }
.ph-upload-box {
  width: 96px; aspect-ratio: 1; background: #f1f5f9; border-radius: 16px; border: 2px dashed #cbd5e1;
  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
  overflow: hidden; transition: border-color .2s; position: relative;
}
.ph-upload-box:hover { border-color: var(--ph-primary); }
.ph-upload-box img { width: 100%; height: 100%; object-fit: contain; }
.ph-upload-box .placeholder { font-size: 12px; color: var(--ph-text-muted); }
.ph-custom-fields { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.ph-input-group label { font-size: 10px; font-weight: 700; color: var(--ph-text-muted); text-transform: uppercase; display: block; margin-bottom: 4px; }
.ph-input-group input {
  width: 100%; background: #f8fafc; border: 1px solid var(--ph-border); border-radius: 12px;
  padding: 8px 12px; font-size: 13px; color: var(--ph-text); outline: none; transition: border-color .2s;
}
.ph-input-group input:focus { border-color: var(--ph-primary); }
.ph-type-toggle { display: flex; gap: 8px; }
.ph-type-toggle button {
  flex: 1; padding: 8px; border-radius: 12px; font-size: 12px; font-weight: 700; border: 1px solid var(--ph-border);
  transition: all .2s; color: var(--ph-text-muted); background: #f8fafc;
}
.ph-type-toggle button.active { background: var(--ph-primary-light); border-color: var(--ph-primary); color: var(--ph-primary); }

/* 观察卡片 */
.ph-observation {
  position: absolute; left: 16px; right: 16px; background: #fff; padding: 20px; border-radius: var(--ph-radius);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; z-index: 150; animation: ph-slide-up .3s;
  bottom: calc(1.5rem + env(safe-area-inset-bottom));
}
.ph-observation .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; }
.ph-observation .header span { font-size: 12px; font-weight: 700; color: var(--ph-primary); text-transform: uppercase; letter-spacing: 2px; }
.ph-observation .header button { color: var(--ph-text-muted); }
.ph-observation p { font-size: 14px; color: var(--ph-text); line-height: 1.6; }

/* 动画 */
@keyframes ph-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes ph-pop-in { from { opacity: 0; transform: translateX(-50%) scale(0.8); } to { opacity: 1; transform: translateX(-50%) scale(1); } }
@keyframes ph-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ph-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes ph-bounce-actor { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
`

  // ========== 工具函数 ==========
  function el(tag, className, attrs) {
    var e = document.createElement(tag)
    if (className) e.className = className
    if (attrs) {
      for (var k in attrs) {
        if (k === 'text') e.textContent = attrs[k]
        else if (k === 'html') e.innerHTML = attrs[k]
        else if (k === 'style') e.setAttribute('style', attrs[k])
        else e.setAttribute(k, attrs[k])
      }
    }
    return e
  }

  function svgIcon(path, size) {
    size = size || 24
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:' + size + 'px;height:' + size + 'px"><path stroke-linecap="round" stroke-linejoin="round" d="' + path + '"/></svg>'
  }

  var ICONS = {
    back: 'M15.75 19.5 8.25 12l7.5-7.5',
    close: 'M6 18 18 6M6 6l12 12',
    plus: 'M12 4.5v15m7.5-7.5h-15',
    sparkle: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z',
    camera: 'M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.174-1.26.21-2.152 1.35-2.152 2.625v7.596c0 1.397 1.17 2.476 2.564 2.362a47.24 47.24 0 0 0 13.872 0c1.394.114 2.564-.965 2.564-2.362V9.854c0-1.275-.892-2.415-2.152-2.625a37.5 37.5 0 0 0-1.134-.174 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.822 1.316ZM16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z',
    image: 'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
    settings: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    trash: 'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
    copy: 'M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75',
    eye: 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    eyeOff: 'M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88',
    undo: 'M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3',
    redo: 'm15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3',
  }

  function getStorageKey() {
    return 'room_' + (state.activeCharId || 'default')
  }

  async function loadRoomData() {
    if (!rocheApi) return
    var data = await rocheApi.storage.get(getStorageKey())
    if (data) {
      try {
        var parsed = typeof data === 'string' ? JSON.parse(data) : data
        state.items = parsed.items || []
        state.windows = parsed.windows || []
        state.wallImage = parsed.wallImage || ''
        state.floorImage = parsed.floorImage || ''
      } catch (e) {
        state.items = []
        state.windows = []
      }
    } else {
      state.items = []
      state.windows = []
    }
  }

  async function saveRoomData() {
    if (!rocheApi) return
    var data = {
      items: state.items,
      windows: state.windows,
      wallImage: state.wallImage,
      floorImage: state.floorImage,
    }
    await rocheApi.storage.set(getStorageKey(), JSON.stringify(data))
  }

  async function loadCustomAssets() {
    if (!rocheApi) return
    var data = await rocheApi.storage.get('custom_assets')
    if (data) {
      try {
        state.customAssets = typeof data === 'string' ? JSON.parse(data) : data
      } catch (e) {
        state.customAssets = []
      }
    }
  }

  async function saveCustomAssets() {
    if (!rocheApi) return
    await rocheApi.storage.set('custom_assets', JSON.stringify(state.customAssets))
  }

  async function loadCustomSprites() {
    if (!rocheApi) return
    var data = await rocheApi.storage.get('custom_sprites')
    if (data) {
      try {
        state.customSprites = typeof data === 'string' ? JSON.parse(data) : data
      } catch (e) {
        state.customSprites = {}
      }
    }
  }

  async function saveCustomSprites() {
    if (!rocheApi) return
    await rocheApi.storage.set('custom_sprites', JSON.stringify(state.customSprites))
  }

  function getActorImage() {
    if (!state.activeCharId) return ''
    if (state.customSprites[state.activeCharId]) {
      return state.customSprites[state.activeCharId]
    }
    return (state.activeCharacter && state.activeCharacter.avatar) || ''
  }

  // ========== 渲染：选人页 ==========
  function renderSelectPage() {
    root.innerHTML = ''
    var page = el('div', 'ph-select-page')

    page.appendChild(el('div', 'ph-stars'))

    var header = el('div', 'ph-select-header')
    var backBtn = el('button', 'ph-back-btn', { html: svgIcon(ICONS.back, 24) })
    backBtn.onclick = function () { if (rocheApi) rocheApi.ui.closeApp() }
    header.appendChild(backBtn)

    header.appendChild(el('h1', 'ph-select-title', { text: '拜访谁的房间？' }))
    page.appendChild(header)

    page.appendChild(el('p', 'ph-select-desc', { text: '选择角色，走进 ta 的房间' }))

    var grid = el('div', 'ph-char-grid')

    if (!state.characters || state.characters.length === 0) {
      grid.appendChild(el('div', 'ph-empty', { text: '还没有角色，先去创建一个吧。' }))
    } else {
      state.characters.forEach(function (c, i) {
        var card = el('button', 'ph-char-card')
        card.style.background = 'linear-gradient(180deg,rgba(35,35,35,.9),rgba(18,18,18,.85))'
        card.style.animationDelay = (i * 0.04) + 's'

        var avatarWrap = el('div', 'ph-avatar-wrap')
        var avatarImg = el('div', 'ph-avatar-img')
        var img = el('img')
        img.src = c.avatar || ''
        img.alt = c.name || ''
        img.onerror = function () { this.style.display = 'none' }
        avatarImg.appendChild(img)
        avatarWrap.appendChild(avatarImg)
        card.appendChild(avatarWrap)

        var name = c.handle || c.name || '未知角色'
        card.appendChild(el('span', 'ph-char-name', { text: name }))
        card.appendChild(el('span', 'ph-char-sub', { text: '拜访 ta 的房间' }))

        card.onclick = function () { enterRoom(c) }
        grid.appendChild(card)
      })
    }

    page.appendChild(grid)
    root.appendChild(page)
  }

  // ========== 进入房间 ==========
  async function enterRoom(character) {
    state.activeCharId = character.id
    state.activeCharacter = character
    state.view = 'room'
    state.mode = 'view'
    state.selectedItemId = null
    state.selectedWindowId = null
    state.isToolbarCollapsed = false
    state.panX = 0
    state.pokeCount = 0
    state.dialogueHistory = []
    await loadRoomData()
    renderRoomPage()
    // 进入房间后显示问候对话
    setTimeout(function () {
      var greeting = pickDialogue('greeting')
      showBubble(greeting)
    }, 800)
  }

  // ========== 渲染：房间页 ==========
  function renderRoomPage() {
    root.innerHTML = ''

    var page = el('div', 'ph-room-page')

    // 舞台（视口）
    var stage = el('div', 'ph-stage')
    stage.id = 'ph-stage'

    // 房间世界（比视口宽，可滑动）
    var world = el('div', 'ph-room-world')
    world.id = 'ph-room-world'

    // 墙
    var wall = el('div', 'ph-wall')
    wall.id = 'ph-wall'
    wall.style.background = state.wallImage || WALLPAPER_PRESETS[0].value
    world.appendChild(wall)

    // 窗户（从 state 动态渲染，首次进入给默认两扇窗）
    if (!state.windows || state.windows.length === 0) {
      state.windows = [
        { id: 'win-' + Date.now() + '-1', styleIdx: 0, x: 6, y: 6 },
        { id: 'win-' + Date.now() + '-2', styleIdx: 0, x: 62, y: 6 },
      ]
      saveRoomData()
    }
    state.windows.forEach(function (win) {
      var winEl = createWindowElement(win)
      if (winEl) world.appendChild(winEl)
      // 窗户光束
      var beam = el('div', 'ph-light-beam')
      beam.style.left = win.x + '%'
      world.appendChild(beam)
    })

    // 地板
    var floor = el('div', 'ph-floor')
    floor.id = 'ph-floor'
    floor.style.background = state.floorImage || FLOOR_PRESETS[0].value
    world.appendChild(floor)

    // 地平线阴影 + 踢脚线
    world.appendChild(el('div', 'ph-horizon-shadow'))
    world.appendChild(el('div', 'ph-baseboard'))

    // 浮尘粒子
    var dust = el('div', 'ph-dust')
    for (var d = 0; d < 6; d++) {
      var particle = el('span')
      particle.style.left = (Math.random() * 100) + '%'
      particle.style.top = (20 + Math.random() * 50) + '%'
      particle.style.animationDelay = (Math.random() * 8) + 's'
      particle.style.animationDuration = (6 + Math.random() * 4) + 's'
      dust.appendChild(particle)
    }
    world.appendChild(dust)

    // 家具
    state.items.forEach(function (item) {
      world.appendChild(createItemElement(item))
    })

    // 角色
    var actor = createActorElement()
    if (actor) world.appendChild(actor)

    stage.appendChild(world)

    // 滑动指示器
    var indicator = el('div', 'ph-pan-indicator')
    indicator.id = 'ph-pan-indicator'
    var fill = el('div', 'fill')
    fill.id = 'ph-pan-fill'
    indicator.appendChild(fill)
    stage.appendChild(indicator)

    var hint = el('div', 'ph-pan-hint', { text: '◀ 左右滑动房间 ▶' })
    hint.id = 'ph-pan-hint'
    stage.appendChild(hint)

    // 舞台点击（背景区域）
    stage.addEventListener('click', function (e) {
      if (e.target === stage || e.target === wall || e.target === floor || e.target === world || e.target.classList.contains('ph-horizon-shadow') || e.target.classList.contains('ph-baseboard')) {
        if (state.mode === 'edit') {
          state.selectedItemId = null
          state.selectedWindowId = null
          renderEditToolbar()
          refreshItemSelection()
          refreshWindowSelection()
        }
      }
    })

    page.appendChild(stage)

    // 顶部工具栏
    var topBar = el('div', 'ph-top-bar')

    var backBtn = el('button', 'ph-icon-btn', { html: svgIcon(ICONS.back, 24) })
    backBtn.onclick = function () {
      state.view = 'select'
      state.activeCharId = null
      state.activeCharacter = null
      renderSelectPage()
    }
    topBar.appendChild(backBtn)

    // 角色名称标签
    if (state.activeCharacter) {
      var charName = state.activeCharacter.handle || state.activeCharacter.name || ''
      var label = el('div', 'ph-char-label')
      label.appendChild(el('span', 'dot'))
      label.appendChild(el('span', '', { text: charName + ' 的房间' }))
      topBar.appendChild(label)
    }

    var topRight = el('div', 'ph-top-right')

    if (state.mode === 'edit') {
      var hideActorBtn = el('button', 'ph-icon-btn', { html: svgIcon(ICONS.eye, 22) })
      hideActorBtn.id = 'ph-hide-actor'
      hideActorBtn.onclick = function () {
        var actor = document.getElementById('ph-actor')
        if (actor) {
          var hidden = actor.style.display === 'none'
          actor.style.display = hidden ? '' : 'none'
          hideActorBtn.innerHTML = hidden ? svgIcon(ICONS.eye, 22) : svgIcon(ICONS.eyeOff, 22)
          hideActorBtn.classList.toggle('active', !hidden)
        }
      }
      topRight.appendChild(hideActorBtn)
    }

    var modeBtn = el('button', 'ph-mode-btn')
    modeBtn.textContent = state.mode === 'edit' ? '完成' : '装修'
    if (state.mode === 'edit') modeBtn.classList.add('active')
    modeBtn.onclick = function () {
      state.mode = state.mode === 'view' ? 'edit' : 'view'
      state.selectedItemId = null
      state.selectedWindowId = null
      renderRoomPage()
    }
    topRight.appendChild(modeBtn)
    topBar.appendChild(topRight)
    page.appendChild(topBar)

    if (state.mode === 'edit') {
      page.appendChild(createEditToolbar())
    }

    root.appendChild(page)

    // 初始化滑动
    initPanning()
    updatePanIndicator()
  }

  // ========== 创建家具元素 ==========
  function createItemElement(item) {
    var div = el('div', 'ph-item')
    div.dataset.id = item.id
    div.style.left = item.x + '%'
    div.style.top = item.y + '%'
    div.style.width = (80 * item.scale) + 'px'
    div.style.transform = 'translate(-50%, -100%) rotate(' + (item.rotation || 0) + 'deg)'

    if (item.type === 'rug') {
      div.style.zIndex = String(1 + Math.floor(item.y / 10))
    } else {
      div.style.zIndex = String(Math.floor(item.y))
    }

    if (item.image && (item.image.startsWith('http') || item.image.startsWith('data') || item.image.startsWith('blob'))) {
      var img = el('img', 'item-visual')
      img.src = item.image
      img.draggable = false
      div.appendChild(img)
    } else {
      var emojiDiv = el('div', 'item-emoji')
      emojiDiv.textContent = item.emoji || item.image || '📦'
      div.appendChild(emojiDiv)
    }

    if (state.mode === 'edit' && state.selectedItemId === item.id) {
      div.classList.add('selected')
      div.appendChild(el('div', 'selected-label', { text: '选中' }))
    }

    if (state.mode === 'edit') {
      div.style.cursor = 'grab'
      div.addEventListener('pointerdown', function (e) { handlePointerDown(e, item.id) })
      div.addEventListener('wheel', function (e) {
        if (state.selectedItemId !== item.id) return
        e.preventDefault()
        var next = Math.min(6, Math.max(0.2, item.scale + (e.deltaY < 0 ? 0.08 : -0.08)))
        updateSelectedItem({ scale: Math.round(next * 100) / 100 })
      })
    } else {
      if (item.isInteractive !== false) {
        div.style.cursor = 'pointer'
        div.addEventListener('click', function (e) {
          e.stopPropagation()
          lookAtItem(item)
        })
      }
    }

    return div
  }

  // ========== 创建窗户元素 ==========
  function createWindowElement(win) {
    var preset = WINDOW_PRESETS[win.styleIdx] || WINDOW_PRESETS[0]
    var div = el('div', 'ph-window')
    div.dataset.winId = win.id
    div.style.left = win.x + '%'
    div.style.top = (win.y || 6) + '%'
    div.style.width = preset.width + 'px'
    div.style.height = preset.height + 'px'
    div.style.background = preset.bg
    div.style.border = '5px solid ' + preset.frame
    div.style.setProperty('--win-frame', preset.frame)

    if (preset.arch) div.classList.add('arch')

    // 十字窗框
    if (preset.cross) {
      div.appendChild(el('div', 'win-cross-h'))
      div.appendChild(el('div', 'win-cross-v'))
    }

    // 云朵
    if (preset.cloud) {
      var cloud = el('div', 'cloud')
      cloud.style.top = (20 + Math.random() * 30) + '%'
      cloud.style.animationDelay = (Math.random() * 5) + 's'
      div.appendChild(cloud)
    }

    // 星星（星空窗）
    if (preset.stars) {
      for (var s = 0; s < 6; s++) {
        var star = el('div', 'win-star')
        star.style.left = (10 + Math.random() * 80) + '%'
        star.style.top = (10 + Math.random() * 70) + '%'
        star.style.animationDelay = (Math.random() * 2) + 's'
        div.appendChild(star)
      }
    }

    // 编辑模式：可拖动 + 选中
    if (state.mode === 'edit') {
      div.classList.add('editing')
      if (state.selectedWindowId === win.id) {
        div.classList.add('selected')
      }
      div.addEventListener('pointerdown', function (e) { handleWindowPointerDown(e, win.id) })
    } else {
      // 浏览模式：点击窗户时角色有反应
      div.style.pointerEvents = 'none'
    }

    return div
  }

  // ========== 窗户拖拽 ==========
  function handleWindowPointerDown(e, id) {
    if (state.mode !== 'edit') return
    e.preventDefault()
    e.stopPropagation()

    var win = state.windows.find(function (w) { return w.id === id })
    if (!win) return

    var stage = document.getElementById('ph-stage')
    if (!stage) return
    var rect = stage.getBoundingClientRect()

    state.draggingWindowId = id
    state.winDragStart = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: win.x,
      initialY: win.y,
      width: rect.width * ROOM_WIDTH_RATIO,
      height: rect.height,
    }

    var elem = e.currentTarget
    state.winDragElement = elem
    elem.setPointerCapture(e.pointerId)
    elem.classList.add('dragging')

    state.selectedWindowId = id
    state.selectedItemId = null
    refreshItemSelection()
    refreshWindowSelection()
    renderEditToolbar()

    elem.addEventListener('pointermove', handleWindowPointerMove)
    elem.addEventListener('pointerup', handleWindowPointerUp)
    elem.addEventListener('pointercancel', handleWindowPointerUp)
  }

  function handleWindowPointerMove(e) {
    if (!state.draggingWindowId || !state.winDragStart) return
    e.preventDefault()

    var ds = state.winDragStart
    var deltaX = e.clientX - ds.startX
    var deltaY = e.clientY - ds.startY

    var nextX = Math.max(0, Math.min(95, ds.initialX + (deltaX / ds.width) * 100))
    var nextY = Math.max(0, Math.min(55, ds.initialY + (deltaY / ds.height) * 100))

    state.winPendingPos = { x: nextX, y: nextY }

    if (state.winDragElement && !state.rafId) {
      state.rafId = requestAnimationFrame(function () {
        if (state.winDragElement && state.winPendingPos) {
          state.winDragElement.style.left = state.winPendingPos.x + '%'
          state.winDragElement.style.top = state.winPendingPos.y + '%'
        }
        state.rafId = null
      })
    }
  }

  function handleWindowPointerUp(e) {
    if (!state.draggingWindowId) return

    if (state.rafId) { cancelAnimationFrame(state.rafId); state.rafId = null }

    if (state.winDragElement) {
      state.winDragElement.classList.remove('dragging')
      state.winDragElement.removeEventListener('pointermove', handleWindowPointerMove)
      state.winDragElement.removeEventListener('pointerup', handleWindowPointerUp)
      state.winDragElement.removeEventListener('pointercancel', handleWindowPointerUp)
    }

    if (state.winPendingPos) {
      var dragId = state.draggingWindowId
      state.windows = state.windows.map(function (w) {
        if (w.id === dragId) {
          return Object.assign({}, w, { x: state.winPendingPos.x, y: state.winPendingPos.y })
        }
        return w
      })
      saveRoomData()
    }

    state.draggingWindowId = null
    state.winDragStart = null
    state.winDragElement = null
    state.winPendingPos = null

    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
  }

  function refreshWindowSelection() {
    document.querySelectorAll('.ph-window').forEach(function (el) {
      el.classList.remove('selected')
    })
    if (state.selectedWindowId) {
      var sel = document.querySelector('.ph-window[data-win-id="' + state.selectedWindowId + '"]')
      if (sel) sel.classList.add('selected')
    }
  }

  // ========== 创建角色元素 ==========
  function createActorElement() {
    if (!state.activeCharacter) return null
    var actor = el('div', 'ph-actor')
    actor.id = 'ph-actor'
    actor.style.left = '15%'
    actor.style.top = '78%'
    actor.style.width = '100px'

    var img = el('img')
    var avatarUrl = getActorImage()
    img.src = avatarUrl
    img.alt = (state.activeCharacter && state.activeCharacter.name) || ''
    img.onerror = function () {
      this.style.display = 'none'
      var fallback = el('div', 'item-emoji')
      fallback.textContent = '🧑'
      fallback.style.fontSize = '64px'
      actor.appendChild(fallback)
    }
    actor.appendChild(img)

    if (state.mode === 'edit') {
      actor.addEventListener('click', function (e) {
        e.stopPropagation()
        showActorArtModal()
      })
    } else {
      actor.addEventListener('click', function (e) {
        e.stopPropagation()
        pokeActor()
      })
    }

    return actor
  }

  // ========== 对话系统 ==========
  // 从指定类别中选取一条对话，避免连续重复
  function pickDialogue(category) {
    var pool = DIALOGUES[category] || DIALOGUES.tap
    var available = []
    for (var i = 0; i < pool.length; i++) {
      if (state.dialogueHistory.indexOf(category + ':' + i) === -1) {
        available.push(i)
      }
    }
    // 如果全部用过了，清空历史重新开始
    if (available.length === 0) {
      state.dialogueHistory = state.dialogueHistory.filter(function (h) {
        return h.indexOf(category + ':') !== 0
      })
      for (var j = 0; j < pool.length; j++) available.push(j)
    }
    var pick = available[Math.floor(Math.random() * available.length)]
    state.dialogueHistory.push(category + ':' + pick)
    // 只保留最近 8 条历史
    if (state.dialogueHistory.length > 8) {
      state.dialogueHistory = state.dialogueHistory.slice(-8)
    }
    return pool[pick]
  }

  // 点击角色互动
  function pokeActor() {
    var actor = document.getElementById('ph-actor')
    if (!actor) return

    // 弹跳动画
    actor.style.animation = 'ph-bounce-actor 0.5s ease'
    setTimeout(function () { actor.style.animation = '' }, 500)

    // 检测是否是连续戳（2秒内）
    var now = Date.now()
    if (now - state.lastPokeTime < 2000) {
      state.pokeCount++
    } else {
      state.pokeCount = 1
    }
    state.lastPokeTime = now

    // 连续戳 3 次以上用 poke 对话，否则用 tap 对话
    var category = state.pokeCount >= 3 ? 'poke' : 'tap'
    var dialogue = pickDialogue(category)
    showBubble(dialogue)
  }

  // 观察家具
  function lookAtItem(item) {
    var actor = document.getElementById('ph-actor')
    if (actor) {
      var targetY = Math.max(FLOOR_HORIZON, item.y + 5)
      actor.style.left = item.x + '%'
      actor.style.top = targetY + '%'
      actor.classList.add('walking')
      setTimeout(function () { actor.classList.remove('walking') }, 600)

      // 摄像机跟随角色
      setTimeout(function () { ensureActorVisible(item.x) }, 100)
    }
    var desc = item.description || (item.name + '静静地摆放在那里。')
    showObservation(desc)
    var reaction = pickDialogue('observe')
    setTimeout(function () { showBubble(reaction) }, 700)
  }

  function showBubble(text) {
    var actor = document.getElementById('ph-actor')
    if (!actor) return
    var existing = actor.querySelector('.bubble')
    if (existing) existing.remove()
    var bubble = el('div', 'bubble')
    bubble.appendChild(el('p', '', { text: text }))
    var closeBtn = el('button', 'close-btn', { text: '×' })
    closeBtn.onclick = function (e) { e.stopPropagation(); bubble.remove() }
    bubble.appendChild(closeBtn)
    actor.appendChild(bubble)
    setTimeout(function () { if (bubble.parentNode) bubble.remove() }, 5000)
  }

  function showObservation(text) {
    var existing = document.querySelector('.ph-observation')
    if (existing) existing.remove()
    var card = el('div', 'ph-observation')
    var header = el('div', 'header')
    header.appendChild(el('span', '', { text: 'OBSERVATION' }))
    var closeBtn = el('button', '', { html: svgIcon(ICONS.close, 18) })
    closeBtn.onclick = function () { card.remove() }
    header.appendChild(closeBtn)
    card.appendChild(header)
    card.appendChild(el('p', '', { text: text }))
    root.querySelector('.ph-room-page').appendChild(card)
    setTimeout(function () { if (card.parentNode) card.remove() }, 8000)
  }

  // ========== 房间滑动系统 ==========
  function initPanning() {
    var stage = document.getElementById('ph-stage')
    var world = document.getElementById('ph-room-world')
    if (!stage || !world) return

    function calcMinPan() {
      state.minPanX = stage.offsetWidth - world.offsetWidth
      if (state.minPanX > 0) state.minPanX = 0
    }
    calcMinPan()

    // 防止重复绑定
    stage._panBound = true
    stage.addEventListener('pointerdown', onPanStart)
  }

  function onPanStart(e) {
    var stage = document.getElementById('ph-stage')
    if (!stage) return

    var target = e.target
    var isBackground = target === stage ||
      target.classList.contains('ph-wall') ||
      target.classList.contains('ph-floor') ||
      target.classList.contains('ph-room-world') ||
      target.classList.contains('ph-horizon-shadow') ||
      target.classList.contains('ph-baseboard') ||
      target.classList.contains('ph-dust') ||
      target.classList.contains('ph-window') ||
      target.classList.contains('ph-light-beam') ||
      target.classList.contains('ph-pan-indicator') ||
      target.classList.contains('ph-pan-hint')

    if (!isBackground) return

    // 停止惯性动画
    if (state.panRAF) { cancelAnimationFrame(state.panRAF); state.panRAF = null }

    state.isPanning = true
    state.panPointer = {
      startX: e.clientX,
      startPanX: state.panX,
      lastX: e.clientX,
      lastTime: Date.now(),
      velocity: 0,
      moved: false,
      pointerId: e.pointerId,
    }

    try { stage.setPointerCapture(e.pointerId) } catch (_) {}
    stage.addEventListener('pointermove', onPanMove)
    stage.addEventListener('pointerup', onPanEnd)
    stage.addEventListener('pointercancel', onPanEnd)
  }

  function onPanMove(e) {
    if (!state.isPanning || !state.panPointer) return
    e.preventDefault()

    var pp = state.panPointer
    var delta = e.clientX - pp.startX
    if (Math.abs(delta) > 5) pp.moved = true

    var newX = pp.startPanX + delta
    newX = clampPan(newX)

    var now = Date.now()
    var dt = now - pp.lastTime
    if (dt > 0) {
      pp.velocity = (e.clientX - pp.lastX) / dt
    }
    pp.lastX = e.clientX
    pp.lastTime = now

    setPanX(newX)
  }

  function onPanEnd(e) {
    var stage = document.getElementById('ph-stage')
    if (!stage) return

    stage.removeEventListener('pointermove', onPanMove)
    stage.removeEventListener('pointerup', onPanEnd)
    stage.removeEventListener('pointercancel', onPanEnd)

    var pp = state.panPointer
    state.isPanning = false

    if (!pp) return

    // 如果几乎没移动，当作点击（编辑模式下取消选中）
    if (!pp.moved) {
      if (state.mode === 'edit' && (state.selectedItemId || state.selectedWindowId)) {
        state.selectedItemId = null
        state.selectedWindowId = null
        renderEditToolbar()
        refreshItemSelection()
        refreshWindowSelection()
      }
      state.panPointer = null
      return
    }

    // 惯性滑动
    var velocity = pp.velocity * 16
    state.panPointer = null

    if (Math.abs(velocity) > 0.5) {
      animateMomentum(velocity)
    } else {
      snapToBounds()
    }
  }

  function animateMomentum(velocity) {
    var friction = 0.95
    function step() {
      velocity *= friction
      var newX = state.panX + velocity
      // 边界反弹
      if (newX > 0) { newX = 0; velocity *= -0.3 }
      if (newX < state.minPanX) { newX = state.minPanX; velocity *= -0.3 }
      setPanX(newX)
      if (Math.abs(velocity) > 0.3) {
        state.panRAF = requestAnimationFrame(step)
      } else {
        state.panRAF = null
        snapToBounds()
      }
    }
    state.panRAF = requestAnimationFrame(step)
  }

  function snapToBounds() {
    var target = state.panX
    if (target > 0) target = 0
    if (target < state.minPanX) target = state.minPanX
    if (Math.abs(target - state.panX) < 1) return

    var start = state.panX
    var startTime = Date.now()
    var duration = 300
    function step() {
      var t = Math.min(1, (Date.now() - startTime) / duration)
      var ease = 1 - Math.pow(1 - t, 3)
      setPanX(start + (target - start) * ease)
      if (t < 1) {
        state.panRAF = requestAnimationFrame(step)
      } else {
        state.panRAF = null
      }
    }
    state.panRAF = requestAnimationFrame(step)
  }

  function clampPan(x) {
    if (x > 0) return x * 0.3
    if (x < state.minPanX) return state.minPanX + (x - state.minPanX) * 0.3
    return x
  }

  function setPanX(x) {
    state.panX = x
    var world = document.getElementById('ph-room-world')
    if (world) world.style.transform = 'translateX(' + x + 'px)'
    updatePanIndicator()
  }

  function updatePanIndicator() {
    var fill = document.getElementById('ph-pan-fill')
    if (!fill) return
    var world = document.getElementById('ph-room-world')
    var stage = document.getElementById('ph-stage')
    if (!world || !stage) return

    var worldW = world.offsetWidth
    var stageW = stage.offsetWidth
    var visibleRatio = stageW / worldW
    var progress = state.minPanX < 0 ? (-state.panX / state.minPanX) : 0

    fill.style.width = (visibleRatio * 100) + '%'
    fill.style.left = (progress * (100 - visibleRatio * 100)) + '%'

    // 隐藏提示文字（滑动过后）
    var hint = document.getElementById('ph-pan-hint')
    if (hint && Math.abs(state.panX) > 20) {
      hint.style.opacity = '0'
      hint.style.transition = 'opacity .5s'
    }
  }

  // 摄像机跟随：确保角色在可视区域内
  function ensureActorVisible(actorLeftPercent) {
    var stage = document.getElementById('ph-stage')
    var world = document.getElementById('ph-room-world')
    if (!stage || !world) return

    var stageW = stage.offsetWidth
    var worldW = world.offsetWidth
    var actorScreenX = state.panX + (actorLeftPercent / 100) * worldW
    var margin = 100

    var targetPan = state.panX
    if (actorScreenX < margin) {
      targetPan = targetPan + (margin - actorScreenX)
    } else if (actorScreenX > stageW - margin) {
      targetPan = targetPan - (actorScreenX - (stageW - margin))
    }

    targetPan = Math.max(state.minPanX, Math.min(0, targetPan))
    if (Math.abs(targetPan - state.panX) > 5) {
      animatePanTo(targetPan, 800)
    }
  }

  function animatePanTo(target, duration) {
    if (state.panRAF) { cancelAnimationFrame(state.panRAF); state.panRAF = null }
    var start = state.panX
    var startTime = Date.now()
    function step() {
      var t = Math.min(1, (Date.now() - startTime) / duration)
      var ease = 1 - Math.pow(1 - t, 3)
      setPanX(start + (target - start) * ease)
      if (t < 1) {
        state.panRAF = requestAnimationFrame(step)
      } else {
        state.panRAF = null
      }
    }
    state.panRAF = requestAnimationFrame(step)
  }

  // ========== 角色立绘弹窗 ==========
  function showActorArtModal() {
    var overlay = el('div', 'ph-modal-overlay')
    var modal = el('div', 'ph-modal')

    var header = el('div', 'ph-modal-header')
    header.appendChild(el('h3', '', { text: '角色立绘' }))
    var closeBtn = el('button', 'close', { html: svgIcon(ICONS.close, 22) })
    closeBtn.onclick = function () { overlay.remove() }
    header.appendChild(closeBtn)
    modal.appendChild(header)

    var body = el('div', 'ph-modal-body')
    var char = state.activeCharacter

    var previewBox = el('div', '', {
      style: 'width:120px;height:120px;margin:0 auto 16px;border-radius:16px;overflow:hidden;background:#f1f5f9;display:flex;align-items:center;justify-content:center;border:2px dashed #cbd5e1;position:relative;'
    })
    previewBox.id = 'ph-sprite-preview'

    function refreshPreview() {
      previewBox.innerHTML = ''
      var url = getActorImage()
      if (url) {
        var img = el('img', '', { style: 'width:100%;height:100%;object-fit:contain;' })
        img.src = url
        img.onerror = function () {
          previewBox.innerHTML = ''
          previewBox.appendChild(el('span', '', { text: '🧑', style: 'font-size:48px;' }))
        }
        previewBox.appendChild(img)
      } else {
        previewBox.appendChild(el('span', '', { text: '🧑', style: 'font-size:48px;' }))
      }
    }
    refreshPreview()
    body.appendChild(previewBox)

    if (char) {
      var info = el('div', '', { style: 'text-align:center;margin-bottom:16px;' })
      info.appendChild(el('p', '', { text: char.name || '', style: 'font-size:15px;font-weight:700;color:#1e293b;' }))
      if (char.handle) info.appendChild(el('p', '', { text: char.handle, style: 'font-size:12px;color:#94a3b8;margin-top:2px;' }))
      body.appendChild(info)
    }

    var uploadRow = el('div', '', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;' })

    var uploadBtn = el('button', '', {
      style: 'padding:14px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .15s;'
    })
    uploadBtn.innerHTML = svgIcon(ICONS.image, 26)
    uploadBtn.appendChild(el('span', '', { text: '上传立绘', style: 'font-size:12px;font-weight:700;color:#475569;' }))
    uploadBtn.appendChild(el('span', '', { text: '从设备选择图片', style: 'font-size:10px;color:#94a3b8;' }))
    uploadBtn.onclick = function () { triggerSpriteUpload(refreshPreview) }
    uploadRow.appendChild(uploadBtn)

    var urlBtn = el('button', '', {
      style: 'padding:14px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;display:flex;flex-direction:column;align-items:center;gap:6px;transition:all .15s;'
    })
    urlBtn.innerHTML = svgIcon(ICONS.sparkle, 26)
    urlBtn.appendChild(el('span', '', { text: '图片链接', style: 'font-size:12px;font-weight:700;color:#475569;' }))
    urlBtn.appendChild(el('span', '', { text: '粘贴图床 URL', style: 'font-size:10px;color:#94a3b8;' }))
    urlBtn.onclick = function () { showSpriteUrlInput(refreshPreview) }
    uploadRow.appendChild(urlBtn)

    body.appendChild(uploadRow)

    if (state.activeCharId && state.customSprites[state.activeCharId]) {
      var resetRow = el('div', '', { style: 'display:flex;gap:8px;' })
      var resetBtn = el('button', '', {
        text: '恢复默认头像',
        style: 'flex:1;padding:10px;border-radius:12px;background:#fef2f2;color:#ef4444;font-size:12px;font-weight:700;border:1px solid #fecaca;'
      })
      resetBtn.onclick = function () {
        delete state.customSprites[state.activeCharId]
        saveCustomSprites()
        refreshPreview()
        refreshActorImg()
        if (rocheApi) rocheApi.ui.toast('已恢复默认头像')
      }
      resetRow.appendChild(resetBtn)
      body.appendChild(resetRow)
    }

    modal.appendChild(body)

    var footer = el('div', 'ph-modal-footer')
    var okBtn = el('button', '', { text: '完成', style: 'background:#6366f1;color:#fff;' })
    okBtn.onclick = function () { overlay.remove() }
    footer.appendChild(okBtn)
    modal.appendChild(footer)

    overlay.appendChild(modal)
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove() })
    root.appendChild(overlay)
  }

  function triggerSpriteUpload(refreshPreview) {
    var input = el('input', '')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    input.onchange = function (e) {
      var file = e.target.files[0]
      if (!file) return
      var reader = new FileReader()
      reader.onload = function (ev) {
        var dataUrl = ev.target.result
        if (state.activeCharId) {
          state.customSprites[state.activeCharId] = dataUrl
          saveCustomSprites()
          refreshPreview()
          refreshActorImg()
          if (rocheApi) rocheApi.ui.toast('立绘已更新')
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function showSpriteUrlInput(refreshPreview) {
    var urlOverlay = el('div', 'ph-modal-overlay')
    var urlModal = el('div', 'ph-modal')

    var header = el('div', 'ph-modal-header')
    header.appendChild(el('h3', '', { text: '粘贴图片链接' }))
    var closeBtn = el('button', 'close', { html: svgIcon(ICONS.close, 22) })
    closeBtn.onclick = function () { urlOverlay.remove() }
    header.appendChild(closeBtn)
    urlModal.appendChild(header)

    var body = el('div', 'ph-modal-body')
    var group = el('div', 'ph-input-group')
    group.appendChild(el('label', '', { text: '图片 URL' }))
    var input = el('input', '')
    input.type = 'text'
    input.placeholder = 'https://...'
    input.style.cssText = 'width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;font-size:13px;color:#1e293b;outline:none;'
    group.appendChild(input)
    body.appendChild(group)
    urlModal.appendChild(body)

    var footer = el('div', 'ph-modal-footer')
    var saveBtn = el('button', '', { text: '确认使用', style: 'background:#6366f1;color:#fff;' })
    saveBtn.onclick = function () {
      var url = input.value.trim()
      if (!url) {
        if (rocheApi) rocheApi.ui.toast('请输入图片链接')
        return
      }
      if (state.activeCharId) {
        state.customSprites[state.activeCharId] = url
        saveCustomSprites()
        refreshPreview()
        refreshActorImg()
        if (rocheApi) rocheApi.ui.toast('立绘已更新')
      }
      urlOverlay.remove()
    }
    footer.appendChild(saveBtn)
    urlModal.appendChild(footer)

    urlOverlay.appendChild(urlModal)
    urlOverlay.addEventListener('click', function (e) { if (e.target === urlOverlay) urlOverlay.remove() })
    root.appendChild(urlOverlay)
  }

  function refreshActorImg() {
    var actor = document.getElementById('ph-actor')
    if (!actor) return
    var img = actor.querySelector('img')
    var newUrl = getActorImage()
    if (img && newUrl) {
      img.src = newUrl
      img.style.display = ''
    }
  }

  // ========== 拖拽逻辑 ==========
  function handlePointerDown(e, id) {
    if (state.mode !== 'edit') return
    e.preventDefault()
    e.stopPropagation()

    var item = state.items.find(function (i) { return i.id === id })
    if (!item) return

    var stage = document.getElementById('ph-stage')
    if (!stage) return
    var rect = stage.getBoundingClientRect()

    state.draggingId = id
    state.dragStart = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
      width: rect.width * ROOM_WIDTH_RATIO,
      height: rect.height,
    }

    var elem = e.currentTarget
    state.dragElement = elem
    elem.setPointerCapture(e.pointerId)
    elem.classList.add('dragging')
    elem.style.transition = 'none'
    elem.style.zIndex = '100'
    elem.style.willChange = 'left, top'

    state.selectedItemId = id
    renderEditToolbar()
    refreshItemSelection()

    elem.addEventListener('pointermove', handlePointerMove)
    elem.addEventListener('pointerup', handlePointerUp)
    elem.addEventListener('pointercancel', handlePointerUp)
  }

  function handlePointerMove(e) {
    if (!state.draggingId || !state.dragStart) return
    e.preventDefault()

    var ds = state.dragStart
    var deltaX = e.clientX - ds.startX
    var deltaY = e.clientY - ds.startY

    var nextX = Math.max(0, Math.min(100, ds.initialX + (deltaX / ds.width) * 100))
    var nextY = Math.max(0, Math.min(100, ds.initialY + (deltaY / ds.height) * 100))

    state.pendingPos = { x: nextX, y: nextY }

    if (state.dragElement && !state.rafId) {
      state.rafId = requestAnimationFrame(function () {
        if (state.dragElement && state.pendingPos) {
          state.dragElement.style.left = state.pendingPos.x + '%'
          state.dragElement.style.top = state.pendingPos.y + '%'
        }
        state.rafId = null
      })
    }
  }

  function handlePointerUp(e) {
    if (!state.draggingId) return

    if (state.rafId) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }

    if (state.dragElement) {
      state.dragElement.classList.remove('dragging')
      state.dragElement.style.transition = ''
      state.dragElement.style.zIndex = ''
      state.dragElement.style.willChange = ''
      state.dragElement.removeEventListener('pointermove', handlePointerMove)
      state.dragElement.removeEventListener('pointerup', handlePointerUp)
      state.dragElement.removeEventListener('pointercancel', handlePointerUp)
    }

    if (state.pendingPos) {
      var dragId = state.draggingId
      state.items = state.items.map(function (item) {
        if (item.id === dragId) {
          return Object.assign({}, item, { x: state.pendingPos.x, y: state.pendingPos.y })
        }
        return item
      })
      saveRoomData()
    }

    state.draggingId = null
    state.dragStart = null
    state.dragElement = null
    state.pendingPos = null

    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
  }

  function refreshItemSelection() {
    document.querySelectorAll('.ph-item').forEach(function (el) {
      el.classList.remove('selected')
      var label = el.querySelector('.selected-label')
      if (label) label.remove()
    })
    if (state.selectedItemId) {
      var sel = document.querySelector('.ph-item[data-id="' + state.selectedItemId + '"]')
      if (sel) {
        sel.classList.add('selected')
        sel.appendChild(el('div', 'selected-label', { text: '选中' }))
      }
    }
  }

  // ========== 编辑工具栏 ==========
  function createEditToolbar() {
    var toolbar = el('div', 'ph-edit-toolbar')
    if (state.isToolbarCollapsed) toolbar.classList.add('collapsed')

    var handle = el('div', 'ph-toolbar-handle')
    handle.appendChild(el('div'))
    handle.onclick = function () {
      state.isToolbarCollapsed = !state.isToolbarCollapsed
      toolbar.classList.toggle('collapsed', state.isToolbarCollapsed)
    }
    toolbar.appendChild(handle)

    var content = el('div', 'ph-toolbar-content')
    content.id = 'ph-toolbar-content'
    toolbar.appendChild(content)

    renderToolbarContent(content)
    return toolbar
  }

  function renderEditToolbar() {
    var content = document.getElementById('ph-toolbar-content')
    if (!content) return
    content.innerHTML = ''
    renderToolbarContent(content)
  }

  function renderToolbarContent(content) {
    if (state.selectedItemId) {
      var sel = state.items.find(function (i) { return i.id === state.selectedItemId })
      if (sel) {
        content.appendChild(createItemEditor(sel))
        return
      }
    }

    // 选中窗户时的编辑面板
    if (state.selectedWindowId) {
      var selWin = state.windows.find(function (w) { return w.id === state.selectedWindowId })
      if (selWin) {
        content.appendChild(createWindowEditor(selWin))
        return
      }
    }

    var actions = el('div', 'ph-quick-actions')

    var libBtn = createQuickBtn('#6366f1', '+', '家具库')
    libBtn.onclick = function () { showLibrary() }
    actions.appendChild(libBtn)

    var customBtn = createQuickBtn('#a855f7', svgIcon(ICONS.sparkle, 24), '自定义')
    customBtn.onclick = function () { showCustomModal() }
    actions.appendChild(customBtn)

    var winBtn = createQuickBtn('#38bdf8', '🪟', '窗户')
    winBtn.onclick = function () { addWindow() }
    actions.appendChild(winBtn)

    var actorBtn = createQuickBtn('#ec4899', svgIcon(ICONS.camera, 24), '角色信息')
    actorBtn.onclick = function () { showActorArtModal() }
    actions.appendChild(actorBtn)

    var wallBtn = createQuickBtn('#e2e8f0', svgIcon(ICONS.image, 24), '换墙纸', '#64748b')
    wallBtn.onclick = function () { triggerImageUpload('wall') }
    actions.appendChild(wallBtn)

    var floorBtn = createQuickBtn('#e2e8f0', '🧱', '换地板', '#64748b')
    floorBtn.onclick = function () { triggerImageUpload('floor') }
    actions.appendChild(floorBtn)

    content.appendChild(actions)

    // 窗户样式预设
    var winRow = el('div', 'ph-preset-row')
    winRow.appendChild(el('h4', '', { text: '窗户样式（点选中的窗户换样式）' }))
    var winList = el('div', 'ph-preset-list')
    WINDOW_PRESETS.forEach(function (wp, idx) {
      var swatch = el('button', 'ph-preset-swatch')
      swatch.style.background = wp.bg
      swatch.style.border = '3px solid ' + wp.frame
      swatch.style.width = '48px'
      swatch.style.height = '56px'
      swatch.title = wp.name
      swatch.onclick = function () {
        if (state.selectedWindowId) {
          // 给选中的窗户换样式
          state.windows = state.windows.map(function (w) {
            if (w.id === state.selectedWindowId) return Object.assign({}, w, { styleIdx: idx })
            return w
          })
          saveRoomData()
          renderRoomPage()
          if (rocheApi) rocheApi.ui.toast('窗户样式：' + wp.name)
        } else {
          // 没选中窗户时，添加一扇新窗户
          addWindowWithStyle(idx)
        }
      }
      winList.appendChild(swatch)
    })
    winRow.appendChild(winList)
    content.appendChild(winRow)

    var wallRow = el('div', 'ph-preset-row')
    wallRow.appendChild(el('h4', '', { text: '墙面预设' }))
    var wallList = el('div', 'ph-preset-list')
    WALLPAPER_PRESETS.forEach(function (wp) {
      var swatch = el('button', 'ph-preset-swatch')
      swatch.style.background = wp.value
      swatch.title = wp.name
      swatch.onclick = function () {
        state.wallImage = wp.value
        var wall = document.getElementById('ph-wall')
        if (wall) wall.style.background = wp.value
        saveRoomData()
        if (rocheApi) rocheApi.ui.toast('墙纸已切换：' + wp.name)
      }
      wallList.appendChild(swatch)
    })
    wallRow.appendChild(wallList)
    content.appendChild(wallRow)

    var floorRow = el('div', 'ph-preset-row')
    floorRow.appendChild(el('h4', '', { text: '地板预设' }))
    var floorList = el('div', 'ph-preset-list')
    FLOOR_PRESETS.forEach(function (fp) {
      var swatch = el('button', 'ph-preset-swatch')
      swatch.style.background = fp.value
      swatch.title = fp.name
      swatch.onclick = function () {
        state.floorImage = fp.value
        var floor = document.getElementById('ph-floor')
        if (floor) floor.style.background = fp.value
        saveRoomData()
        if (rocheApi) rocheApi.ui.toast('地板已切换：' + fp.name)
      }
      floorList.appendChild(swatch)
    })
    floorRow.appendChild(floorList)
    content.appendChild(floorRow)
  }

  // 窗户编辑面板
  function createWindowEditor(selWin) {
    var editor = el('div', 'ph-item-editor')
    var preset = WINDOW_PRESETS[selWin.styleIdx] || WINDOW_PRESETS[0]

    var header = el('div', 'ph-editor-header')
    header.appendChild(el('span', 'title', { text: '窗户 · ' + preset.name }))
    var actions = el('div', 'ph-editor-actions')
    var delBtn = el('button', 'del', { text: '删除' })
    delBtn.onclick = function () { deleteSelectedWindow() }
    actions.appendChild(delBtn)
    header.appendChild(actions)
    editor.appendChild(header)

    // 样式切换行
    var styleRow = el('div', '', { style: 'display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;' })
    WINDOW_PRESETS.forEach(function (wp, idx) {
      var swatch = el('button', 'ph-preset-swatch')
      swatch.style.background = wp.bg
      swatch.style.border = '3px solid ' + wp.frame
      swatch.style.width = '44px'
      swatch.style.height = '52px'
      swatch.style.flexShrink = '0'
      swatch.title = wp.name
      if (idx === selWin.styleIdx) {
        swatch.style.outline = '2px solid #6366f1'
        swatch.style.outlineOffset = '2px'
      }
      swatch.onclick = function () {
        state.windows = state.windows.map(function (w) {
          if (w.id === selWin.id) return Object.assign({}, w, { styleIdx: idx })
          return w
        })
        saveRoomData()
        renderRoomPage()
        if (rocheApi) rocheApi.ui.toast('窗户样式：' + wp.name)
      }
      styleRow.appendChild(swatch)
    })
    editor.appendChild(styleRow)

    editor.appendChild(el('p', '', { text: '拖动窗户可移动位置，点击样式可切换外观', style: 'font-size:9px;color:#cbd5e1;text-align:center;' }))
    return editor
  }

  function addWindow() {
    addWindowWithStyle(0)
  }

  function addWindowWithStyle(styleIdx) {
    var newWin = {
      id: 'win-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      styleIdx: styleIdx,
      x: 20 + Math.random() * 50,
      y: 6,
    }
    state.windows.push(newWin)
    state.selectedWindowId = newWin.id
    saveRoomData()
    renderRoomPage()
    if (rocheApi) rocheApi.ui.toast('已添加窗户')
  }

  function deleteSelectedWindow() {
    if (!state.selectedWindowId) return
    state.windows = state.windows.filter(function (w) { return w.id !== state.selectedWindowId })
    state.selectedWindowId = null
    saveRoomData()
    renderRoomPage()
    if (rocheApi) rocheApi.ui.toast('窗户已删除')
  }

  function createQuickBtn(bgColor, icon, label, textColor) {
    var btn = el('button', 'ph-quick-btn')
    var box = el('div', 'icon-box')
    box.style.background = bgColor
    if (textColor) box.style.color = textColor
    box.innerHTML = icon
    btn.appendChild(box)
    btn.appendChild(el('span', 'label', { text: label }))
    return btn
  }

  // ========== 物品编辑器 ==========
  function createItemEditor(sel) {
    var editor = el('div', 'ph-item-editor')

    var header = el('div', 'ph-editor-header')
    header.appendChild(el('span', 'title', { text: '调整 · ' + sel.name }))
    var actions = el('div', 'ph-editor-actions')
    var dupBtn = el('button', 'dup', { text: '复制' })
    dupBtn.onclick = function () { duplicateSelectedItem() }
    var delBtn = el('button', 'del', { text: '删除' })
    delBtn.onclick = function () { deleteSelectedItem() }
    actions.appendChild(dupBtn)
    actions.appendChild(delBtn)
    header.appendChild(actions)
    editor.appendChild(header)

    var sliderGroup = el('div', 'ph-slider-group')
    var sliderCol = el('div', 'ph-slider-col')

    var scaleRow = el('div', 'ph-slider-row')
    scaleRow.appendChild(el('label', '', { html: '缩放 <span class="val">' + Math.round(sel.scale * 100) + '%</span>' }))
    var scaleInput = el('input', '')
    scaleInput.type = 'range'
    scaleInput.min = '0.2'
    scaleInput.max = '6'
    scaleInput.step = '0.05'
    scaleInput.value = sel.scale
    scaleInput.oninput = function () { updateSelectedItem({ scale: parseFloat(scaleInput.value) }) }
    scaleRow.appendChild(scaleInput)
    sliderCol.appendChild(scaleRow)

    var rotRow = el('div', 'ph-slider-row')
    rotRow.appendChild(el('label', '', { html: '旋转 <span class="val">' + Math.round(sel.rotation || 0) + '°</span>' }))
    var rotInput = el('input', '')
    rotInput.type = 'range'
    rotInput.min = '-180'
    rotInput.max = '180'
    rotInput.step = '1'
    rotInput.value = sel.rotation || 0
    rotInput.oninput = function () { updateSelectedItem({ rotation: parseInt(rotInput.value) }) }
    rotRow.appendChild(rotInput)
    sliderCol.appendChild(rotRow)
    sliderGroup.appendChild(sliderCol)

    var numpad = el('div', 'ph-numpad')
    numpad.appendChild(el('span', 'spacer'))
    numpad.appendChild(makeNudgeBtn('↑', 0, -1))
    numpad.appendChild(el('span', 'spacer'))
    numpad.appendChild(makeNudgeBtn('←', -1, 0))
    numpad.appendChild(el('span', 'spacer', { text: '1%' }))
    numpad.appendChild(makeNudgeBtn('→', 1, 0))
    numpad.appendChild(el('span', 'spacer'))
    numpad.appendChild(makeNudgeBtn('↓', 0, 1))
    numpad.appendChild(el('span', 'spacer'))
    sliderGroup.appendChild(numpad)
    editor.appendChild(sliderGroup)

    var isRug = sel.type === 'rug'
    var typeRow = el('div', '', { style: 'display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border-radius:12px;padding:8px 12px;border:1px solid #f1f5f9;' })
    typeRow.appendChild(el('span', '', { text: '图层类型' + (isRug ? '：地毯（垫底）' : ''), style: 'font-size:10px;color:#94a3b8;' }))
    var typeBtn = el('button', '', { text: isRug ? '改回普通家具' : '设为地毯', style: 'font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;' + (isRug ? 'background:#f3e8ff;color:#a855f7;' : 'background:#e2e8f0;color:#64748b;') })
    typeBtn.onclick = function () { updateSelectedItem({ type: isRug ? 'furniture' : 'rug' }) }
    typeRow.appendChild(typeBtn)
    editor.appendChild(typeRow)

    editor.appendChild(el('p', '', { text: '小技巧：拖动移动位置，滚轮缩放，滑杆微调，左右滑动查看宽景房间', style: 'font-size:9px;color:#cbd5e1;text-align:center;' }))

    return editor
  }

  function makeNudgeBtn(text, dx, dy) {
    var btn = el('button', '', { text: text })
    btn.onclick = function () { nudgeSelectedItem(dx, dy) }
    return btn
  }

  function nudgeSelectedItem(dx, dy) {
    var sel = state.items.find(function (i) { return i.id === state.selectedItemId })
    if (!sel) return
    updateSelectedItem({
      x: Math.max(0, Math.min(100, sel.x + dx)),
      y: Math.max(0, Math.min(100, sel.y + dy)),
    })
  }

  function updateSelectedItem(updates) {
    if (!state.selectedItemId) return
    state.items = state.items.map(function (item) {
      if (item.id === state.selectedItemId) {
        return Object.assign({}, item, updates)
      }
      return item
    })
    saveRoomData()
    var elem = document.querySelector('.ph-item[data-id="' + state.selectedItemId + '"]')
    var sel = state.items.find(function (i) { return i.id === state.selectedItemId })
    if (elem && sel) {
      elem.style.left = sel.x + '%'
      elem.style.top = sel.y + '%'
      elem.style.width = (80 * sel.scale) + 'px'
      elem.style.transform = 'translate(-50%, -100%) rotate(' + (sel.rotation || 0) + 'deg)'
      if (sel.type === 'rug') {
        elem.style.zIndex = String(1 + Math.floor(sel.y / 10))
      } else {
        elem.style.zIndex = String(Math.floor(sel.y))
      }
    }
    renderEditToolbar()
  }

  function deleteSelectedItem() {
    if (!state.selectedItemId) return
    state.items = state.items.filter(function (i) { return i.id !== state.selectedItemId })
    state.selectedItemId = null
    saveRoomData()
    renderRoomPage()
    if (rocheApi) rocheApi.ui.toast('已删除')
  }

  function duplicateSelectedItem() {
    var sel = state.items.find(function (i) { return i.id === state.selectedItemId })
    if (!sel) return
    var copy = Object.assign({}, sel, {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      x: Math.min(96, sel.x + 4),
      y: Math.min(100, sel.y + 4),
    })
    state.items.push(copy)
    state.selectedItemId = copy.id
    saveRoomData()
    renderRoomPage()
    if (rocheApi) rocheApi.ui.toast('已复制：' + sel.name)
  }

  // ========== 家具库弹窗 ==========
  function showLibrary() {
    var overlay = el('div', 'ph-modal-overlay')
    var modal = el('div', 'ph-modal')

    var header = el('div', 'ph-modal-header')
    header.appendChild(el('h3', '', { text: '家具超市' }))
    var closeBtn = el('button', 'close', { html: svgIcon(ICONS.close, 22) })
    closeBtn.onclick = function () { overlay.remove() }
    header.appendChild(closeBtn)
    modal.appendChild(header)

    var body = el('div', 'ph-modal-body')

    var allCategories = {}
    for (var cat in FURNITURE_PRESETS) {
      allCategories[cat] = FURNITURE_PRESETS[cat]
    }
    if (state.customAssets.length > 0) {
      allCategories.custom = state.customAssets
    }

    for (var category in allCategories) {
      var assets = allCategories[category]
      if (!assets || assets.length === 0) continue

      var section = el('div', 'ph-library-section')
      var h4 = el('h4', '')
      h4.appendChild(el('span', '', { text: CATEGORY_LABELS[category] || category }))
      h4.appendChild(el('span', 'count', { text: String(assets.length) }))
      section.appendChild(h4)

      var grid = el('div', 'ph-library-grid')
      assets.forEach(function (asset) {
        var item = el('button', 'ph-library-item')
        var box = el('div', 'icon-box')
        if (asset.image && (asset.image.startsWith('http') || asset.image.startsWith('data') || asset.image.startsWith('blob'))) {
          var img = el('img')
          img.src = asset.image
          box.appendChild(img)
        } else {
          box.textContent = asset.emoji || asset.image || '📦'
        }
        item.appendChild(box)
        item.appendChild(el('span', 'name', { text: asset.name }))
        item.onclick = function () {
          addItem(asset, category)
        }
        grid.appendChild(item)
      })
      section.appendChild(grid)
      body.appendChild(section)
    }

    modal.appendChild(body)

    var footer = el('div', 'ph-modal-footer')
    var doneBtn = el('button', '', { text: '摆完了，关闭', style: 'background:#6366f1;color:#fff;' })
    doneBtn.onclick = function () { overlay.remove() }
    footer.appendChild(doneBtn)
    modal.appendChild(footer)

    overlay.appendChild(modal)
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove() })
    root.appendChild(overlay)
  }

  function addItem(asset, category) {
    // 在当前可视区域中心放置新家具
    var stage = document.getElementById('ph-stage')
    var world = document.getElementById('ph-room-world')
    var centerX = 44
    if (stage && world) {
      var visibleStart = (-state.panX / world.offsetWidth) * 100
      var visibleEnd = visibleStart + (stage.offsetWidth / world.offsetWidth) * 100
      centerX = (visibleStart + visibleEnd) / 2
    }

    var newItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: asset.name,
      type: category === 'rug' || asset.isRug ? 'rug' : (category === 'custom' ? (asset.itemType || 'furniture') : category),
      image: asset.image && (asset.image.startsWith('http') || asset.image.startsWith('data') || asset.image.startsWith('blob')) ? asset.image : '',
      emoji: asset.emoji || (asset.image && !asset.image.startsWith('http') ? asset.image : '📦'),
      x: centerX + (Math.random() - 0.5) * 8,
      y: 46 + Math.random() * 12,
      scale: asset.defaultScale || 1.0,
      rotation: 0,
      isInteractive: true,
      description: asset.description || '',
    }
    state.items.push(newItem)
    saveRoomData()
    renderRoomPage()
    if (rocheApi) rocheApi.ui.toast('已添加：' + asset.name)
  }

  // ========== 自定义家具弹窗 ==========
  function showCustomModal() {
    state.customName = ''
    state.customUrl = ''
    state.customEmoji = ''
    state.customImageData = ''
    state.customType = 'furniture'

    var overlay = el('div', 'ph-modal-overlay')
    var modal = el('div', 'ph-modal')

    var header = el('div', 'ph-modal-header')
    header.appendChild(el('h3', '', { text: '自定义家具' }))
    var closeBtn = el('button', 'close', { html: svgIcon(ICONS.close, 22) })
    closeBtn.onclick = function () { overlay.remove() }
    header.appendChild(closeBtn)
    modal.appendChild(header)

    var body = el('div', 'ph-modal-body')
    var form = el('div', 'ph-custom-form')

    var top = el('div', 'ph-custom-top')
    var uploadBox = el('div', 'ph-upload-box')
    uploadBox.id = 'ph-upload-box'
    uploadBox.appendChild(el('span', 'placeholder', { text: '+ 上传' }))
    uploadBox.onclick = function () { triggerCustomItemUpload(uploadBox) }
    top.appendChild(uploadBox)

    var fields = el('div', 'ph-custom-fields')

    var urlGroup = el('div', 'ph-input-group')
    urlGroup.appendChild(el('label', '', { text: '图片 URL (或直接上传)' }))
    var urlInput = el('input', '')
    urlInput.type = 'text'
    urlInput.placeholder = 'https://...'
    urlInput.value = state.customUrl
    urlInput.oninput = function () {
      state.customUrl = urlInput.value
      if (urlInput.value.trim()) {
        state.customImageData = ''
        updateUploadPreview(uploadBox, urlInput.value)
      } else {
        updateUploadPreview(uploadBox, '')
      }
    }
    urlGroup.appendChild(urlInput)
    fields.appendChild(urlGroup)

    var nameGroup = el('div', 'ph-input-group')
    nameGroup.appendChild(el('label', '', { text: '物品名称' }))
    var nameInput = el('input', '')
    nameInput.type = 'text'
    nameInput.placeholder = '例如: 懒人沙发'
    nameInput.value = state.customName
    nameInput.oninput = function () { state.customName = nameInput.value }
    nameGroup.appendChild(nameInput)
    fields.appendChild(nameGroup)

    var emojiGroup = el('div', 'ph-input-group')
    emojiGroup.appendChild(el('label', '', { text: 'Emoji 图标 (无图片时使用)' }))
    var emojiInput = el('input', '')
    emojiInput.type = 'text'
    emojiInput.placeholder = '🛋️'
    emojiInput.value = state.customEmoji
    emojiInput.oninput = function () { state.customEmoji = emojiInput.value }
    emojiGroup.appendChild(emojiInput)
    fields.appendChild(emojiGroup)

    var typeGroup = el('div', 'ph-input-group')
    typeGroup.appendChild(el('label', '', { text: '物品类型' }))
    var typeToggle = el('div', 'ph-type-toggle')
    var furnitureBtn = el('button', 'active', { text: '家具' })
    var rugBtn = el('button', '', { text: '地毯' })
    furnitureBtn.onclick = function () {
      state.customType = 'furniture'
      furnitureBtn.classList.add('active')
      rugBtn.classList.remove('active')
    }
    rugBtn.onclick = function () {
      state.customType = 'rug'
      rugBtn.classList.add('active')
      furnitureBtn.classList.remove('active')
    }
    typeToggle.appendChild(furnitureBtn)
    typeToggle.appendChild(rugBtn)
    typeGroup.appendChild(typeToggle)
    fields.appendChild(typeGroup)

    top.appendChild(fields)
    form.appendChild(top)

    var descGroup = el('div', 'ph-input-group')
    descGroup.appendChild(el('label', '', { text: '物品描述' }))
    var descInput = el('input', '')
    descInput.type = 'text'
    descInput.placeholder = '例如: 一个很软的沙发，坐上去就陷进去了。'
    descInput.oninput = function () { state.customDesc = descInput.value }
    descGroup.appendChild(descInput)
    form.appendChild(descGroup)

    body.appendChild(form)
    modal.appendChild(body)

    var footer = el('div', 'ph-modal-footer')
    var addBtn = el('button', '', { text: '添加到房间', style: 'background:#a855f7;color:#fff;' })
    addBtn.onclick = function () { saveCustomItem(overlay) }
    footer.appendChild(addBtn)
    modal.appendChild(footer)

    overlay.appendChild(modal)
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove() })
    root.appendChild(overlay)
  }

  function triggerCustomItemUpload(uploadBox) {
    var input = el('input', '')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    input.onchange = function (e) {
      var file = e.target.files[0]
      if (!file) return
      var reader = new FileReader()
      reader.onload = function (ev) {
        var dataUrl = ev.target.result
        state.customImageData = dataUrl
        state.customUrl = ''
        var urlInput = document.querySelector('.ph-custom-fields input[type="text"][placeholder="https://..."]')
        if (urlInput) urlInput.value = ''
        uploadBox.innerHTML = ''
        var img = el('img')
        img.src = dataUrl
        uploadBox.appendChild(img)
        if (rocheApi) rocheApi.ui.toast('图片已上传')
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function updateUploadPreview(box, url) {
    box.innerHTML = ''
    if (state.customImageData) {
      var uploadImg = el('img')
      uploadImg.src = state.customImageData
      box.appendChild(uploadImg)
      return
    }
    if (url && (url.startsWith('http') || url.startsWith('data'))) {
      var img = el('img')
      img.src = url
      img.onerror = function () {
        box.innerHTML = ''
        box.appendChild(el('span', 'placeholder', { text: '+ 上传' }))
      }
      box.appendChild(img)
    } else {
      box.appendChild(el('span', 'placeholder', { text: '+ 上传' }))
    }
  }

  function saveCustomItem(overlay) {
    var name = state.customName.trim()
    var url = state.customUrl.trim()
    var emoji = state.customEmoji.trim()
    var uploadImg = state.customImageData

    if (!name) {
      if (rocheApi) rocheApi.ui.toast('请填写物品名称')
      return
    }
    if (!uploadImg && !url && !emoji) {
      if (rocheApi) rocheApi.ui.toast('请上传图片、填图片 URL 或 Emoji')
      return
    }

    var imageSrc = uploadImg || url || ''

    var asset = {
      id: 'asset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: name,
      image: imageSrc,
      emoji: emoji || '📦',
      defaultScale: 1.0,
      itemType: state.customType,
    }
    state.customAssets.push(asset)
    saveCustomAssets()
    addItem(asset, 'custom')
    overlay.remove()
    if (rocheApi) rocheApi.ui.toast('已添加：' + name)
  }

  // ========== 图片上传 ==========
  function triggerImageUpload(target) {
    var input = el('input', '')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    input.onchange = function (e) {
      var file = e.target.files[0]
      if (!file) return
      var reader = new FileReader()
      reader.onload = function (ev) {
        var dataUrl = ev.target.result
        if (target === 'wall') {
          state.wallImage = 'url(' + dataUrl + ')'
          var wall = document.getElementById('ph-wall')
          if (wall) wall.style.background = state.wallImage
        } else if (target === 'floor') {
          state.floorImage = 'url(' + dataUrl + ')'
          var floor = document.getElementById('ph-floor')
          if (floor) floor.style.background = state.floorImage
        }
        saveRoomData()
        if (rocheApi) rocheApi.ui.toast(target === 'wall' ? '墙纸已更新' : '地板已更新')
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  // ========== 加载角色列表 ==========
  async function loadCharacters() {
    if (!rocheApi) return
    try {
      var chars = await rocheApi.character.list()
      state.characters = chars || []
    } catch (e) {
      state.characters = []
    }
  }

  // ========== 插件注册 ==========
  window.RochePlugin = window.RochePlugin || {}
  window.RochePlugin.register = window.RochePlugin.register || function () {}

  if (window.RochePlugin && window.RochePlugin.register) {
    window.RochePlugin.register({
      id: 'pixel-house',
      name: '像素小屋',
      version: '4.1.0',
      apps: [
        {
          id: 'pixel-house-home',
          name: '像素小屋',
          icon: 'home',
          iconImage: '',
          async mount(container, roche) {
            rocheApi = roche
            root = el('div', 'roche-plugin-pixel-house')

            styleEl = el('style')
            styleEl.textContent = CSS
            document.head.appendChild(styleEl)

            container.innerHTML = ''
            container.appendChild(root)

            await loadCharacters()
            await loadCustomAssets()
            await loadCustomSprites()

            renderSelectPage()
          },
          async unmount(container, roche) {
            if (state.panRAF) { cancelAnimationFrame(state.panRAF); state.panRAF = null }
            if (styleEl && styleEl.parentNode) {
              styleEl.parentNode.removeChild(styleEl)
              styleEl = null
            }
            if (root) {
              root.innerHTML = ''
              root = null
            }
            container.replaceChildren()
          },
        },
      ],
    })
  }
})()
