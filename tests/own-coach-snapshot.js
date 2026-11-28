/* Test only (not loaded by the app). Run in a test browser after importing a backup.
   Collects every coaching text the user sees for the active program, so a "before" and an
   "after" run can be compared byte for byte:
   - Bugün ekranı "Bugün hazır" lines per session
   - per session: target / last / warm-up / caption / stall lines
   - per exercise: feedback, hint and toast after all sets at the top of the range,
     after one set below the range, after one set above the range. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var txt = function (el) { return el ? el.innerText.replace(/\s+/g, ' ').trim() : null; };
  var out = { ready: {}, sessions: {} };
  if (!$('.land')) { var tb = $('.tb[data-tab="antrenman"]'); if (tb) { tb.click(); } }
  var ids = $$('.land .wk').length ? [] : null;
  $('[data-act="land-grid"]').click();
  ids = $$('.land .wk').map(function (b) { return b.getAttribute('data-i'); });
  ids.forEach(function (i) {
    if (!$('.land .wk[data-i="' + i + '"]')) { $('[data-act="land-grid"]').click(); }
    $('.land .wk[data-i="' + i + '"]').click();
    out.ready[i] = { title: txt($('.today-t')), meta: txt($('.today-m')), ready: $$('.ready p').map(txt) };
  });
  var start = $('[data-act="start"]');
  if (start) { start.click(); }
  function setReps(inp, v) { inp.value = String(v); inp.dispatchEvent(new Event('input', { bubbles: true })); }
  function setW(inp) { if (!inp.value) { inp.value = inp.getAttribute('data-ph') || '20'; inp.dispatchEvent(new Event('input', { bubbles: true })); } }
  function check(row) { var b = $('.chk', row); b.click(); return txt($('#toast')); }
  function uncheckAll(card) { $$('.set.done .chk', card).forEach(function (b) { b.click(); }); }
  ids.forEach(function (i) {
    if (!$('#day')) { return; }
    if (!$('#brief-p')) { $('.brief').click(); }
    var wk = $('#week .wk[data-i="' + i + '"]');
    if (!wk) { return; }
    wk.click();
    var day = { lines: $$('#day .goal, #day .last, #day .warm, #day .cap, #day .stall').map(txt), ex: {} };
    $$('#day .ex').forEach(function (card) {
      var id = card.getAttribute('data-ex');
      var m = (txt($('.tgt', card)) || '').match(/(\d+)–(\d+)/), lo = m ? +m[1] : 8, hi = m ? +m[2] : 12;
      var rec = {};
      var rows = $$('.set', card);
      rows.forEach(function (row) { $$('input[data-k="w"]', row).forEach(setW); $$('input[data-k="r"]', row).forEach(function (r) { setReps(r, hi); }); });
      rec.top = rows.map(function (row) { var t = check(row); return { fb: txt(row.nextElementSibling && row.nextElementSibling.nextElementSibling), toast: t }; });
      rec.hint = txt($('.hint:not([hidden])', card));
      uncheckAll(card);
      [['down', lo - 1], ['up', hi + 2]].forEach(function (c) {
        var row = rows[0];
        $$('input[data-k="r"]', row).forEach(function (r) { setReps(r, Math.max(1, c[1])); });
        var t = check(row);
        rec[c[0]] = { fb: txt($('.fb[data-j="0"]', card)), toast: t };
        uncheckAll(card);
      });
      day.ex[id] = rec;
    });
    out.sessions[i] = day;
  });
  var rest = $('#rest-skip'); if (rest) { rest.click(); }
  return JSON.stringify(out);
})()
