/* =========================================================
   Tweaks panel — design-time controls (host protocol)
   Hidden in production embeds (host never activates it).
   ========================================================= */
(function () {
  'use strict';

  var panel = document.getElementById('tweaks');
  if (!panel) return;

  var root = document.documentElement;
  var body = document.body;
  var state = Object.assign(
    { light: false, scheme: 'multi', displayFont: 'Secular One', motion: 1, gridMin: 300 },
    window.TWEAK_DEFAULTS || {}
  );

  // remember each card's original (multi) accent
  var cards = [].slice.call(document.querySelectorAll('.card'));
  cards.forEach(function (c) {
    c.dataset.baseAccent = c.style.getPropertyValue('--accent').trim() || '#7371fc';
  });

  function fontStack(name) {
    return "'" + name + "', sans-serif";
  }

  function apply() {
    body.classList.toggle('light', !!state.light);
    root.style.setProperty('--display-font', fontStack(state.displayFont));
    root.style.setProperty('--motion', state.motion);
    root.style.setProperty('--grid-min', state.gridMin + 'px');

    cards.forEach(function (c) {
      var col = state.scheme === 'multi' ? c.dataset.baseAccent : state.scheme;
      c.style.setProperty('--accent', col);
    });

    // hero gradient + nucleus follow a single scheme too
    var heroGrad = document.querySelector('.hero h1 .grad');
    if (heroGrad) {
      heroGrad.style.background = state.scheme === 'multi'
        ? 'linear-gradient(100deg, var(--green), var(--orange) 42%, var(--pink) 72%, var(--purple))'
        : 'linear-gradient(100deg, ' + state.scheme + ', color-mix(in oklab, ' + state.scheme + ' 60%, #fff))';
      heroGrad.style.webkitBackgroundClip = 'text';
      heroGrad.style.backgroundClip = 'text';
    }

    // readouts
    var mv = document.getElementById('tk-motion-v');
    if (mv) mv.textContent = Math.round(state.motion * 100) + '%';
    var gv = document.getElementById('tk-grid-v');
    if (gv) gv.textContent = state.gridMin <= 280 ? 'גבוהה' : state.gridMin >= 360 ? 'נמוכה' : 'בינונית';

    // sync control UI
    panel.querySelectorAll('.seg[data-tk], .swatches[data-tk]').forEach(function (grp) {
      var key = grp.getAttribute('data-tk');
      grp.querySelectorAll('button').forEach(function (b) {
        var v = b.getAttribute('data-v');
        var match = (key === 'light') ? (String(state.light) === v) : (String(state[key]) === v);
        b.classList.toggle('on', match);
      });
    });
  }

  function persist() {
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: state }, '*');
    } catch (e) {}
  }

  // button groups (segmented + swatches)
  panel.querySelectorAll('.seg[data-tk], .swatches[data-tk]').forEach(function (grp) {
    var key = grp.getAttribute('data-tk');
    grp.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      var v = btn.getAttribute('data-v');
      state[key] = (v === 'true') ? true : (v === 'false') ? false : v;
      apply(); persist();
    });
  });

  // sliders
  panel.querySelectorAll('input[type=range][data-tk]').forEach(function (inp) {
    var key = inp.getAttribute('data-tk');
    inp.value = state[key];
    inp.addEventListener('input', function () {
      state[key] = parseFloat(inp.value);
      apply();
    });
    inp.addEventListener('change', persist);
  });

  // close button
  var closeBtn = document.getElementById('tk-close');
  if (closeBtn) closeBtn.addEventListener('click', function () {
    panel.classList.remove('show');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
  });

  // host protocol — listener BEFORE announcing availability
  window.addEventListener('message', function (e) {
    var t = e.data && e.data.type;
    if (t === '__activate_edit_mode') panel.classList.add('show');
    else if (t === '__deactivate_edit_mode') panel.classList.remove('show');
  });

  // initial paint from defaults, then announce
  // sync slider positions first
  panel.querySelectorAll('input[type=range][data-tk]').forEach(function (inp) {
    inp.value = state[inp.getAttribute('data-tk')];
  });
  apply();
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
})();
