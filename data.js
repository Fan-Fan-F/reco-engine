/* 商品目录与演示行为数据（可复现伪随机生成） */

var CATALOG = [
  { id: 'p01', name: '复古胶片相机', cat: '数码', price: 1299 },
  { id: 'p02', name: '三脚架 铝合金', cat: '数码', price: 199 },
  { id: 'p03', name: '相机清洁套装', cat: '数码', price: 59 },
  { id: 'p04', name: 'SD 存储卡 128G', cat: '数码', price: 129 },
  { id: 'p05', name: '摄影构图指南', cat: '图书', price: 68 },
  { id: 'p06', name: '机械键盘 青轴', cat: '数码', price: 349 },
  { id: 'p07', name: '人体工学鼠标', cat: '数码', price: 159 },
  { id: 'p08', name: '显示器挂灯', cat: '数码', price: 229 },
  { id: 'p09', name: '桌面收纳架', cat: '家居', price: 79 },
  { id: 'p10', name: '手冲咖啡壶', cat: '厨电', price: 189 },
  { id: 'p11', name: '精品咖啡豆 500g', cat: '食品', price: 98 },
  { id: 'p12', name: '法压壶 600ml', cat: '厨电', price: 89 },
  { id: 'p13', name: '电动磨豆机', cat: '厨电', price: 259 },
  { id: 'p14', name: '冷萃咖啡瓶', cat: '厨电', price: 119 },
  { id: 'p15', name: '拿铁拉花杯', cat: '厨电', price: 45 },
  { id: 'p16', name: '瑜伽垫 8mm', cat: '运动', price: 89 },
  { id: 'p17', name: '泡沫轴 45cm', cat: '运动', price: 59 },
  { id: 'p18', name: '阻力带五件套', cat: '运动', price: 69 },
  { id: 'p19', name: '运动水壶 1L', cat: '运动', price: 39 },
  { id: 'p20', name: '健身环大冒险', cat: '游戏', price: 499 },
  { id: 'p21', name: '露营天幕 3×3m', cat: '户外', price: 269 },
  { id: 'p22', name: '折叠月亮椅', cat: '户外', price: 139 },
  { id: 'p23', name: '营地氛围灯串', cat: '户外', price: 49 },
  { id: 'p24', name: '户外钛杯 450ml', cat: '户外', price: 99 }
];

var USER_NAMES = ['摄影小周', '咖啡阿May', '健身老王', '露营阿豪', '桌面美学君', '数码发烧友',
  '手冲学徒', '瑜伽小姐姐', '户外新手', '键圈大佬', '生活家Lily', '周末玩家'];

/* 兴趣模板：每类用户偏好的商品池与主要行为 */
var USER_ARCHETYPES = [
  { pool: ['p01', 'p02', 'p03', 'p04', 'p05'], heavy: 'buy' },        // 摄影
  { pool: ['p10', 'p11', 'p12', 'p13', 'p14', 'p15'], heavy: 'buy' }, // 咖啡
  { pool: ['p16', 'p17', 'p18', 'p19', 'p20'], heavy: 'cart' },       // 健身
  { pool: ['p21', 'p22', 'p23', 'p24'], heavy: 'buy' },               // 露营
  { pool: ['p06', 'p07', 'p08', 'p09'], heavy: 'fav' },               // 桌面
  { pool: ['p10', 'p11', 'p13', 'p16', 'p17'], heavy: 'view' },       // 混合兴趣
  { pool: ['p01', 'p04', 'p06', 'p07', 'p20'], heavy: 'cart' }        // 数码泛兴趣
];

/* 可复现伪随机数 */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 生成演示行为事件：每个用户按模板随机产出 4-10 条行为 */
function generateEvents(seed) {
  var rnd = mulberry32(seed || 20260101);
  var actions = ['view', 'view', 'view', 'cart', 'fav', 'buy'];
  var events = [];

  USER_NAMES.forEach(function (name, ui) {
    var arch = USER_ARCHETYPES[Math.floor(rnd() * USER_ARCHETYPES.length)];
    var n = 4 + Math.floor(rnd() * 7);
    var used = {};
    for (var i = 0; i < n; i++) {
      var itemId = arch.pool[Math.floor(rnd() * arch.pool.length)];
      if (used[itemId]) continue;
      used[itemId] = true;
      /* 主要行为权重更高概率出现 */
      var action = rnd() < 0.45 ? arch.heavy : actions[Math.floor(rnd() * actions.length)];
      events.push({ userId: name, itemId: itemId, action: action });
    }
    /* 30% 概率跨界浏览一两个商品，制造共现桥接 */
    if (rnd() < 0.3) {
      var other = USER_ARCHETYPES[Math.floor(rnd() * USER_ARCHETYPES.length)];
      var bridge = other.pool[Math.floor(rnd() * other.pool.length)];
      if (!used[bridge]) events.push({ userId: name, itemId: bridge, action: 'view' });
    }
  });
  return events;
}

var DEMO_EVENTS = generateEvents(20260101);
