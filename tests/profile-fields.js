/* Test only. Profile fields for the automatic program (GÖREV 11a): defaults, validation, round trip. */
(function () {
  var errs = [], AD = window.AD;
  function ok(c, m) { if (!c) { errs.push(m); } }
  if (!AD || !AD.normProfile) { return JSON.stringify({ pass: false, errors: ['window.AD.normProfile yok'] }); }
  var day = { sid: 'a-full1', type: 'pull', kind: 'full', title: 'Tüm vücut 1', ex: [{ id: 'smith-squat', name: 'Smith Machine Squat', sets: 3, reps: [6, 10], rest: 150, eff: 'RIR 1–2', inc: 5, step: 2.5, lower: true }] };
  var auto = { v: 1, builtAt: '2026-11-28T10:00:00Z', plan: { gender: 'kadın', goal: 'kas', level: 'orta', equip: 'salon', days: 3 }, days: [day], targets: { 9: 12 }, stepGoal: null };
  // (a) old profile without the new fields
  var a = AD.normProfile({ protK: 1.8, sex: 'e', u: 5 });
  ok(a.plan === null && a.autoProgram === null && a.activeProgram === 'own', '(a) varsayılanlar');
  // (b) auto requested but no program
  ok(AD.normProfile({ activeProgram: 'auto' }).activeProgram === 'own', '(b) program yoksa own');
  // (c) day id without the a- prefix is rejected
  var bad = JSON.parse(JSON.stringify(auto)); bad.days[0].sid = 'push1';
  var c = AD.normProfile({ autoProgram: bad, activeProgram: 'auto' });
  ok(c.autoProgram === null && c.activeProgram === 'own', '(c) a- öneksiz gün reddedilir');
  // (c2) broken exercise (no sets) is rejected
  var bad2 = JSON.parse(JSON.stringify(auto)); delete bad2.days[0].ex[0].sets;
  ok(AD.normProfile({ autoProgram: bad2 }).autoProgram === null, '(c2) seti eksik hareket reddedilir');
  // (c3) bad plan values become null
  ok(AD.normProfile({ plan: { gender: 'x', goal: 'kas', level: 'orta', equip: 'salon', days: 3 } }).plan === null, '(c3) geçersiz plan null');
  // (d) a valid program survives a JSON round trip (export -> import) unchanged
  var d1 = AD.normProfile({ plan: auto.plan, autoProgram: auto, activeProgram: 'auto', u: 9 });
  var d2 = AD.normProfile(JSON.parse(JSON.stringify(d1)));
  ok(d1.activeProgram === 'auto' && d1.autoProgram && d1.plan && d1.plan.gender === 'kadın', '(d) geçerli program kabul');
  ok(JSON.stringify(d1.autoProgram) === JSON.stringify(d2.autoProgram) && d2.activeProgram === 'auto', '(d) gidiş-dönüş aynı');
  // existing fields untouched
  ok(d2.protK === 1.8 && Array.isArray(d2.supps), 'mevcut alanlar korunur');
  return JSON.stringify({ pass: errs.length === 0, errors: errs });
})()
