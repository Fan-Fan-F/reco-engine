/* Item-CF 协同过滤推荐引擎（纯逻辑，无 DOM 依赖）
 *
 * 核心思想：「喜欢商品 A 的人也喜欢商品 B」
 * 1. 从用户-商品行为矩阵构建商品共现矩阵
 * 2. 用余弦相似度计算商品两两相似度
 * 3. 对目标用户：其历史行为的每个商品，把相似商品的得分累加（行为权重 × 相似度）
 * 4. 排除已行为过的商品，取 Top-N
 */
(function (global) {
  'use strict';

  /* 行为权重：浏览 < 加购 < 收藏 < 购买 */
  var ACTION_WEIGHT = { view: 1, cart: 2, fav: 3, buy: 5 };

  function RecoEngine() {
    this.events = []; // { userId, itemId, action }
  }

  /* events: [{userId, itemId, action}] */
  RecoEngine.prototype.loadEvents = function (events) {
    this.events = events.slice();
    return this;
  };

  /* 用户-商品加权评分矩阵: { userId: { itemId: score } }，同一用户对同一商品多种行为取最大权重 */
  RecoEngine.prototype.buildUserItemMatrix = function () {
    var matrix = {};
    this.events.forEach(function (e) {
      var w = ACTION_WEIGHT[e.action] || 1;
      if (!matrix[e.userId]) matrix[e.userId] = {};
      if (!matrix[e.userId][e.itemId] || matrix[e.userId][e.itemId] < w) {
        matrix[e.userId][e.itemId] = w;
      }
    });
    return matrix;
  };

  /* 商品相似度矩阵（余弦相似度）: { itemId: [{ itemId, sim }] }，每项只保留 topK 邻居 */
  RecoEngine.prototype.buildItemSimilarity = function (topK) {
    topK = topK || 10;
    var matrix = this.buildUserItemMatrix();
    var cooccur = {};   // cooccur[a][b] = sum(min-ish 贡献)
    var itemNorm = {};  // itemNorm[a] = sum(score^2)

    Object.keys(matrix).forEach(function (userId) {
      var items = matrix[userId];
      var ids = Object.keys(items);
      ids.forEach(function (a) {
        itemNorm[a] = (itemNorm[a] || 0) + items[a] * items[a];
        ids.forEach(function (b) {
          if (a === b) return;
          if (!cooccur[a]) cooccur[a] = {};
          cooccur[a][b] = (cooccur[a][b] || 0) + items[a] * items[b];
        });
      });
    });

    var sim = {};
    Object.keys(cooccur).forEach(function (a) {
      sim[a] = Object.keys(cooccur[a]).map(function (b) {
        return {
          itemId: b,
          sim: cooccur[a][b] / (Math.sqrt(itemNorm[a]) * Math.sqrt(itemNorm[b] || 1))
        };
      }).sort(function (x, y) { return y.sim - x.sim; }).slice(0, topK);
    });
    return sim;
  };

  /* 为目标用户推荐 Top-N
   * 返回 [{ itemId, score, reasons: [{ from, sim, weight }] }]
   * reasons 用于「为什么推荐这个」的可解释性展示 */
  RecoEngine.prototype.recommendFor = function (userId, topN) {
    topN = topN || 6;
    var matrix = this.buildUserItemMatrix();
    var sim = this.buildItemSimilarity(10);
    var userItems = matrix[userId] || {};
    var scores = {};

    Object.keys(userItems).forEach(function (itemId) {
      var weight = userItems[itemId];
      (sim[itemId] || []).forEach(function (nb) {
        if (userItems[nb.itemId]) return; // 排除已行为商品
        if (!scores[nb.itemId]) scores[nb.itemId] = { score: 0, reasons: [] };
        scores[nb.itemId].score += weight * nb.sim;
        scores[nb.itemId].reasons.push({ from: itemId, sim: nb.sim, weight: weight });
      });
    });

    return Object.keys(scores).map(function (itemId) {
      var s = scores[itemId];
      s.reasons.sort(function (a, b) { return (b.sim * b.weight) - (a.sim * a.weight); });
      return { itemId: itemId, score: s.score, reasons: s.reasons.slice(0, 2) };
    }).sort(function (a, b) { return b.score - a.score; }).slice(0, topN);
  };

  /* 相似商品推荐（商详页「看了又看」） */
  RecoEngine.prototype.similarItems = function (itemId, topN) {
    var sim = this.buildItemSimilarity(topN || 6);
    return sim[itemId] || [];
  };

  /* 热门商品兜底（冷启动）：按行为总权重排序 */
  RecoEngine.prototype.popularItems = function (topN) {
    var hot = {};
    this.events.forEach(function (e) {
      hot[e.itemId] = (hot[e.itemId] || 0) + (ACTION_WEIGHT[e.action] || 1);
    });
    return Object.keys(hot).map(function (id) {
      return { itemId: id, heat: hot[id] };
    }).sort(function (a, b) { return b.heat - a.heat; }).slice(0, topN || 6);
  };

  global.RecoEngine = RecoEngine;
  global.RECO_ACTION_WEIGHT = ACTION_WEIGHT;
})(window);
