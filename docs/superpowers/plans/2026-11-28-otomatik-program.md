# Otomatik program motoru (GÖREV 11a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `buildProgram(plan)` üreten, profile kaydedilen ve açılışta etkinleştirilebilen otomatik program; Emir'in programı ve kayıtları aynen.

**Architecture:** Tek `index.html` (vanilla JS IIFE). Motor saf fonksiyonlar (havuz → şablon → set/tekrar → dengeleme). Açılışta `PROGRAM` = etkin günler + öteki programın günleri (`off: true`), `SESSIONS` etkin günlerden. Kilo artışı hareket başına `inc`/`step`.

**Tech Stack:** Vanilla HTML/CSS/JS, localStorage, service worker. Test: agent-browser ile test tarayıcısında çalışan betikler (`tests/*.js`, uygulamaya yüklenmez, önbelleğe alınmaz).

**Spec:** `docs/superpowers/specs/2026-11-28-otomatik-program-design.md`

## Global Constraints

- Veri modeli: kayıtlar (`antrenman-defteri-v1`, `-daily-v1`) okunur, hiç yazılmaz/silinmez; profil yalnızca `plan`, `autoProgram`, `activeProgram` alanlarını kazanır.
- `activeProgram` varsayılanı `'own'`; `autoProgram` geçersiz/yoksa `'own'`a zorlanır.
- Otomatik gün kimlikleri `a-` önekli; kayıt anahtarı `YYYY-MM-DD_<sid>` aynı.
- Yedek formatı `{ app: 'antrenman-defteri', v: 2, exported, workouts, daily, profile }` aynı; eski yedekler yüklenir.
- Yeni renk token'ı yok: full→`pull`, upper→`push`, lower→`leg`, cardio→`rest`.
- Artış: alt vücut 5 kg, üst 2,5 kg, adım 2,5; ev (dambıl) artış 2, adım 2.
- RIR: yeni bileşik "RIR 2–3" / izolasyon "RIR 1–2"; orta "RIR 1–2" / "RIR 1"; ileri "RIR 1–2" / "RIR 0–1"; core boş.
- Bileşik 6–10 (yeni 8–12), 150 sn (yeni 120); ilk iki hareket yeni 3 / orta 3 / ileri 4 set, diğer bileşik 3; izolasyon 10–15, 75 sn, 3 set; core yeni 2 / orta-ileri 3 set, 10–15, 75 sn; plank saniye 30–60.
- Aralıklar: yeni 8–10, orta 10–14, ileri 12–18; 3 günde biceps/triceps/baldır 3–6; form → [alt, alt]; kalça kadın 12 / erkek 8 (alt sınır); karın dengelenmez.
- Yağ: `a-cardio1`, `a-cardio2` + `stepGoal: 8000`.
- 400 px, açık+koyu tema, 44 px / 12 px; `sw.js` VERSION artar.

## Review Focus

- Emir'in eski yedeğinde `profile` içinde yeni alanlar yokken içe aktarma → varsayılanlar, `own` aynen (Task 2 testi).
- `autoProgram` bozuk/elle düzenlenmiş (eksik `days`, `a-` öneksiz sid) → `own`'a düşer, uygulama açılır (Task 2 testi).
- Otomatik program etkinken Emir'in eski seansları Geçmiş/İlerleme'de görünür ve detayı açılır (Task 4 testi).
- `own`'a dönüşte haftalık sayaç "/5", kas hedefleri ve Bugün ekranı eskisi gibi (Task 4 testi).
- Ev ekipmanı + yağ + 3 gün gibi uç kombinasyonda boş gün veya aynı günde tekrar yok (Task 3, 108 kombinasyon).

---

### Task 1: Hareket başına kilo artışı (`inc` / `step`) ve Emir'in programında birebir aynılık

**Files:**
- Modify: `index.html` (`mk`, `targetLine`, `updateCard` ipucu, `adviceFor`, `round25`, `readyHTML`)
- Test: `tests/own-coach-snapshot.js` (DOM'dan koç çıktılarını toplayan betik)

**Interfaces:**
- Produces: `incOf(e) -> number`, `stepOf(e) -> number`, `roundStep(x, step) -> number`; hareket nesnesinde isteğe bağlı `inc`, `step`, `lower` alanları. Emir'in hareketlerinde `lower` = birincil `MUS` kası 5/6/7/9 (Ön bacak, Arka bacak, Baldır, Kalça).

- [ ] **Step 1:** `tests/own-coach-snapshot.js` yaz: her `SESSIONS` günü için Bugün ekranındaki "Bugün hazır" satırları, antrenman ekranındaki tüm `.goal/.last/.warm/.cap/.stall` metinleri; her hareketin ilk setine geçen seferin kilosuyla (üst tekrar+1) ve (alt tekrar−1) girip ✓ → `.fb` ve `.hint` metinleri, sonra Geri al/✓ kaldır. Çıktı: JSON `{ sid: { ready:[], lines:[], advice:{ exId: [up, down, hint] } } }`.
- [ ] **Step 2:** Değişiklikten ÖNCE `yedekler/antrenman-yedek-2026-11-22.json` boş test tarayıcısına yüklenip betik çalıştırılır; çıktı `scratchpad/own-before.json`.
- [ ] **Step 3:** `incOf/stepOf/roundStep` ekle; `leg ? 5 : 2.5` ve `round25` kullanımlarını bunlara çevir (bw için mevcut 2,5 aynen).
- [ ] **Step 4:** Aynı betik değişiklikten SONRA; `own-after.json` ile `own-before.json` birebir eşit. Beklenen: fark yok.
- [ ] **Step 5:** Commit `GÖREV 11a-1: kilo artışı hareket başına (Emir'in programında birebir aynı)`.

### Task 2: Profil alanları, doğrulama ve yedek uyumu

**Files:**
- Modify: `index.html` (`normProfile`, içe aktarma)
- Test: `tests/profile-fields.js`

**Interfaces:**
- Produces: `normPlan(p) -> plan|null`, `normAutoProgram(a) -> autoProgram|null`; `profile.plan`, `profile.autoProgram`, `profile.activeProgram`.

- [ ] **Step 1:** Test: (a) alanları olmayan eski profil → `plan null`, `autoProgram null`, `activeProgram 'own'`; (b) `activeProgram:'auto'` ama `autoProgram` yok → `'own'`; (c) `days` içinde `a-` öneksiz sid → `autoProgram null`; (d) geçerli `autoProgram` dışa→içe aktarmada aynen korunur.
- [ ] **Step 2:** `normProfile`'a üç alan; doğrulama: sid `/^a-[a-z0-9-]+$/`, `type ∈ {push,pull,leg,rest}`, ex `{id,name,sets 1–8, reps null|[lo,hi], rest 30–300, inc, step}`.
- [ ] **Step 3:** Test geçer. Commit `GÖREV 11a-2: profil alanları`.

### Task 3: Motor — havuz, şablonlar, set/tekrar, dengeleme, doğrulama

**Files:**
- Modify: `index.html` (yeni bölüm "otomatik program motoru"; `MUS`'a yeni kimlikler)
- Test: `tests/auto-engine.js`

**Interfaces:**
- Consumes: `MUS`, `MUS_NAMES` (kalça indeksi 9).
- Produces: `POOL` (kategori → `{salon:{id,name}, ev:{id,name}, kind:'comp'|'iso'|'core', lower:bool, mus:[[i,w]]}`), `TEMPLATES[days]` (gün listesi: `{key, kind, title, slots:[kategori]}`), `buildProgram(plan) -> autoProgram`, `weeklySets(days) -> number[]`, `validateProgram(prog, plan) -> {ok:bool, errors:string[], warnings:string[]}`, `window.AD`.

- [ ] **Step 1:** Test: 108 kombinasyon; her birinde `buildProgram` hata atmaz, `validateProgram().errors` boş; ev'de `POOL` salon kimliği yok; günde aynı `id` yok; her hareketin `sets/reps/rest` dolu (plank hariç reps dizi); kontrol edilen kasların haftalık toplamı aralıkta (karar: aralık dışı = error); yağda iki `a-cardio`; kalça ≥ 12 (kadın) / ≥ 8 (erkek).
- [ ] **Step 2:** Havuz tablosu ve şablonlar spec'teki gibi; set/tekrar/dinlenme/RIR Global Constraints'ten.
- [ ] **Step 3:** Dengeleme: spec "Haftalık kas başı set dengeleme" 1–7 ve "Kararlarım" (hareket başına ≤5 set, gün ≤8 hareket, çıkarırken ≥2, eklenen izolasyon eksik kadar set [2..5], eşitlikte ilk gün; önce set artır, sonra hareket ekle).
- [ ] **Step 4:** Test geçer. Commit `GÖREV 11a-3: otomatik program motoru`.

### Task 4: Açılışta program seçimi ve ekran bağlantıları

**Files:**
- Modify: `index.html` (`PROGRAM`/`SESSIONS` kurulumu, `ALL_EX`, `weekMuscle`, `MUS_TARGET`, `idxOfSid`)
- Test: `tests/runtime-switch.js`

**Interfaces:**
- Consumes: `profile.activeProgram`, `profile.autoProgram`, `buildProgram`.
- Produces: `setActiveProgram(x: 'own'|'auto')` (profili yazar, sayfayı yeniler); `day.off`, `day.kind`.

- [ ] **Step 1:** Test: Emir'in yedeği + `buildProgram({gender:'kadın',goal:'kas',level:'orta',equip:'ev',days:4})` kaydedilip `auto` → Bugün ekranı otomatik gün adını gösterir, "Bu hafta 0/4", tam antrenman akışı (set, dinlenme, bitiş) çalışır, İlerleme listesinde ev hareketleri var, kalça hedefi 12, Geçmiş'te Emir'in 10 seansı görünür ve detayı açılır; `own`'a dönünce "Bu hafta x/5", kalça hedefi 8, Task 1 snapshot'ı yine birebir.
- [ ] **Step 2:** Kurulum: own → `PROGRAM` = own 7 gün + auto günler `off`; `SESSIONS=[0,1,2,4,5,3]`. auto → auto günler + own günler `off`; `SESSIONS` = auto lift günleri + kardiyo. `ALL_EX` ve plan toplamı `off` günleri atlar; kalça hedefi etkin programdan.
- [ ] **Step 3:** Test geçer; 400 px açık+koyu 5 sekme ölçümü (taşma, 44/12 px, kontrast) temiz.
- [ ] **Step 4:** `sw.js` VERSION `v11a`; CLAUDE.md'ye GÖREV 11a [x]; commit `GÖREV 11a-4: açılışta program seçimi`; push.
