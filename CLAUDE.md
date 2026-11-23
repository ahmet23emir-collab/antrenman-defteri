# Antrenman Defteri — proje rehberi

Bu dosya projenin tek doğruluk kaynağıdır. Claude Code her oturumda önce bunu okur.
Program, koçluk kuralları ve özellik kararları Claude sohbetinde (koç/mimar) alınır ve buraya
"GÖREV" olarak eklenir. Claude Code bu görevleri uygular, kendi başına program değiştirmez.

## Ne yapıyoruz

Emir'in kişisel antrenman takip uygulaması. Türkçe arayüz, tek kullanıcı.
Hedef: telefonda ana ekrana kurulan, tam ekran açılan, internetsiz çalışan bir uygulama (PWA).
Masaüstünde de Chrome/Edge üzerinden kurulabilir olmalı. Antrenman sırasında Claude'u açmak gerekmemeli.

## Teknoloji kararı

- Tek sayfa, **vanilla HTML/CSS/JS**. Framework yok, build adımı yok, npm bağımlılığı yok.
- Dosyalar:
  - `index.html` — uygulamanın tamamı (CSS ve JS içinde).
  - `manifest.webmanifest` — ad, ikon, `display: standalone`, tema rengi.
  - `sw.js` — service worker: uygulama dosyalarını önbelleğe alır, internetsiz açılır, yeni sürüm gelince kendini günceller.
  - `icons/` — 192 ve 512 px ikon, ayrıca iOS için `apple-touch-icon` (180 px).
- Yayın: **GitHub Pages** (main dalı, kök klasör). Her push yeni sürümü yayınlar.
- React Native / Flutter / App Store şimdilik yok. Gerekirse Faz 3'te Capacitor ile sarılır.

## Mevcut durum

`index.html`, Claude sohbetinde artifact olarak geliştirildi ve oradan buraya kopyalandı.
İçinde artifact'a özel kod var:

- `window.claude.use('db' | 'user' | 'downloads')` çağrıları. Artifact dışında `window.claude` yok;
  kod bu durumda zaten localStorage'a düşüyor (`initCloud` erken çıkıyor), yani uygulama çalışır.
- Dosyanın başında artifact yayıncısının eklediği iskelet var (`<!doctype html><html><head>...`),
  `<title>` ve `<style>` ise `<body>` içinde kalmış.
- `exportData` artifact'ın `downloads` yeteneğini kullanıyor, yoksa metin kutusuna düşüyor.

## Veri modeli (geriye uyumluluk şart)

Tüm veri localStorage'da, üç anahtar:

- `antrenman-defteri-v1` — antrenmanlar. Anahtar `YYYY-MM-DD_<sid>`, sid: push1, pull1, legs, cardio, push2, pull2, rest.
  Belge: `{ date, s, fin, cardio:{d,m}, sets:{ <exId>: [ {d, w:[...], r:[...]} ] }, add:{<exId>:n}, t0, t1, note, u }`
  `w` ve `r` dizileri hareketin parçalarına göre (süperset 2 parça). `u` = son değişiklik zamanı (ms).
- `antrenman-defteri-daily-v1` — günlük: takviye, su, protein, kilo, bel, uyku, adım, öğünler. Anahtar tarih.
- `antrenman-defteri-profile-v1` — profil: takviye listesi, protein katsayısı, hedef, boy, yaş, cinsiyet, kalori ayarı, hareket notları, özel yemekler.

Okuma her zaman `normalize`, `normDaily`, `normProfile` üzerinden. Şema değişirse bu fonksiyonlar eski
veriyi okumaya devam etmeli. **Kullanıcı verisi asla silinmez veya sıfırlanmaz.**

Yedek dosyası formatı `{ app: 'antrenman-defteri', v: 2, exported, workouts, daily, profile }`.
Emir eski uygulamadan bu formatta yedek alıp yeni uygulamaya yükleyecek; içe aktarma bu formatı okumaya devam etmeli.

## Program ve koçluk kuralları

Program `index.html` içindeki `PROGRAM` dizisinde. Hareket, set, tekrar aralığı ve dinlenme süreleri
koç kararıdır; sadece bu dosyadaki bir GÖREV ile değişir.

Uygulamada olan kurallar (bozma):
- Antrenmanlar günden bağımsız; hafta pazartesi sıfırlanır; sıradaki önerisi dünkü kas grubunu atlar; aynı tür antrenman 48 saatten önce gelirse uyarı.
- Çift ilerleme: tüm setler üst tekrara ulaşınca kilo artır (üst vücut 2,5 kg, bacak 5 kg).
- 3 seans ilerleme yoksa takılma uyarısı; 7 hafta aralıksız antrenmanda deload önerisi.
- İlk sete yazılan kilo sonraki bitmemiş setlere geçer; elle değiştirilen set kendi kilosunu korur ve zincir oradan devam eder.
- Set bitince kilo/tekrar geri bildirimi, rekor etiketi, dinlenme sayacı, ekran açık kalma.

## Çalışma kuralları

- Arayüz metinleri Türkçe, sade, kısa.
- Mobil öncelikli (≈400 px), alt sekme çubuğu ve güvenli alan boşlukları korunur.
- Renkler `:root` token'larından; açık ve koyu tema ikisi de çalışmalı.
- Her görev bitince: tarayıcıda telefon genişliğinde kontrol et, sonra anlamlı bir commit at ve push et.
- Emin olmadığın bir program/koçluk kararı varsa uygulama, not düş ve Emir'e sor.

## Fazlar

- **Faz 1 — Kurulabilir uygulama (şimdi)**
  1. Artifact iskeletini temizle: düzgün `<!doctype html>`, `<head>` içinde charset, viewport (`viewport-fit=cover`), `<title>`, fontlar ve stil.
  2. `manifest.webmanifest`, ikonlar ve `sw.js` ekle; `index.html`'e bağla. iOS için `apple-mobile-web-app-capable` ve `apple-touch-icon`.
  3. `exportData`'yı `Blob` + `<a download>` ile dosya indirecek şekilde yaz; `window.claude` kodunu kaldır ya da zararsız bırak, "Hesabında kayıtlı" yazısını "Bu cihazda kayıtlı" olarak sabitle.
  4. Yedek ekranına açıklama: "Eski uygulamadan aldığın yedeği buradan yükle."
  5. GitHub Pages'te yayınla, linki Emir'e ver.
- **Faz 2 — Cihazlar arası eşitleme:** Supabase (ücretsiz), e-posta ile giriş, aynı üç veri türü, `u` alanına göre son yazan kazanır. İnternetsizken yerelde çalışmaya devam eder.
- **Faz 3 (isteğe bağlı):** Capacitor ile mağaza uygulaması.

## Görevler

Yeni görevler buraya eklenir, biten görev işaretlenir.

- [x] GÖREV 1: Faz 1'in tamamı. (Yayın: https://ahmet23emir-collab.github.io/antrenman-defteri/)
- [x] GÖREV 2: Hata düzeltme (QA raporu). Veri modeli ve geriye uyumluluk kuralları aynen geçerli.
  - Önemli (veri hataları):
    1. Set tamamlama doğrulaması: tekrar boş veya 0 ise set işaretlenmez; tekrar alanı kısa süre kırmızı çerçeve alır, "Tekrar sayısını yaz" uyarısı çıkar. Kilo boş olabilir (vücut ağırlığı hareketleri, boş = 0 ek kilo); doluysa geçerli sayı olmalı. Mevcut kayıtlara dokunulmaz, sadece yeni giriş doğrulanır.
    2. Kilo ve tekrar alanlarında harf girişi engellenir: `inputmode="decimal"`, virgül ve nokta kabul (42,5), harf ve eksi işareti girerken filtrelenir. Geçersiz değer sessizce silinmez; alan kırmızı olur ve kısa uyarı çıkar.
    3. Vücut sekmesi: boy, kilo, yaş değiştikçe protein/kalori hedefleri ve grafik anında güncellenir (input olayı, 300 ms gecikme).
  - Küçük:
    4. "Antrenmanı bitir": tamamlanmamış set varsa onay sorar ("14 setten 3'ü yapıldı. Yine de bitirelim mi?" [Devam et] [Bitir]); hepsi yapıldıysa sormadan biter.
    5. Antrenman bitince dinlenme sayacı durur ve kapanır.
    6. Takviye eklerken ad boşsa görünür uyarı çıkar.
    7. Geçmiş: takvimde güne veya seans kartına basınca antrenman detayı açılır (hareketler, set başına kilo × tekrar, not). Salt okunur; "Düzenle" ile kayıt ekranına geçilir. Şema değişmez.
    8. Haftalık kas çubukları kas grubuna göre renklenir: itiş, çekiş, bacak ayrı; renkler `:root` token'larından, iki temada okunur.
  - Yedek indirme:
    9. "Yedeği indir": `navigator.canShare({files})` destekleniyorsa paylaşım menüsü açılır, yoksa Blob + `<a download>`. İçerik formatı aynı: `{ app: 'antrenman-defteri', v: 2, exported, workouts, daily, profile }`.
  - Bitirince: `sw.js` VERSION artır; boş test tarayıcısında 400 px'te 1, 2, 3, 4, 5, 7'yi dene; commit + push.
- [x] GÖREV 3: Salon ergonomisi (UX denetimi, yüksek öncelik). Veri modeli, program ve koçluk kuralları aynen geçerli. Koç uyarıları (48 saat, takılma, deload) kaldırılmaz, sadece yerleri değişebilir.
  1. Antrenman sekmesi açılınca sıradaki yapılmamış sete kendiliğinden kaydırılır. Haftalık ızgara ve koç önerisi tek satırlık özete iner ("Bu hafta 3/6 · Öneri: Çekiş 1"), dokununca açılır. Başlık kartı küçülür; kilo/tekrar alanları, hedef ve ✓ en baskın öğe olur. Aktif uyarı (48 saat gibi) özet satırında görünür kalır.
  2. Boş tekrarla ✓ basınca geçen seansın tekrarını yazma davranışı kalır ama görünür olur: (a) geçen seferin değeri placeholder, kontrast en az 4,5:1; (b) yanında bugünün hedefi ("geçen sefer 5 · hedef 6–8"); (c) otomatik doldurulan değer farklı stille işaretlenir ve altta "Geçen seferki 5 tekrar yazıldı · Geri al" bildirimi çıkar.
  3. Antrenman sırasında basılan tüm düğmelerin dokunma alanı en az 44 × 44 px (.mini, .rb, .pill, "−", "Form, alternatif ve notum"); görsel boyut değil, padding/dokunma alanı büyür.
  4. Bildirim altta, dinlenme çubuğunun hemen üstünde, safe-area'ya uygun çıkar. "Yeni rekor" ve kilo önerisi en az 6 sn kalır, dokununca kapanır.
  5. Tüm düğme ve ✓ dairesine `touch-action: manipulation`.
  6. Dinlenme çubuğu sıradaki set satırını örtmez: sayfaya çubuk yüksekliği kadar alt boşluk, sıradaki set çubuğun üstünde görünür bırakılır.
  7. Kilo önerisinde alt ve üst sayı eşitse "6 tekrar hedefle" yazılır ("6–6" hatası).
  - Kapsam dışı: yazı boyutu cilası, sarı çubuk kontrastı, boş ekran düğmeleri, erişilebilirlik (aria, inert, h1).
  - Bitirince: `sw.js` VERSION 'v3'; boş test tarayıcısında 400 px, açık ve koyu temada dene; commit + push.
- [x] GÖREV 4: Görsel cila. Veri modeli, program, koçluk kuralları ve GÖREV 3'teki antrenman ekranı düzeni aynen kalır.
  1. En küçük yazılar en az 12 px (REKOR, takvim gün harfleri, RIR rozeti, "Sıradaki/Bekliyor", alt sekme adları); 400 px'te taşma/sıkışma yok, özellikle alt sekme çubuğu.
  2. Açık temada bacak rengi daha koyu amber/hardal (grafik nesneler için en az 3:1); koyu tema rengi kalır; kas ve protein çubukları dahil; renk `:root` token'ından.
  3. Boş ekran yönlendirmesi: Beslenme'de yemek yokken açıklama + "Yemek ekle"; Vücut'ta kilo/boy/yaş eksikken "Hedeflerini görmek için kilo, boy ve yaşını yaz" + ilgili alana götüren düğme.
  4. "Yemek listeme ekle" ve tüm sekmelerde 44 px altındaki etkileşimli öğeler 44 px.
  - Kapsam dışı: yeni özellik, palet/font değişikliği, antrenman ekranı düzeni, erişilebilirlik.
  - Bitirince: `sw.js` VERSION 'v4'; boş test tarayıcısında 400 px, açık ve koyu temada 5 sekme; commit + push.
- [x] GÖREV 5: Sakin görünüm (anti-ui-slop denetiminden). Geri dönüş noktası: `v4-oncesi` etiketi. Veri modeli, program, koçluk kuralları, GÖREV 3'teki antrenman ekranı sırası, set satırı/✓ boyutları, 44 px dokunma alanları ve 12 px yazı sınırı aynen kalır. Koç geri bildirimi (öneri, rekor, uyarılar) kaldırılmaz, sadece görünümü hafifler.
  - Commit 1 (yapı ve yazı), sw.js 'v5a':
    1. Hareket kartlarında kenarlık/gölge yok; hareketler ince ayırıcı ve boşlukla ayrılır; dolu yüzey sadece set satırları.
    2. Isınma, Geçen sefer, Bugünkü hedef ve set altı satır tek biçim (küçük gri etiket + normal yazı, sol çizgili blok yok). Arka planlı kutu sadece kilo artır/düşür önerisinde; "bu kiloda devam" sade tek satır.
    3. Dev sayfa başlıkları kalkar, üstte küçük logo satırı kalır; "Bu cihazda kayıtlı" sadece Geçmiş'teki yedek kartında.
    4. Dar büyük harfli yazı tipi sadece sayılarda; başlıklar ve öğün başlıkları gövde yazı tipinde, normal büyük-küçük harf, yarı kalın; harf aralıklı büyük harf etiketler normal yazıya döner.
  - Commit 2 (renk), sw.js 'v5b':
    5. Antrenman başlık kartı normal yüzey, plaka çizimi yok; tür rengi sadece küçük işaret ve ilerleme çubuğunda.
    6. Nötrler sıcak: açık temada kırık beyaz/kum, koyu temada sıcak kömür; ✓ yeşili biraz solar ama net kalır.
    7. İki temada tüm renk çiftleri ölçülür: metin ≥ 4,5:1, grafik ≥ 3:1 (bacak dahil); tür renkleri ayırt edilebilir kalır.
  - Kapsam dışı: üçlü istatistik kutuları, takvim ekranı, yeni özellik, font değişikliği, erişilebilirlik.
- [x] GÖREV 6: İlerleme ekranı. Geri dönüş noktası: `ilerleme-oncesi` etiketi. Veri modeli ve kayıtlar değişmez (sadece okunur), yeni bağımlılık yok (SVG elle), 400 px, iki tema, antrenman ekranı düzeni aynen kalır.
  - Yer: Geçmiş sekmesinin üstünde "Seanslar | İlerleme" seçici; mevcut "Hareket gelişimi" İlerleme tarafına taşınır. Alt sekme sayısı 5 kalır.
  - Grafik: seansın en ağır seti (kg) çizgisi, her noktada o setin tekrarı; altında son seansların listesi. Tahmini 1RM ayrı sayı, çizilmez.
  - Rekorlar: "En ağır set" (kg × tekrar) ve "En iyi tahmini 1RM", tarihleriyle.
  - Hafta karşılaştırması: bu hafta şu ana kadar ↔ geçen hafta aynı güne kadar; antrenman, set, hacim ve farkları.
  - Hareket durumu: Kilo artır (son seansta tüm setler üst tekrarda), İlerliyor, Takıldı (mevcut takılma kuralı), Veri az (3'ten az seans).
  - Sadece şu anki programdaki hareketler. Vücut ağırlığı hareketlerinde grafik en iyi tekrar; rekorlar en çok tekrar ve en ağır ek kilo.
  - Aralık: son 12 hafta varsayılan, "Tümü" düğmesi.
  - Rekor, tahmini 1RM, çift ilerleme ve takılma hesapları antrenman ekranıyla aynı fonksiyonları kullanır; iki ekranda farklı sayı çıkması hatadır.
  - Veri azsa (3'ten az seans) grafik yerine kısa açıklama; hiç kayıt yoksa boş durum.
- [x] GÖREV 7: İlerleme ekranı düzeltmeleri.
  1. Tekrar grafiğinin dikey ekseni tam sayı (ondalık yok); kilo ekseni ondalık kalabilir.
  2. Grafik nokta etiketleri çizgiyle çakışmaz (etiketin arkasında zemin rengi).
  3. Durum tutarlılığı: bugün devam eden, bitmemiş seans iki ekranda da takılma/ilerliyor/kilo artır hesabına girmez; iki ekran aynı seans kümesini kullanır. Rekor ve grafik bitmemiş seansı göstermeye devam edebilir.
  4. "12 hafta" süzmesi 14+ haftalık örnek veriyle test edilir.
  - Bitirince: `sw.js` VERSION 'v7'; 400 px açık ve koyu tema testi; commit + push.
