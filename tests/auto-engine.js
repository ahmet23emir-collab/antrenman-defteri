/* Test only. GÖREV 11a engine: every combination builds a valid program.
   Independent checks (not relying on validateProgram alone): no empty day, no repeated exercise in a day,
   sets/reps/rest present, no gym exercise at home, two cardio days for "yag", glute target, a- ids,
   the stored form survives normProfile. Returns failures plus three sample programs for the report. */
(function () {
  var AD = window.AD, fails = [], warns = 0, n = 0;
  if (!AD || !AD.buildProgram || !AD.validateProgram || !AD.POOL) { return JSON.stringify({ pass: false, fails: ['window.AD motoru yok'] }); }
  var salonIds = {}, evIds = {};
  Object.keys(AD.POOL).forEach(function (k) { salonIds[AD.POOL[k].salon.id] = 1; evIds[AD.POOL[k].ev.id] = 1; });
  var V = { gender: ['erkek', 'kadın'], goal: ['kas', 'yag', 'form'], level: ['yeni', 'orta', 'ileri'], equip: ['salon', 'ev'], days: [3, 4, 5] };
  V.days.forEach(function (days) { V.equip.forEach(function (equip) { V.level.forEach(function (level) { V.goal.forEach(function (goal) { V.gender.forEach(function (gender) {
    var plan = { gender: gender, goal: goal, level: level, equip: equip, days: days }, tag = JSON.stringify(plan), prog;
    n++;
    try { prog = AD.buildProgram(plan); } catch (e) { fails.push(tag + ' hata: ' + e.message); return; }
    var lifts = prog.days.filter(function (d) { return d.type !== 'rest'; }), cardio = prog.days.filter(function (d) { return d.kind === 'cardio'; });
    if (lifts.length !== days) { fails.push(tag + ' antrenman günü ' + lifts.length); }
    if ((goal === 'yag' ? 2 : 0) !== cardio.length) { fails.push(tag + ' kardiyo günü ' + cardio.length); }
    if (goal === 'yag' && prog.stepGoal !== 8000) { fails.push(tag + ' adım hedefi'); }
    prog.days.forEach(function (d) {
      if (!/^a-/.test(d.sid)) { fails.push(tag + ' sid ' + d.sid); }
      if (d.type !== 'rest' && !d.ex.length) { fails.push(tag + ' boş gün ' + d.sid); }
      var seen = {};
      d.ex.forEach(function (e) {
        if (seen[e.id]) { fails.push(tag + ' tekrar eden hareket ' + d.sid + ' ' + e.id); }
        seen[e.id] = 1;
        if (!(e.sets >= 1) || !(e.rest > 0) || !Array.isArray(e.reps)) { fails.push(tag + ' eksik değer ' + e.id); }
        if (equip === 'ev' && salonIds[e.id] && !evIds[e.id]) { fails.push(tag + ' ev programında salon hareketi ' + e.id); }
        if (equip === 'salon' && evIds[e.id] && !salonIds[e.id]) { fails.push(tag + ' salon programında ev hareketi ' + e.id); }
      });
    });
    var w = AD.weeklySets(prog.days);
    if (w[9] < (gender === 'kadın' ? 12 : 8)) { fails.push(tag + ' kalça ' + w[9]); }
    var v = AD.validateProgram(prog, plan);
    if (!v.ok) { fails.push(tag + ' doğrulama: ' + v.errors.join('; ')); }
    warns += v.warnings.length;
    if (!AD.normProfile({ autoProgram: prog }).autoProgram) { fails.push(tag + ' normProfile reddetti'); }
  }); }); }); }); });
  var samples = {};
  [3, 4, 5].forEach(function (d) {
    var p = AD.buildProgram({ gender: 'erkek', goal: 'kas', level: 'orta', equip: 'salon', days: d });
    samples[d] = { days: p.days.map(function (x) { return { title: x.title, ex: x.ex.map(function (e) { return e.name + ' | ' + e.sets + ' | ' + (e.reps ? e.reps.join('–') : '-') + (e.unit === 'sn' ? ' sn' : '') + ' | ' + e.rest + ' sn | ' + e.eff; }) }; }), weekly: AD.weeklySets(p.days) };
  });
  return JSON.stringify({ pass: fails.length === 0, combos: n, fails: fails.slice(0, 40), failCount: fails.length, warnings: warns, samples: samples });
})()
