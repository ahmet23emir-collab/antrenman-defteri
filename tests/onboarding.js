/* Test only. GÖREV 11b onboarding and live program switch. Set window.__PHASE, then eval (returns a promise).
   fresh   : empty storage -> setup appears, whole flow (erkek, kas, yeni, salon), 5 days hidden for yeni,
             Başla -> Bugün shows the auto day, x/3, calorie offset +250, weight in today's daily entry
   half    : empty storage -> answer 3 questions, press the back key, the earlier answer is still there
   halfReload : (after a reload in 'half' state) the draft is restored at the same step with its answers
   emir    : Emir's data -> no setup; Vücut has the Program card; redo flow -> confirm text -> program used,
             records unchanged; back to own without a reload, records unchanged, x/5
   plank   : home 3-day program with plank -> set advice speaks of seconds */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var txt = function (el) { return el ? el.innerText.replace(/\s+/g, ' ').trim() : ''; };
  var errs = [], ph = window.__PHASE, AD = window.AD;
  function ok(c, m) { if (!c) { errs.push(m); } }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function type(id, v) { var i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }
  function pick(a, v) { var b = $('.ob [data-ob="' + a + '"][data-v="' + v + '"]'); if (!b) { errs.push('kart yok ' + a + '=' + v); return wait(0); } b.click(); return wait(320); }
  function step() { var n = txt($('.ob-n')); return n ? +n.split('/')[0] : 7; }
  function v1() { return localStorage.getItem('antrenman-defteri-v1'); }
  function prof() { return JSON.parse(localStorage.getItem('antrenman-defteri-profile-v1') || '{}'); }
  function done(extra) { var o = { pass: errs.length === 0, phase: ph, errors: errs }; Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; }); return JSON.stringify(o); }
  window.__noReload = window.__noReload || Math.random();
  var marker = window.__noReload;
  async function flow(gender, goal, level, equip, days) {
    if (step() === 1) {
      if ($('[data-ob="next"]').disabled === false && !document.getElementById('ob-h').value) { errs.push('Devam boşken açık'); }
      type('ob-h', '178'); type('ob-bw', '80,5'); type('ob-age', '29');
      ok(!$('[data-ob="next"]').disabled, 'Devam dolunca açık');
      $('[data-ob="next"]').click(); await wait(200);
    }
    ok(step() === 2, 'adım 2 (cinsiyet): ' + step());
    ok(/Kalori ve protein hesabı için/.test(txt($('.ob'))), 'cinsiyet açıklaması');
    await pick('gender', gender);
    await pick('goal', goal);
    await pick('level', level);
    await pick('equip', equip);
    if (level === 'yeni') {
      ok(!$('.ob [data-ob="days"][data-v="5"]'), 'yeni seviyede 5 gün gizli');
      ok($('.ob [data-ob="days"][data-v="3"]').getAttribute('aria-pressed') === 'true', 'yeni seviyede 3 gün seçili');
    } else { ok(!!$('.ob [data-ob="days"][data-v="5"]'), '5 gün görünür'); }
    await pick('days', days);
    ok(/Programın hazır/.test(txt($('.ob'))), 'program hazır ekranı');
  }
  async function run() {
    if (ph === 'fresh') {
      ok(!!$('.ob'), 'karşılama açıldı');
      ok(!$('.ob-back[data-ob]'), 'ilk adımda geri düğmesi yok');
      ok($('[data-ob="next"]').disabled, 'Devam boşken kapalı');
      type('ob-h', '50'); ok($('#ob-h').getAttribute('aria-invalid') === 'true' && /120–230/.test(txt($('#ob-err'))), 'geçersiz boy uyarısı');
      await flow('erkek', 'kas', 'yeni', 'salon', 3);
      var days = $$('.ob-day').map(txt);
      ok(days.length === 3 && /Tüm vücut 1/.test(days[0]) && /hareket · ~\d+ dk/.test(days[0]), 'gün listesi: ' + days.join(' | '));
      ok($$('.ob-chip').length >= 8, 'haftalık set çipleri');
      $('[data-ob="done"]').click(); await wait(300);
      ok(!$('.ob'), 'karşılama kapandı');
      ok(/Tüm vücut 1/.test(txt($('.today-t'))), 'Bugün otomatik gün: ' + txt($('.today-t')));
      ok(/Bu hafta 0\/3/.test(txt($('.wkc'))), 'Bu hafta 0/3');
      var p = prof();
      ok(p.activeProgram === 'auto' && p.plan && p.plan.days === 3 && p.autoProgram && p.autoProgram.days.length === 3, 'profil programı');
      ok(p.goal === 'al' && p.gk === 250 && p.h === 178 && p.age === 29 && p.sex === 'e', 'kalori +250, boy/yaş/cinsiyet');
      var d = JSON.parse(localStorage.getItem('antrenman-defteri-daily-v1') || '{}'), anyBw = Object.keys(d).some(function (k) { return d[k].bw === 80.5; });
      ok(anyBw, 'kilo günlük kayda yazıldı');
      ok(marker === window.__noReload, 'sayfa yenilenmedi');
      return done();
    }
    if (ph === 'half') {
      type('ob-h', '165'); type('ob-bw', '60'); type('ob-age', '31');
      $('[data-ob="next"]').click(); await wait(200);
      await pick('gender', 'kadın'); await pick('goal', 'yag'); await pick('level', 'orta');
      ok(step() === 5, 'adım 5: ' + step());
      history.back(); await wait(300);
      ok(step() === 4, 'geri tuşu bir adım geri: ' + step());
      ok($('.ob [data-ob="level"][data-v="orta"]').getAttribute('aria-pressed') === 'true', 'seviye cevabı duruyor');
      $('.ob-back').click(); await wait(250); $('.ob-back').click(); await wait(250); $('.ob-back').click(); await wait(250);
      ok(step() === 1 && $('#ob-h').value === '165' && $('#ob-bw').value === '60' && $('#ob-age').value === '31', 'ilk adım değerleri duruyor');
      $('[data-ob="next"]').click(); await wait(200);
      ok($('.ob [data-ob="gender"][data-v="kadın"]').getAttribute('aria-pressed') === 'true', 'cinsiyet duruyor');
      await pick('gender', 'kadın');
      ok($('.ob [data-ob="goal"][data-v="yag"]').getAttribute('aria-pressed') === 'true', 'hedef duruyor');
      return done({ step: step() });
    }
    if (ph === 'halfReload') {
      ok(!!$('.ob'), 'yenilemeden sonra karşılama açık');
      ok(step() === 3, 'aynı adım: ' + step());
      ok($('.ob [data-ob="goal"][data-v="yag"]').getAttribute('aria-pressed') === 'true', 'taslak hedef duruyor');
      await pick('goal', 'yag'); await pick('level', 'orta'); await pick('equip', 'ev');
      ok($('.ob [data-ob="days"][data-v="5"]'), 'orta seviyede 5 gün var');
      await pick('days', 4);
      ok(/Programın hazır/.test(txt($('.ob'))) && /Kardiyo/.test(txt($('.ob-list'))) && /8\.000 adım/.test(txt($('.ob'))), 'yağ yak: kardiyo ve 8.000 adım');
      $('[data-ob="done"]').click(); await wait(300);
      var p = prof();
      ok(p.goal === 'ver' && p.gk === -400 && p.sex === 'k', 'kalori −400, kadın');
      ok(/Bu hafta 0\/4/.test(txt($('.wkc'))), 'Bu hafta 0/4');
      return done();
    }
    if (ph === 'emir') {
      var before = v1(), dBefore = localStorage.getItem('antrenman-defteri-daily-v1'), kBefore = JSON.stringify([prof().goal, prof().kadj, prof().gk]);
      ok(!$('.ob'), 'Emir’e karşılama çıkmadı');
      $('.tb[data-tab="vucut"]').click(); await wait(200);
      ok(!!$('#prog-card') && /Programı yeniden kur/.test(txt($('#prog-card'))), 'Vücut’ta Program bölümü');
      ok($('#prog-card [data-v="own"]').getAttribute('aria-pressed') === 'true', 'Benim programım seçili');
      $('[data-act="prog-redo"]').click(); await wait(250);
      ok(!!$('.ob') && !!$('.ob-back[data-ob]'), 'yeniden kur açıldı, ilk adımda kapatma var');
      ok(!$('[data-ob="next"]').disabled, 'Emir’in boy/kilo/yaşı hazır');
      $('[data-ob="next"]').click(); await wait(200);
      await flow('erkek', 'kas', 'orta', 'salon', 4);
      ok(/Kayıtların silinmez\. Eski programın ‘Benim programım’ olarak saklanır\./.test(txt($('.ob'))), 'onay metni');
      $('[data-ob="done"]').click(); await wait(300);
      ok(prof().activeProgram === 'auto', 'otomatik program etkin');
      ok(JSON.stringify([prof().goal, prof().kadj, prof().gk]) === kBefore, 'kalori ayarına dokunulmadı');
      ok(/Bu hafta 0\/4/.test(txt($('.wkc'))), 'Bu hafta 0/4');
      $('.tb[data-tab="gecmis"]').click(); await wait(200);
      var n1 = $$('.sess').length;
      $('.tb[data-tab="vucut"]').click(); await wait(200);
      $('#prog-card [data-v="own"]').click(); await wait(300);
      ok(prof().activeProgram === 'own', 'Benim programıma dönüldü');
      $('.tb[data-tab="antrenman"]').click(); await wait(200);
      ok(/Bu hafta \d\/5/.test(txt($('.wkc'))), 'Bu hafta x/5: ' + txt($('.wkc')));
      $('.tb[data-tab="gecmis"]').click(); await wait(200);
      ok($$('.sess').length === n1 && n1 >= 7, 'Geçmiş seansları aynı: ' + n1);
      ok(v1() === before && localStorage.getItem('antrenman-defteri-daily-v1') === dBefore, 'kayıtlar bayt bayt aynı');
      ok(marker === window.__noReload, 'sayfa yenilenmedi');
      $('.tb[data-tab="antrenman"]').click(); await wait(200);
      return done({ sess: n1 });
    }
    if (ph === 'plank') {
      var pl = { gender: 'erkek', goal: 'form', level: 'orta', equip: 'ev', days: 4 };
      var p2 = JSON.parse(localStorage.getItem('antrenman-defteri-profile-v1') || '{}');
      p2.plan = pl; p2.autoProgram = AD.buildProgram(pl); p2.activeProgram = 'auto';
      localStorage.setItem('antrenman-defteri-profile-v1', JSON.stringify(p2));
      return done({ next: 'reload' });
    }
    if (ph === 'plank2') {
      var i = 0;
      while (!$('#day .ex[data-ex="plank"]') && i < 6) {
        $('.tb[data-tab="antrenman"]').click(); await wait(100);
        var g = $('[data-act="land-grid"]'); if (g) { g.click(); await wait(100); }
        var wk = $$('.land .wk')[i]; if (wk) { wk.click(); await wait(100); }
        var st = $('[data-act="start"]'); if (st) { st.click(); await wait(150); }
        i++;
      }
      var card = $('#day .ex[data-ex="plank"]');
      ok(!!card, 'plank kartı bulundu');
      if (card) {
        var row = $('.set', card);
        $$('input[data-k="r"]', row)[0].value = '75'; $$('input[data-k="r"]', row)[0].dispatchEvent(new Event('input', { bubbles: true }));
        $('.chk', row).click(); await wait(100);
        var fb = txt($('.fb[data-j="0"]', card));
        ok(/75 saniye yaptın/.test(fb) && !/tekrar yaptın/.test(fb), 'plank önerisi saniye: ' + fb);
        $('.chk', row).click();
      }
      return done();
    }
    return done({ unknown: ph });
  }
  return run().catch(function (e) { errs.push('hata: ' + e.message); return done(); });
})()
