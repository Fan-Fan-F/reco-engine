/* 推荐引擎演示应用 */
(function () {
  'use strict';

  var engine = new RecoEngine().loadEvents(DEMO_EVENTS);
  var itemById = {};
  CATALOG.forEach(function (p) { itemById[p.id] = p; });

  var ACTION_LABEL = { view: '浏览', cart: '加购', fav: '收藏', buy: '购买' };
  var currentUser = USER_NAMES[0];

  /* ---------- 渲染：用户列表 ---------- */
  function renderUsers() {
    var box = document.getElementById('user-list');
    box.innerHTML = '';
    USER_NAMES.forEach(function (name) {
      var chip = document.createElement('button');
      chip.className = 'user-chip' + (name === currentUser ? ' active' : '');
      chip.textContent = name;
      chip.onclick = function () {
        currentUser = name;
        renderUsers();
        renderHistory();
        renderReco();
      };
      box.appendChild(chip);
    });
  }

  /* ---------- 渲染：用户行为记录 ---------- */
  function renderHistory() {
    var box = document.getElementById('user-history');
    box.innerHTML = '';
    var events = DEMO_EVENTS.filter(function (e) { return e.userId === currentUser; });
    if (!events.length) {
      box.innerHTML = '<div class="empty">暂无行为记录</div>';
      return;
    }
    events.forEach(function (e) {
      var p = itemById[e.itemId];
      var row = document.createElement('div');
      row.className = 'h-item';
      row.innerHTML = '<span>' + p.name + '</span>' +
        '<span class="tag ' + e.action + '">' + ACTION_LABEL[e.action] + '</span>';
      box.appendChild(row);
    });
  }

  /* ---------- 渲染：商品卡片 ---------- */
  function productCard(p, opts) {
    opts = opts || {};
    var card = document.createElement('div');
    card.className = 'p-card';
    var html = '';
    if (opts.rank) html += '<div class="rank r' + opts.rank + '">' + opts.rank + '</div>';
    html += '<div class="name">' + p.name + '</div>';
    html += '<div class="cat">' + p.cat + '</div>';
    html += '<div class="price">¥' + p.price + '</div>';

    if (opts.score !== undefined && opts.maxScore) {
      var pct = Math.round((opts.score / opts.maxScore) * 100);
      html += '<div class="score-bar"><div class="score-fill" style="width:' + Math.max(pct, 6) + '%"></div></div>';
      html += '<div class="score-num">' + (opts.scoreLabel || '推荐分') + ' ' + opts.score.toFixed(2) + '</div>';
    }

    if (opts.reasons && opts.reasons.length) {
      html += '<div class="reason">因为你' +
        opts.reasons.map(function (r) {
          return ACTION_LABEL[r.weight >= 5 ? 'buy' : r.weight >= 3 ? 'fav' : r.weight >= 2 ? 'cart' : 'view'] +
            '了 <b>' + itemById[r.from].name + '</b>';
        }).join('、') + '</div>';
    }

    card.innerHTML = html;
    return card;
  }

  /* ---------- 渲染：个性化推荐 ---------- */
  function renderReco() {
    document.getElementById('reco-user').textContent = '—— ' + currentUser;
    var grid = document.getElementById('reco-grid');
    grid.innerHTML = '';
    var recos = engine.recommendFor(currentUser, 6);
    if (!recos.length) {
      grid.innerHTML = '<div class="empty">行为数据不足，为你展示全站热门</div>';
      engine.popularItems(6).forEach(function (h, i) {
        grid.appendChild(productCard(itemById[h.itemId], { rank: i + 1, score: h.heat, maxScore: 30, scoreLabel: '热度' }));
      });
      return;
    }
    var maxScore = recos[0].score;
    recos.forEach(function (r, i) {
      grid.appendChild(productCard(itemById[r.itemId], {
        rank: i + 1, score: r.score, maxScore: maxScore, reasons: r.reasons
      }));
    });
  }

  /* ---------- 渲染：相似商品 ---------- */
  function renderSimilar() {
    var sel = document.getElementById('sim-select');
    if (!sel.options.length) {
      CATALOG.forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.name;
        sel.appendChild(o);
      });
      sel.onchange = renderSimilarGrid;
    }
    renderSimilarGrid();
  }

  function renderSimilarGrid() {
    var itemId = document.getElementById('sim-select').value;
    var grid = document.getElementById('sim-grid');
    grid.innerHTML = '';
    var sims = engine.similarItems(itemId, 6);
    if (!sims.length) {
      grid.innerHTML = '<div class="empty">该商品暂无相似商品数据</div>';
      return;
    }
    var max = sims[0].sim;
    sims.forEach(function (s, i) {
      grid.appendChild(productCard(itemById[s.itemId], {
        rank: i + 1, score: s.sim, maxScore: max, scoreLabel: '相似度'
      }));
    });
  }

  /* ---------- 渲染：热门兜底 ---------- */
  function renderHot() {
    var grid = document.getElementById('hot-grid');
    grid.innerHTML = '';
    var hot = engine.popularItems(6);
    var max = hot[0] ? hot[0].heat : 1;
    hot.forEach(function (h, i) {
      grid.appendChild(productCard(itemById[h.itemId], {
        rank: i + 1, score: h.heat, maxScore: max, scoreLabel: '热度'
      }));
    });
  }

  renderUsers();
  renderHistory();
  renderReco();
  renderSimilar();
  renderHot();
})();
