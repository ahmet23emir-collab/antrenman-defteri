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
