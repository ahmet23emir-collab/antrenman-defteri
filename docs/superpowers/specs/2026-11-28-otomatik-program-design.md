# GÖREV 11a — Otomatik program motoru (tasarım)

Tarih: 2026-11-28 · Geri dönüş noktası: `otomatik-program-oncesi` etiketi (`6a9d117`)

## Amaç ve neden

Yapay zekâsız, koçluk kurallarıyla çalışan `buildProgram(plan)`: kullanıcının cinsiyet, hedef, seviye,
ekipman ve gün sayısına göre mevcut `PROGRAM` biçiminde bir hafta üretir. 11b'de karşılama ekranı bu
motoru kullanacak. Bu görevde ekran yok: motor, profil alanları, programın çalışma anında seçilmesi ve
geri dönüş güvenliği var.

## Hedefler

- 3 × 2 × 3 × 3 × 2 = 108 girdi kombinasyonunun hepsi geçerli program üretir.
- Emir'in programı ("Benim programım") ve tüm kayıtları aynen kalır; `activeProgram` varsayılanı `'own'`.
- Otomatik program etkinleştirilirse bütün mevcut ekranlar (Bugün, antrenman, İlerleme, kas haritası,
  seri) onunla çalışır; Geçmiş ve İlerleme her iki programın kayıtlarını gösterir.

## Hedef dışı

Karşılama/seçim ekranı (11b), Supabase, yapay zekâ, Emir'in `PROGRAM`'ında herhangi bir değişiklik.

## Başarısızlık sayılır (anti-goal)

- Emir'in bir kaydının kaybolması, gizlenmesi veya farklı okunması.
- Emir'in programında herhangi bir koç çıktısının (hedef satırı, kilo önerisi, "kilo artır" ipucu,
  takılma, rekor, Bugün hazır) bugünkünden farklı çıkması.
- Ev ekipmanında makine/kablo/bar hareketi çıkması.

## Seçilen yol: A — açılışta program seçimi

Değerlendirilenler:
- **A (seçildi):** Açılışta etkin program seçilir. `PROGRAM` = etkin günler + öteki programın günleri
  (`off: true`, yalnızca geçmişi okumak için). `SESSIONS` etkin günlerden hesaplanır. Ekran kodu
  neredeyse değişmez. Bedel: program değişince sayfa bir kez yenilenir.
- B: her fonksiyona program parametresi — ~50 yer değişir, GÖREV 3–10 davranışlarını bozma riski.
- C: yalnızca motor — hedef ve ekipman kontrolleri gerçek ekranda doğrulanamaz, risk 11b'ye kayar.

## Emir'in kararları (sabit)

1. Geçmiş ve İlerleme iki programın kayıtlarını gösterir; öteki programın günleri gizli ama yüklü kalır.
2. 3 gün şablonu A/B/A değil, üç ayrı gün (`a-full1/2/3`), hafta çiftliği yok:
   - Gün 1: squat (ana), yatay it, dikey çekiş, omuz it, arka bacak, core, **biceps**
   - Gün 2: kalça menteşesi (ana), eğik it, yatay çekiş, yan omuz, ön bacak, core, **triceps**
   - Gün 3: pres (ana), yatay it, yatay çekiş, kalça (hip thrust), arka omuz, core, **baldır**
   - 7. hareketler 3 set.
3. 3 gün şablonunda biceps, triceps, baldır haftalık hedefi 3–6 set; diğer kaslar ve şablonlar tablodaki aralıklar.
4. Kilo artışı günün türüne değil hareketin kas grubuna bakar: alt vücut hareketleri +5 kg, üst vücut
   +2,5 kg; ev (dambıl) hareketlerinde adım 2 kg. Emir'in programında sonuç birebir aynı kalır ve bu,
   `yedekler/antrenman-yedek-2026-11-22.json` ile karşılaştırılarak doğrulanır.
5. "Bu hafta x/N" gibi sayaçlar etkin programın günlerini doğru sayar.

## Veri modeli

Profil (`antrenman-defteri-profile-v1`) üç alan kazanır; `normProfile` eksikse varsayılanla doldurur,
geçersizse atar:

```
plan: { gender: 'erkek'|'kadın', goal: 'kas'|'yag'|'form', level: 'yeni'|'orta'|'ileri',
        equip: 'salon'|'ev', days: 3|4|5 } | null            (varsayılan null)
autoProgram: {
  v: 1, builtAt: '<ISO>', plan: {...},
  days: [ { sid: 'a-…', type: 'push'|'pull'|'leg'|'rest', kind: 'full'|'upper'|'lower'|'push'|'pull'|'leg'|'cardio',
            title, meta?, text?, cta?,
            ex: [ { id, name, sets, reps: [lo,hi] | null, eff, rest, bw?, inc, step } ] } ],
  targets: { '<kas index>': setSayısı },   // yalnızca sabit hedefler (kalça)
  stepGoal: 8000 | null
} | null                                                      (varsayılan null)
activeProgram: 'own' | 'auto'                                 (varsayılan 'own'; autoProgram yoksa 'own'a zorlanır)
```

- Üretilen program profile **kaydedilir** (her açılışta yeniden üretilmez); motor sonradan değişse de
  kullanıcının programı ve geçmişi kaymaz.
- Gün kimlikleri `a-` önekli: 3 gün `a-full1..3`; 4 gün `a-upper1, a-lower1, a-upper2, a-lower2`;
  5 gün `a-push, a-pull, a-leg, a-upper, a-lower`; yağ yakımında ek `a-cardio1, a-cardio2`.
  Kayıt anahtarı biçimi aynı (`YYYY-MM-DD_<sid>`).
- Hareket kimlikleri: salon hareketleri Emir'in programında aynı hareket varsa onun kimliğini kullanır
  (geçmiş ve rekor sürekliliği için); yoksa yeni kimlik. Ev hareketleri `db-…` ile yeni.
- Yedek dosyası formatı değişmez (`v: 2`); yeni alanlar profilin içinde gider. Eski yedekler aynen yüklenir
  (alanlar yoksa varsayılan).
- Kayıtlar (`antrenman-defteri-v1`, `daily`) okunur, hiç değiştirilmez.

## Tür ve renk eşlemesi (yeni token yok)

`type` renk ve 48 saat kuralının anahtarıdır; `kind` gösterilen ad içindir.

| kind | type (token) | başlık |
|---|---|---|
| full | pull | Tüm vücut 1/2/3 |
| upper | push | Üst A / Üst B |
| lower | leg | Alt A / Alt B |
| push / pull / leg | push / pull / leg | İtiş / Çekiş / Bacak |
| cardio | rest | Kardiyo 1/2 |

48 saat uyarısı `type` üzerinden çalıştığı için aynı türdeki (örn. iki tüm vücut) günler art arda gelirse uyarır.

## Hareket havuzu

Her kategori için salon / ev hareketi; `kind` (bileşik, izolasyon, core), birincil ve ikincil kaslar
(kas haritasındaki `MUS` biçiminde: birincil 1, ikincil 0,5) ve alt/üst vücut bilgisi.

| Kategori | Salon (kimlik) | Ev (kimlik) | Tür | Kaslar |
|---|---|---|---|---|
| Yatay it | Plate Loaded Chest Press (chest-press) | Dumbbell Bench Press (db-bench) | bileşik | Göğüs 1, Triceps .5, Omuz .5 |
| Eğik it | Smith Machine Low Incline Press (smith-incline) | Dumbbell Incline Press (db-incline) | bileşik | Göğüs 1, Omuz .5, Triceps .5 |
| Omuz it | Shoulder Press Machine (shoulder-press) | Dumbbell Shoulder Press (db-shoulder-press) | bileşik | Omuz 1, Triceps .5 |
| Yan omuz | Lateral Raise (lateral-raise) | Dumbbell Lateral Raise (db-lateral) | izolasyon | Omuz 1 |
| Göğüs izolasyon | Chest Fly Machine (chest-fly) | Dumbbell Fly (db-fly) | izolasyon | Göğüs 1 |
| Triceps | Triceps Pushdown (pushdown) | Dumbbell Overhead Triceps Extension (db-oh-ext) | izolasyon | Triceps 1 |
| Dikey çekiş | Lat Pulldown (pulldown) | Chest-Supported Dumbbell Row (db-chest-row) | bileşik | Sırt 1, Biceps .5 |
| Yatay çekiş | Seated Cable Row (cable-row) | One-Arm Dumbbell Row (db-row) | bileşik | Sırt 1, Biceps .5 |
| Arka omuz | Reverse Pec Deck (pec-deck-rear) | Dumbbell Rear Delt Raise (db-rear-delt) | izolasyon | Omuz 1 |
| Biceps | Cable Curl (cable-curl) | Dumbbell Curl (db-curl) | izolasyon | Biceps 1 |
| Squat | Smith Machine Squat (smith-squat) | Goblet Squat (goblet-squat) | bileşik, alt | Ön bacak 1, Arka bacak .5, Kalça 1 |
| Kalça menteşesi | Romanian Deadlift (rdl) | Dumbbell Romanian Deadlift (db-rdl) | bileşik, alt | Arka bacak 1, Sırt .5, Kalça 1 |
| Pres | Leg Press (leg-press) | Bulgarian Split Squat (bulgarian) | bileşik, alt | Ön bacak 1, Arka bacak .5, Kalça 1 |
| Ön bacak | Leg Extension (leg-ext) | Reverse Lunge (reverse-lunge) | izolasyon, alt | Ön bacak 1 |
| Arka bacak | Seated Leg Curl (leg-curl) | Single-Leg Romanian Deadlift (sl-rdl) | izolasyon, alt | Arka bacak 1 |
| Kalça | Hip Thrust (hip-thrust) | Dumbbell Hip Thrust (db-hip-thrust) | bileşik, alt | Kalça 1, Arka bacak .5 |
| Baldır | Standing Calf Raise (calf-raise) | Dumbbell Calf Raise (db-calf) | izolasyon, alt | Baldır 1 |
| Core | Cable Crunch (cable-crunch) | Plank (plank) | core | Karın 1 |

Mevcut kimliklerin kas eşlemesi (`MUS`) değişmez; yeni kimlikler eklenir. Seated Cable Row, Lat Pulldown
ve Cable Curl Emir'in kimliklerini kullanır, ad havuzdaki addır (geçmiş aynı kimlikte birleşir).

## Hafta şablonları (yuvalar, sırasıyla)

- **3 gün:** yukarıdaki Gün 1/2/3 (Emir'in kararı 2).
- **4 gün:**
  - Üst A: yatay it, dikey çekiş, omuz it, yatay çekiş, yan omuz, arka omuz, biceps
  - Alt A: squat, kalça menteşesi, ön bacak, arka bacak, baldır, core
  - Üst B: eğik it, yatay çekiş, omuz it, dikey çekiş, göğüs izolasyon, arka omuz, triceps
  - Alt B: pres, kalça, ön bacak, arka bacak, baldır, core
- **5 gün:**
  - İtiş: yatay it, omuz it, eğik it, yan omuz, göğüs izolasyon, triceps
  - Çekiş: dikey çekiş, yatay çekiş, arka omuz, biceps, core
  - Bacak: squat, kalça menteşesi, pres, ön bacak, arka bacak, baldır
  - Üst: eğik it, yatay çekiş, omuz it, dikey çekiş, yan omuz, biceps, triceps
  - Alt: kalça menteşesi, kalça, ön bacak, arka bacak, baldır, core
- **Yağ yakımı:** yukarıdakilere ek `a-cardio1`, `a-cardio2` (tür `rest`, "Kardiyoyu kaydet"; metin
  "20–30 dk tempolu yürüyüş veya hafif tempo"); `stepGoal: 8000`.

## Set, tekrar, dinlenme

- Bileşik: tekrar 6–10 (yeni 8–12), dinlenme 150 sn (yeni 120). Günün ilk iki hareketi: yeni 3, orta 3,
  ileri 4 set; diğer bileşikler 3 set.
- İzolasyon: tekrar 10–15, dinlenme 75 sn, 3 set.
- Core: yeni 2, orta ve ileri 3 set; tekrar 10–15, dinlenme 75 sn. Plank tekrar yerine saniye (30–60),
  rozet "Saniye".
- Etiket (eff): bileşik "RIR 1–2", izolasyon "RIR 1", core boş.

## Haftalık kas başı set dengeleme

1. Haftalık set = etkin günlerin (kardiyo hariç) hareketleri × set × kas ağırlığı (`MUS` ile aynı hesap).
2. Aralıklar: yeni 8–10, orta 10–14, ileri 12–18. 3 gün şablonunda biceps, triceps, baldır 3–6.
   `form` hedefinde üst sınır da alt sınıra çekilir (aralık [alt, alt]; mümkün olduğunca alt sınıra yakın).
3. Kontrol edilen kaslar: Göğüs, Sırt, Omuz, Biceps, Triceps, Ön bacak, Arka bacak, Baldır.
   Kalça: sabit hedef (kadın 12, erkek 8), alt sınır olarak denetlenir. Karın: yalnızca core kuralı
   (2–3 set/gün), dengelenmez.
4. Altındaysa: o kasın birincil izolasyon hareketine set ekle (hareket başına en çok 5 set); program
   içinde yoksa veya dolmuşsa, o kasın izolasyon hareketini en az hareketi olan ve onu içermeyen güne ekle
   (gün başına en çok 8 hareket).
5. Üstündeyse: o kasın birincil olduğu en son izolasyon hareketinden set çıkar (en az 2 set); yetmezse
   ikincil katkısı olan en son izolasyondan.
6. Kalça hedefi altındaysa hip thrust setleri artar; programda yoksa en az hareketli alt/tüm vücut gününe
   eklenir.
7. Dengeleme sonrası her kasın haftalık toplamı "Bu hafta çalışan kaslar" hedefidir (bugünkü gibi
   programdan toplanır); kalça hedefi `autoProgram.targets` ile sabittir (kadın 12, erkek 8).
   Emir'in programında kalça hedefi 8 kalır.

Bileşiklerin set sayısı (kural 1. ve 2. madde) dengelemede değişmez; yalnızca izolasyonlar oynar.
Aralığa sığmayan durum (örn. bileşiklerden gelen set zaten üst sınırın üstünde) doğrulamada uyarı olarak
raporlanır, program yine üretilir.

## Çalışma anında program seçimi

Açılışta (`normProfile` sonrası, ilk `render` öncesi):

- `own` etkinse: `PROGRAM` = Emir'in 7 günü (indeksler 0–6 aynen) + varsa otomatik günler `off: true`.
  `SESSIONS` = `[0, 1, 2, 4, 5, 3]` aynen.
- `auto` etkinse: `PROGRAM` = otomatik günler + Emir'in günleri `off: true`. `SESSIONS` = otomatik günlerin
  sırası (kardiyo günleri sonda).
- `off` günler `idxOfSid`, `histDocs`, `docStats`, geçmiş detayı için bulunur; `SESSIONS`'a, haftalık
  ızgaraya, `ALL_EX`'e (İlerleme listesi), plan setlerine (`weekMuscle`) girmez.
- Haftalık sayaçlar (`liftTarget`, `weekDoneN`, `weekMet`, seri, "Bu hafta x/N") `SESSIONS` üzerinden
  çalıştığı için yeni günleri doğru sayar (5 gün → /5, 4 → /4, 3 → /3).
- Kas hedefleri: `weekMuscle` plan toplamı `SESSIONS` günlerinden; kalça hedefi etkin programın
  `targets` değerinden (Emir'de 8).
- Program değiştirmek: `setActiveProgram('own'|'auto')` profili yazar ve sayfayı yeniler (11b bunu kullanacak).

## Kilo artışı ve yuvarlama (karar 4)

Her hareket `inc` (kg) ve `step` (yuvarlama adımı) taşır:
- Emir'in hareketleri: birincil kası Ön bacak/Arka bacak/Baldır/Kalça olanlar `inc 5`, diğerleri `inc 2,5`;
  `step 2,5`. Emir'in programında bacak günündeki bütün hareketler alt vücut, diğer günlerde alt vücut
  hareketi yok; dolayısıyla sonuç bugünküyle aynıdır.
- Otomatik salon: alt vücut `inc 5`, üst `inc 2,5`, `step 2,5`. Ev (dambıl): `inc 2`, `step 2`.
- Kullanıldığı yerler: hedef satırı (`targetLine`), "kilo artır" ipucu (`updateCard`), set sonrası öneri
  (`adviceFor`, `round25` → adım parametreli), Bugün hazır (`readyHTML`).
- Doğrulama: Emir'in yedeği boş test tarayıcısına yüklenir; değişiklik öncesi ve sonrası bütün
  hareketler için bu dört çıktının metni birebir karşılaştırılır.

## Dışa açılan test arayüzü

`window.AD = { buildProgram, validateProgram, setActiveProgram, POOL }`.
`validateProgram(prog, plan)` döndürür: boş gün, aynı günde tekrar eden hareket, eksik set/tekrar/
dinlenme, ev'de salon hareketi, kas başı set aralığı dışı (kas, değer, aralık).

## Test planı

- Konsolda 108 kombinasyonun hepsi: hata yok, `validateProgram` temiz.
- Emir'in yedeğiyle önce/sonra koç çıktıları birebir aynı; `activeProgram 'own'` iken 5 sekme ve tam
  antrenman akışı önceki gibi.
- Otomatik program etkinleştirilip (örn. 4 gün, ev, kadın) Bugün, antrenman, bitiş, İlerleme ve kas
  haritası açılır; "Bu hafta x/4"; Emir'in eski kayıtları Geçmiş'te görünür; `own`'a dönünce her şey eski hâlinde.
- Eski yedek (yeni alanlar olmadan) yüklenir; yeni alanlı yedek dışa ve içe aktarılır.
- 400 px, açık ve koyu tema; `sw.js` VERSION artar.

## Uygulayıcıya bırakılanlar

Hareket adlarının ve rozetlerin küçük metin ayrıntıları, motorun iç yapısı, doğrulama mesajlarının
biçimi.

## Kararlarım (Emir'in onayına)

- 4 ve 5 gün şablonlarındaki yuva sıraları yukarıdaki gibi.
- Core seti seviyeye göre 2/3/3; Plank saniye ile.
- Karın dengelenmez; kalça alt sınır olarak denetlenir.
- Dengelemede hareket başına en çok 5 set, gün başına en çok 8 hareket; set çıkarırken en az 2.
- Dengeleme yeni izolasyon hareketi eklerse eksik kadar set alır (en az 2, en çok 5); eşit hareket
  sayısında haftanın ilk günü seçilir. Önce set artırma, sonra hareket ekleme denenir.
- Etiketler: bileşik "RIR 1–2", izolasyon "RIR 1".
- Üretilen program profile kaydedilir, açılışta yeniden üretilmez.
