/* =========================================================
   Cosmic Lab — interactions
   particle/constellation network + scroll reveal
   embed-safe: no fixed, no sticky, no anchor scroll
   ========================================================= */
(function () {
  'use strict';

  /* ---------- particle network ---------- */
  var canvas = document.getElementById('net');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], raf = null;
    var COLORS = ['#80ed99', '#ffa62b', '#7371fc', '#f4989c'];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function size() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }

    function build() {
      var density = Math.max(28, Math.min(86, Math.floor((W * H) / 17000)));
      pts = [];
      for (var i = 0; i < density; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.8 + 0.7,
          c: COLORS[(Math.random() * COLORS.length) | 0]
        });
      }
    }

    var LINK = 132;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d;
      // links
      for (i = 0; i < pts.length; i++) {
        a = pts[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = W + 20; if (a.x > W + 20) a.x = -20;
        if (a.y < -20) a.y = H + 20; if (a.y > H + 20) a.y = -20;
        for (j = i + 1; j < pts.length; j++) {
          b = pts[j];
          dx = a.x - b.x; dy = a.y - b.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.globalAlpha = (1 - d / LINK) * 0.18;
            ctx.strokeStyle = a.c;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // nodes
      for (i = 0; i < pts.length; i++) {
        a = pts[i];
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = a.c;
        ctx.shadowColor = a.c;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    size();
    window.addEventListener('resize', function () {
      clearTimeout(canvas._t);
      canvas._t = setTimeout(size, 180);
    });

    if (reduce) {
      // draw one static frame
      frame();
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, W, H);
      // static dots only
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        ctx.fillStyle = p.c; ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      frame();
    }
  }

  /* ---------- scroll reveal (no anchor scroll) ----------
     Cards are VISIBLE BY DEFAULT (base opacity 1). The reveal is a
     self-completing CSS animation added as pure enhancement, then the
     class is removed on animationend so :hover transforms keep working.
     If JS or the animation never runs, cards simply stay visible. */
  var cards = document.querySelectorAll('.card');
  function reveal(el) {
    if (el.dataset.revealed) return;
    el.dataset.revealed = '1';
    var idx = +(el.getAttribute('data-i') || 0);
    el.style.animationDelay = (idx % 4) * 70 + 'ms';
    el.classList.add('reveal');
    el.addEventListener('animationend', function () {
      el.classList.remove('reveal');
    }, { once: true });
  }
  cards.forEach(function (c, i) { c.setAttribute('data-i', i); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }

  /* ---------- subtle pointer glow on cards ---------- */
  cards.forEach(function (card) {
    card.addEventListener('pointermove', function (ev) {
      var rect = card.getBoundingClientRect();
      var mx = ((ev.clientX - rect.left) / rect.width) * 100;
      card.style.setProperty('--mx', mx + '%');
    });
  });
})();
