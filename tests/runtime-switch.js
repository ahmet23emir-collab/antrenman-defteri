/* Test only. GÖREV 11a runtime program switch. Run with window.__PHASE set, reloading between phases:
   'setup'  : builds a 4-day home program (kadın, kas, orta), stores it with activeProgram 'auto' (then reload)
   'auto'   : checks the auto program is active, runs one set + finish, checks history/progress/targets
   'toOwn'  : switches back with AD.setActiveProgram('own') (reloads)
   'own'    : checks Emir's program is back (x/5, glute target 8, own exercises in progress list) */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var txt = function (el) { return el ? el.innerText.replace(/\s+/g, ' ').trim() : ''; };
  var errs = [], AD = window.AD, ph = window.__PHASE;
  function ok(c, m) { if (!c) { errs.push(m); } }
  function tab(t) { var b = $('.tb[data-tab="' + t + '"]'); if (b) { b.click(); } }
  if (!AD || !AD.setActiveProgram) { return JSON.stringify({ pass: false, errors: ['AD.setActiveProgram yok'] }); }
  if (ph === 'setup') {
    var plan = { gender: 'kadın', goal: 'kas', level: 'orta', equip: 'ev', days: 4 };
    var p = JSON.parse(localStorage.getItem('antrenman-defteri-profile-v1') || '{}');
    p.plan = plan; p.autoProgram = AD.buildProgram(plan); p.activeProgram = 'auto'; p.u = Date.now();
    localStorage.setItem('antrenman-defteri-profile-v1', JSON.stringify(p));
    return JSON.stringify({ pass: true, phase: 'setup' });
  }
  if (ph === 'toOwn') { setTimeout(function () { AD.setActiveProgram('own'); }, 0); return JSON.stringify({ pass: true, phase: 'toOwn' }); }
  var auto = ph === 'auto';
  tab('antrenman');
  var title = txt($('.today-t')), week = txt($('.wkc'));
  ok(week.indexOf(auto ? '/4' : '/5') >= 0, 'haftalık sayaç ' + (auto ? '/4' : '/5') + ': ' + week);
  if (auto) {
    ok(/^(Üst|Alt) \d$/.test(title), 'Bugün otomatik gün: ' + title);
    $('[data-act="start"]').click();
    var card = $('#day .ex');
    ok(card && /^db-|^goblet|^bulgarian|^reverse|^sl-|^plank/.test(card.getAttribute('data-ex')), 'ilk hareket ev hareketi: ' + (card && card.getAttribute('data-ex')));
    var row = card && $('.set', card);
    if (row) {
      $$('input[data-k="w"]', row).forEach(function (i) { i.value = '10'; i.dispatchEvent(new Event('input', { bubbles: true })); });
      $$('input[data-k="r"]', row).forEach(function (i) { i.value = '8'; i.dispatchEvent(new Event('input', { bubbles: true })); });
      $('.chk', row).click();
      ok(row.classList.contains('done'), 'set işaretlendi');
      ok(!!$('#rest:not([hidden]), .rest.on, #rest.show') || !!txt($('#rest')), 'dinlenme sayacı açıldı');
      var sk = $('#rest-skip'); if (sk) { sk.click(); }
      var fin = $('[data-act="finish"]'); if (fin) { fin.click(); var yes = $('[data-sheet="ok"]'); if (yes) { yes.click(); } }
      ok(/Antrenman tamam/.test(document.body.innerText), 'bitiş ekranı');
    }
  }
  tab('gecmis');
  var segS = $$('button').filter(function (b) { return txt(b) === 'Seanslar'; })[0]; if (segS) { segS.click(); }
  /* every stored record with a done set or done cardio must be listed, from both programs */
  var v1 = JSON.parse(localStorage.getItem('antrenman-defteri-v1') || '{}'), want = Object.keys(v1).filter(function (k) {
    var d = v1[k]; return (d.cardio && d.cardio.d) || Object.keys(d.sets || {}).some(function (id) { return d.sets[id].some(function (s) { return s.d; }); });
  });
  var shown = $$('.sess').map(function (b) { return b.getAttribute('data-k'); });
  var missing = want.filter(function (k) { return shown.indexOf(k) < 0; });
  ok(missing.length === 0 && want.length >= 8, 'Geçmiş listesi: ' + shown.length + ' gösterilen, ' + want.length + ' kayıt, eksik ' + missing.join(','));
  var first = $$('.sess').filter(function (b) { return !/_a-/.test(b.getAttribute('data-k')); })[0];
  if (first) { first.click(); ok(/Çekiş|İtiş|Bacak/i.test(txt($('.sheet, .detail, dialog[open]')) || document.body.innerText), 'eski seans detayı açıldı'); var cl = $('[data-act="sheet-close"], [data-act="close"]'); if (cl) { cl.click(); } }
  else { errs.push('Emir’in 22 Kasım seansı listede yok'); }
  var opts = $$('select option').map(function (o) { return o.value; }).join(' ');
  var seg = $$('button').filter(function (b) { return txt(b) === 'İlerleme'; })[0]; if (seg) { seg.click(); }
  opts = $$('select option').map(function (o) { return o.value; }).join(' ');
  ok(auto ? /db-bench/.test(opts) && !/wide-row/.test(opts) : /wide-row/.test(opts) && !/db-bench/.test(opts), 'İlerleme listesi etkin programdan');
  ok(new RegExp('Kalça\\s*\\S*\\s*/\\s*' + (auto ? 12 : 8)).test(document.body.innerText), 'kalça hedefi ' + (auto ? 12 : 8));
  return JSON.stringify({ pass: errs.length === 0, phase: ph, errors: errs, title: title, week: week });
})()
