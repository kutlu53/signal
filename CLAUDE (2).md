# Signal (Sinyal) — Lise İngilizce Sinematik Hikâye Oyunu

> Bu dosya projenin kök dizinine konur. Claude Code oturum başında otomatik okur. Karar verilmemiş yerler "AÇIK" olarak işaretlidir; varsayım yapmadan önce kullanıcıya sor.
>
> **Temel karar (2026-10-21):** Ürün bir "ders uygulaması" değil, **izlenen ve oynanan bir dizi** gibi hissettirmeli. Ekranda metin olabildiğince az; anlatım görsel, ses ve animasyonla yapılır. Dil öğrenimi sahnelerin içine gömülür, sahnenin dışına taşan açıklama metni yazılmaz.

## 1. Amaç

Türkiye Yüzyılı Maarif Modeli (TYMM) lise İngilizce (9-12) öğretim programının kazanım yapısını, sinematik bir hikâye-oyunla öğretmek. Hedef kitle: 9. sınıf (B1.1) ile başlayıp 12. sınıfa kadar genişleyecek lise öğrencileri (14-18 yaş). Kullanıcı bir öğretmen (BİLSEM); ürün sınıfta ve evde kullanılabilmeli.

## 2. Müfredat dayanağı (TYMM İngilizce 9-12)

Kaynak: https://tymm.meb.gov.tr/ogretim-programlari/ingilizce-dersi-9-12

- İki hat var: **Regular (9-12): B1.1 → B1.4** ve **Hazırlık-12: B2.1 → B2.4**. Başlangıç hedefi Regular 9. sınıf (B1.1).
- 9, 10, 11. sınıfta **8 tema**, 12. sınıfta **6 tema**. Taslak analizine göre 9-11'de tema başına 14 ders saati, 12'de 17 saat.
- Her tema aynı kazanım şablonunu kullanır: **L1-L4** (dinleme), **R1-R4** (okuma), **S1-S6** (konuşma), **W1-W7** (yazma), **P1** (telaffuz), **V1** (kelime), **G1** (dilbilgisi). Değişen tema, kelime, dilbilgisi ve performans görevidir.
- Alan becerileri: FLFS1-4 (dinleme, okuma, konuşma, yazma) ve FLSS1-3 (dilbilgisi, kelime, telaffuz).
- Her tema bir **performans görevi** + rubrikle değerlendirilir.
- Millî/dinî günler (29 Ekim, 23 Nisan, 19 Mayıs, 15 Temmuz, 30 Ağustos, iki bayram) ve yerel değerler tüm temalara yayılır.

### 9. sınıf temaları (B1.1)

| # | Tema | Not |
|---|---|---|
| 1 | School Life | Ülkeler, uyruklar, diller, başkentler, ulusal günler. Dilbilgisi: *to be*, *can*. Performans: "uluslararası okul" röportaj kaydı |
| 2 | Classroom Life | Sınıf arkadaşları, günlük ve çalışma rutini |
| 3 | Personal Life: Physical Appearance & Personality | Dış görünüş, kişilik |
| 4 | Family Life | Aile üyelerinin meslekleri, iş rutinleri, iş yerleri |
| 5 | Life in the House & Neighbourhood | Ev türleri, odalar, eşyalar |
| 6 | Life in the City & Country | Yemek kültürü, yemek festivalleri |
| 7 | Life in the World & Nature | Nesli tükenen hayvanlar, habitatlar. Dilbilgisi: simple present, *was/were*, *there was/were*, *should*. Performans: belgesel senaryosu |
| 8 | Life in the Universe & Future | Filmler, türler, teknoloji |

10-11. sınıf temaları: School Life & Education, Classroom Life & Learning, Personal Life & Well-being, Family Life & Home, Neighbourhood/City & Social Life, World & Culture, Nature & Global Problems, Universe & Future. 12. sınıf: 6 tema. **10. sınıfın 8 teması resmî sayfadan okundu (2026-10-22, `/unite/541`-`/548`); özet tablo: `docs/tymm-10-sinif.md`.**

**Doğrulama durumu:** 9. sınıf Tema 1 ve Tema 7 resmî sayfadan tam okundu. Diğer temalar için kodlamadan önce resmî sayfadan (`/ingilizce-dersi-9-12/unite/<id>`) kelime ve dilbilgisi listesi çekilmeli.

## 3. Sinematik tasarım ilkeleri (her şeyin üstünde)

1. **Göster, yazma.** Bir bilgi görselle, sesle veya animasyonla verilebiliyorsa metin yazılmaz. Yönerge metni yok; ne yapılacağı sahnenin kendisinden anlaşılır (parlayan nesne, kapıda kilit, titreyen radyo).
2. **Ekranda aynı anda en fazla 1 konuşma balonu, balonda en fazla 8 kelime.** Her balon seslendirilir. Paragraf yok, duvar metin yok.
3. **Seçenekler kısa ve görsel.** Diyalog seçenekleri en fazla 3 adet, her biri en fazla 6 kelime, mümkünse simge/resimle. "I'm from…" seçeneği ülke bayrağı kartlarıyla yapılır.
4. **Her bölüm bir dizi bölümü gibi.** Soğuk açılış (20-30 sn, konuşmasız, yalnızca ses ve görüntü) → başlık kartı → 4-5 sahne → performans görevi → cliffhanger → "Next episode" kartı.
5. **Oynanabilir sahne, izlenen sahne değil.** Sinematik kısımlar 30 saniyeyi geçmez; sonra kontrol oyuncuya geçer. Her sahnede oyuncu bir şey yapar: nesneye dokunur, kart sürükler, söyler, seçer.
6. **Türkçe arayüzde görünmez.** Oyun dili İngilizce; Türkçe yalnızca öğretmen panelinde ve isteğe bağlı altyazıda (kapatılabilir). Anlaşılmayan kelime için çeviri yok, görsel ipucu var (nesneye dokununca resmi parlar).
7. **Okuma ve yazma kazanımları da sahnenin içinde.** Okuma metni bir "nesne" olarak gelir: not kâğıdı, telefon mesajı, afiş, tabela. Yazma bir "nesne"ye yazılır: günlük sayfası, telsiz mesajı, kartpostal. Hiçbiri 60 kelimeyi geçmez (B1.1).
8. **Duygu ve atmosfer.** Gece, yağmur, parazit sesi, neon, fener ışığı. 14-18 yaş için ton: gizem + arkadaşlık, çocuksu değil, korkutucu değil.

### Görsel üslup (öneri, AÇIK)

- **2D illüstrasyon, grafik roman / "anime-lite" ton.** Kalın ama yumuşak hatlar, sınırlı palet (gece mavisi, amber, neon turkuaz sinyal rengi). Çizgi film değil, foto-gerçekçi değil.
- **Katmanlı parallax arka planlar** (3-4 katman: gökyüzü, bina, ön plan, hava efekti). Kamera yavaş kayar; sahne hiç tam durmaz.
- **Ortam animasyonları:** yağmur, parazit, yanıp sönen lamba, nefes alan karakter, kıpırdayan perde. Her sahnede en az 2 sürekli hareket.
- **Karakterler:** yarı gövde portre + 4-5 ifade (nötr, şaşkın, gülümseme, endişe, heyecan) + basit ağız senkronu (3 kare). Tam vücut animasyon gerekmez.
- **Sinyal görseli:** ekranı kaplayan turkuaz dalga biçimi; oyun boyunca aynı motif (menü, yükleme, puan).
- **Üretim:** arka planlar görsel üretim modeliyle tek stil referansına göre üretilir, elle rötuşlanır; animasyonlar Rive/Lottie; karakter ifadeleri sprite seti.

## 4. Hikâye: "Signal" (yeniden kurgu)

**Logline:** Uluslararası bir yatılı okula gelen yeni öğrenci, çatı katındaki eski radyodan kendi adını söyleyen bir sinyal yakalar. Sinyali çözmek için arkadaşlarıyla okulu, mahalleyi, şehri ve doğayı dolaşır; sinyalin gelecekteki aynı okuldan, kendilerinin kurduğu bir projeden geldiğini öğrenir.

**Sabit unsurlar:**
- **Oyuncu:** adı ve ülkesi oyuncu tarafından seçilir (Tema 1 kazanımı), yüzü gösterilmez (omuz üstü kamera).
- **Arkadaşlar (4):** Yasemin (Türkiye, meraklı, lider), Leo (Brezilya, rutinci, saatine düşkün), Mei (Japonya, sessiz, gözlemci, çizer), Omar (Mısır, konuşkan, şakacı). Her bölümde biri öne çıkar.
- **Echo:** eski radyodan konuşan yapay zekâ sesi. Yardım eder ama bazen yanlış/eksik bilgi verir; oyuncu kaynağı sorgulamayı öğrenir (L3/R3). Görseli yalnızca dalga biçimidir.
- **Sinyal motifi:** her bölümde sinyal bir "yer"e taşınır: çatı → sınıf → yıllık → iş yeri → gizli oda → festival → doğa → gökyüzü.

### Bölümler (9. sınıf, 8 bölüm = 8 tema)

| Böl. | Başlık | Tema | Soğuk açılış (konuşmasız) | Oynanan sahneler | Cliffhanger |
|---|---|---|---|---|---|
| 1 | **Static** | School Life | Gece, yağmur, taksi okul kapısında durur. Çatı penceresinde bir ışık yanıp söner. | Kayıt masası (ad/ülke seçimi, bayrak kartları) → yatakhane → çatı katı: radyo *"Where are you from?"* → Yasemin'le tanışma → arkadaşların ülke/dil kartları → röportaj kaydı (performans) | Radyo oyuncunun adını söyler. |
| 2 | **07:45** | Classroom Life | Leo'nun sabah rutini: çalar saat, diş fırçası, koridor. Her gün aynı saatte radyo cızırdar. | Ders programı panosu → Leo'nun rutinini sıraya dizme → sinyalin geldiği saatleri bulma → kendi rutinini kaydetme | Programda var olmayan 7. ders saati belirir. |
| 3 | **The Blurred Face** | Appearance & Personality | Mei kütüphanede eski bir yıllık bulur; bir öğrencinin yüzü silinmiş. | Yıllıktaki öğrencileri tarif etme (saç, boy, kişilik kartları) → tanıkların anlattığını eşleştirme → robot resim oluşturma | Robot resim oyuncuya benzer. |
| 4 | **Frequency** | Family Life | Omar'ın annesi bir radyo kulesinde çalışır. Gece vardiyası, yanıp sönen kule ışığı. | Arkadaşların aile meslek kartları → kuleye ziyaret → iş rutini ve iş yeri sahneleri → frekans defterinde eski bir kayıt | Aynı sinyal 30 yıl önce de kaydedilmiş. |
| 5 | **Room 0** | House & Neighbourhood | Eski okul planı masada açılır; bir oda planda var, binada yok. | Bina planında odaları adlandırma → mahallede eski evleri karşılaştırma → gizli kapıyı bulma (Ses Kilidi) | Gizli odada şehrin işaretli haritası. |
| 6 | **Night Market** | City & Country | Yemek festivali, fenerler, kalabalık, ritim. | Haritadaki işaretler = festival tezgâhları → her tezgâhta bir ipucu (yemek, ülke, şehir/köy karşılaştırması) → ipuçlarını birleştirme | Sinyal yerden değil gökten geliyor. |
| 7 | **Warning** | World & Nature | Şehir dışı, gece, kamp ateşi, uzaktan hayvan sesleri. | Sinyal bir uyarı taşır: *"There were… now there are not."* → habitat kartları → belgesel çekimi (performans) → *should* ile öneriler | Sinyaldeki ses Echo'nun sesi. |
| 8 | **Reply** | Universe & Future | Çatı katı, gökyüzü açık, yıldızlar. Radyo kendiliğinden açılır. | Sinyalin kaynağı: gelecekteki aynı okul, öğrencilerin kurduğu proje → gelecek teknolojisi/film türü kartları → geleceğe yanıt mesajı yazma ve seslendirme | Yanıt gider; radyo yeni bir dilde cızırdar (10. sınıfa köprü). |

### Bölüm 1 "Static" — sahne sahne (prototip hedefi)

1. **Soğuk açılış (25 sn, metin yok):** Yağmur, taksi farları, okul kapısı, bavul. Kamera çatı penceresine kayar; ışık yanıp söner. Başlık kartı: *SIGNAL — Episode 1: Static*.
2. **Kayıt masası:** Görevli *"Welcome. Your name?"* → oyuncu adını yazar (tek metin girişi). *"Where are you from?"* → bayrak kartları kayar, oyuncu seçer → kart dönünce *"I'm from Türkiye."* cümlesi sesli oluşur. (G1: *to be*, hissettirmeden.)
3. **Yatakhane:** Oda arkadaşı Omar. Balonlar: *"Hi! I'm Omar. I'm from Egypt."* → oyuncu 3 seçenekten cevap verir. Omar: *"Can you hear that?"* Tavandan cızırtı.
4. **Çatı katı:** Fener ışığı, tozlu eşyalar, eski radyo. Oyuncu radyoya dokunur; dalga biçimi ekranı kaplar. *"…is… from… Where are you from?"* **Bozuk Mesaj:** parazitli kelimeler, oyuncu bağlamdan tamamlar.
5. **Yasemin gelir:** *"I'm Yasemin. I'm from Türkiye. Who are you?"* Diyalog. *"It can speak four languages!"* **Kanıt Panosu:** duyulan cümleler kart olarak panoya düşer (*I'm…, She's…, It can…*); oyuncu kartları gruplar, kural kilidi açılır.
6. **Okul turu (ertesi sabah):** Leo ve Mei ile tanışma; ülke, dil, başkent kartları; bir NPC yanlış bilgi verir (*"Leo is from Argentina."*) → oyuncu düzeltir (R3/L3).
7. **Ses Kilidi:** Çatı kapısı kilitli. *"Say it: 'I can hear you.'"* Oyuncu söyler, dalga eşleşir, kapı açılır.
8. **Performans: röportaj kaydı.** Oyuncu arkadaşlarıyla "International School" röportajı yapar: 3 soru, 3 cevap, kaydedilir (gerçek ses kaydı). Öğretmen rubrikle değerlendirir.
9. **Kaptan Günlüğü:** Günlük sayfası; 3 resimli ipucu (radyo, Yasemin, bayrak); oyuncu 2-3 cümle yazar.
10. **Cliffhanger:** Gece, radyo kendiliğinden açılır: oyuncunun adını söyler. Ekran kararır. *Next episode: 07:45*.

## 5. Kazanım → oyun mekaniği (sinematik biçim)

| Kazanım | Mekanik | Ekranda nasıl görünür |
|---|---|---|
| G1 dilbilgisi keşfi | **Kanıt Panosu** | Duyulan cümleler kart olarak panoya düşer; oyuncu sürükleyip gruplar. Kural yazılmaz, kart dizilimi doğruysa kilit açılır. Sonra süre baskılı hızlı kullanım. |
| V1 kelime | **Bozuk Mesaj** | Parazit animasyonu, eksik kelime; 3 görsel ipucu; doğru seçince parazit temizlenir. Sözlük yok, görsel var. |
| L1-L4 dinleme | **Sinyal dinleme** | Dalga biçimi ekranda; tekrar dinleme sınırlı (3 kez); soru simge/resimle. |
| R1-R4 okuma | **Nesne okuma** | Not, mesaj, afiş, tabela; en fazla 60 kelime; "şunu bul" göreviyle. |
| S1-S6 konuşma, P1 telaffuz | **Ses Kilidi / Röportaj** | Söyle, dalga eşleşsin, kapı açılsın. Puan değil, dalga görseli geri bildirim. |
| W1-W7 yazma | **Günlük / Telsiz mesajı** | Resimli ipuçlarıyla kısa yazı; arkadaş geri bildirimi balonla gelir; revize edilir. |
| L3/R3 sorgulama | **Yanlış tanık** | Bir NPC bilerek yanlış bilgi verir; oyuncu kanıtla düzeltir. |
| Performans görevi | **Bölüm finali** | O temanın performans görevi sinematik sahne olarak oynanır ve kaydedilir. |
| Millî/dinî günler | **Takvim sahneleri** | Hikâye takvimine yerleşen festival/tören sahneleri. |

## 6. Yapay zekâ ve teknoloji katmanları

Çekirdek oyun yapay zekâsız çalışmalı; yapay zekâ ek katmandır (sınıfta internet zayıf olabilir).

| Katman | Teknoloji | Nerede |
|---|---|---|
| Konuşma tanıma | Web Speech API (prototip); sonra bulut telaffuz puanlama veya Whisper ailesi | Ses Kilidi, röportaj |
| Karakter sesleri | TTS, karakter başına sabit ses, aksan | Tüm diyaloglar |
| Arka plan üretimi | Görsel üretim modeli + tek stil referansı; elle rötuş | Sahneler |
| Animasyon | Rive veya Lottie (ortam efektleri, dalga, ifade geçişleri) | Tüm sahneler |
| Yazma geri bildirimi | LLM + rubrik | Günlük, telsiz mesajı |
| Kural keşfi ipucu | LLM ipucu üretir, cevabı vermez | Kanıt Panosu |
| Kelime tekrarı | Aralıklı tekrar (YZ gerektirmez) | Bozuk Mesaj |
| Echo serbest sohbet | LLM + TTS, B1.1 kısıtlı sistem komutu | Aşama 3 |

### Kademeler
- **Aşama 1 (prototip):** Bölüm 1 dikey dilimi; Web Speech API; önceden yazılmış ve seslendirilmiş diyaloglar; üretilmiş arka planlar; Lottie/Rive ortam animasyonu. YZ çağrısı sıfır.
- **Aşama 2:** Yazma geri bildirimi ve kural ipucu için sınırlı LLM; telaffuz puanlama denemesi.
- **Aşama 3:** Echo ile serbest sohbet, öğretmen paneli analitiği, uyarlanabilir zorluk.

## 7. Arena — bireysel yarışma modu

Hikâye modu öğretir, **Arena** aynı kazanımları hızlı turlarla pekiştirir. Soru havuzu hikâye bölümlerinden beslenir. Her doğru yönerge **sinyal gücü** (puan) kazandırır. Arena da sinematik ilkeye uyar: soru metni kısa, görsel ağırlıklı, aynı dalga motifi.

**KARAR: Arena tamamen bireyseldir.** Takım, ortak puan, ortak görev yoktur.

| Oyun | Kazanım | Nasıl | Puan |
|---|---|---|---|
| **Ses Avı** | L2, L3 | 15 sn klip; özet/ayrıntı/çıkarım sorusu, resimli seçenek | Otomatik |
| **Kanıt Yarışı** | R2, R3 | Kısa nesne metni; önce ana fikir, sonra "şunu bul" | Otomatik |
| **Bozuk Mesaj Blitz** | V1 | Parazitli cümlede eksik kelime | Otomatik |
| **Hatayı Bul** | G1 | Balondaki yanlış cümleyi bul ve düzelt, süreli | Otomatik |
| **Ses Düellosu** | P1, S3-S4 | İki öğrenci aynı cümleyi kaydeder; akran kör oylama | Akran + öğretmen |
| **Hızlı Rapor** | W3-W5 | 90 sn'de 3-4 cümle | Akran + öğretmen |
| **Sinyal Çözücü** | Hepsi | Tek kişilik karma tur | Otomatik + öğretmen |

- Üç sıralama: toplam puan, **gelişim**, seri. Haftalık lig. Karar (2026-10-22): ilk sürümde tek cihaz listesi, takma ad + emoji avatar; gruplar/sunucu sonra.
- Konuşma ve yazma otomatik puanlanmaz. Üst 10 + yakın çevre gösterilir. Takma ad + avatar. Ses kayıtları oylamadan sonra silinir. Puan sunucuda hesaplanır.
- **MVP:** Ses Avı, Hatayı Bul, Bozuk Mesaj Blitz + haftalık lig + gelişim tablosu + canlı oda. **Yapıldı (2026-10-22):** `arena.html` + `src/arena/`; üç oyun, soru havuzu 16 bölümden otomatik; cihazda puan ve takma ad (kullanıcı kararı); lig sekmeleri toplam / bu hafta / gelişim / seri. Yapılmadı: canlı oda, sunucu, akran oylaması (Ses Düellosu, Hızlı Rapor).

## 8. Güvenlik, gizlilik, pedagojik ilkeler

- Kullanıcılar 18 yaş altı. Ses kaydı sunucuda saklanmaz; röportaj kayıtları yalnızca öğretmene gider, değerlendirme sonrası silinir. Veli/okul onayı ve aydınlatma metni gerekir (KVKK).
- ASR hataları olur: puan değil geliştirme ipucu; not öğretmen verir.
- LLM çıktısı seviye, konu ve güvenlik için filtrelenir.
- Çekirdek içerik çevrimdışı çalışabilmeli; varlıklar (arka plan, ses) ilk açılışta indirilir.
- Erişilebilirlik: altyazı açılabilir, animasyonu azaltma seçeneği, renk körlüğü için sinyal rengi + şekil.

## 9. Teknik yön

**Durum (2026-10-22):** 1. sezonun 8 bölümü ve 2. sezonun 1. bölümü (`chapter-09`, 10. sınıf Tema 1) prototip olarak bu depoda çalışıyor (`?ch=02` … `?ch=09`; bölümler otomatik zincirlenir, ad/ülke cihazda hatırlanır, başlangıç ekranında "new player" sıfırlar) (`npm run dev`, bkz. README.md). Seçilen yol: **PWA, bağımlılıksız** (Vite yalnızca geliştirme sunucusu/derleme için). Sahne motoru Canvas 2D ile prosedürel çizim (parallax, yağmur, fener titremesi, toz, parazit, sinyal dalgası); gerçek illüstrasyon gelince `src/engine/bg.js` içindeki katman çizimleri resim katmanlarıyla değiştirilir. PixiJS/Rive gerekirse sonra eklenir; içerik JSON'u değişmez.

Platform alternatifleri (prototip PWA'da kaldıkça AÇIK değil):
- **Godot (HTML5 export + mobil):** daha güçlü sahne/animasyon araçları; konuşma tanıma için ek iş; web çıktısı ağır olabilir.
- **Flutter + Rive:** mobil güçlü, web zayıf.

Bilinen sınırlar: tarayıcı TTS sesi (karakter başına perde/hız farkı var ama tek ses motoru); konuşma tanıma yalnızca Chrome/Edge'de, diğerlerinde "bas-konuş" moduna düşer; Windows'ta emoji bayrak çıkmadığı için bayraklar SVG (`public/flags`, flag-icons, MIT).

İçerik katmanı UI'dan ayrı, platformdan bağımsız tutulur. Bölüm başına bir dosya:
`chapter.id`, `theme`, `cefr`, `cold_open` (varlık listesi, süre), `scenes[]` (arka plan katmanları, ortam animasyonları, kamera hareketi, diyalog düğümleri: konuşan, metin ≤8 kelime, ses dosyası, ifade; seçenekler ≤3), `tasks[]` (evidence_board | broken_message | voice_lock | journal | interview), `vocab[]`, `grammar[]`, `performance_task` (açıklama + rubrik), `cliffhanger`, `outcome_tags[]`.

Varlık üretim hattı: stil referansı → arka plan üretimi (sahne başına 3-4 katman, PNG) → Rive/Lottie efektleri → TTS seslendirme (karakter başına sabit ses) → sahne JSON'una bağlama.

## 10. Yapılacaklar (sıralı)

1. ~~Tema 1 kelime/dilbilgisi listesini çek~~ (yapıldı; JSON'da `vocab_key`, `grammar`).
2. ~~Bölüm 1 senaryosunu balon balon yaz~~ (yapıldı: `public/content/chapter-01.json`).
3. ~~Platform + iskelet + sahne motoru~~ (yapıldı: PWA, Canvas).
4. ~~Bölüm 1 dikey dilimi~~ (yapıldı, baştan sona oynanıyor; headless tarayıcıda hatasız).
5. **Sınıfta/evde gerçek deneme:** mikrofon, TTS sesi, "metin çok mu az, anlaşılıyor mu?" sorusu. Geri bildirime göre balon sayısı/uzunluğu ayarlanır.
6. ~~Stil referansı / arka planlar~~ (yapıldı 2026-10-22: kullanıcı üslubu onayladı; 24 sahnenin tamamı "illüstrasyon geçişi" ile yeniden çizildi — `bg.js` sonundaki üç `Object.assign(PRESETS, …)` bloğu; mürekkep kontur `box/poly/circ` yardımcıları, düz renk, tek gölge katmanı, sahne başına daha çok nesne. Eski taslak çizimler dosyada duruyor ama üzerine yazılıyor; temizlik ileride).
7. ~~Karakter portreleri~~ (yapıldı 2026-10-22, kodla çizilen SVG: `src/engine/chars.js`, 7 karakter × 7 ifade; balonda baş, solda yarı gövde portre. Üretim modeli yok, tüm görseller burada kodla üretiliyor; kullanıcının üslup onayı bekleniyor).
8. Gerçek seslendirme (TTS servisi veya kayıt) → `voice/` klasörü, balon başına ses dosyası.
9. Öğretmen paneli taslağı: röportaj kayıtları + günlük metni + rubrik (şu an kayıt .webm olarak indiriliyor).
10. Aynı şablonla Bölüm 2-8; sonra 10. sınıf. ~~Bölüm 2 "07:45"~~ (yapıldı 2026-10-22: Tema 2 kelime/dilbilgisi resmî sayfadan çekildi; yeni mekanikler `sequence`, `signal_grid`, `note`; yeni sahneler `dorm_morning`, `classroom`, `classroom_night`). ~~Bölüm 3 "The Blurred Face"~~ (yapıldı 2026-10-22: Tema 3 `/unite/535` okundu; yeni mekanikler `whois` (yıllık), `composite` (robot resim); sahne `library`/`library_night`; prosedürel SVG portreler `src/engine/portrait.js`). Cliffhanger plandakinden farklı: robot resim oyuncunun yüzüne değil, silinen öğrencinin isim etiketi oyuncunun adına çıkar (oyuncunun yüzü gösterilmez ilkesi). ~~Bölüm 4 "Frequency"~~ (yapıldı 2026-10-22: Tema 4 `/unite/536` okundu; yeni mekanikler `match` (eşleştirme), `family` (aile ağacı), `note` reveal modu; yeni karakter Leyla (Omar'ın annesi, kule mühendisi); sahneler `tower_night`, `tower_room`). ~~Bölüm 5 "Room 0"~~ (yapıldı 2026-10-22: Tema 5 `/unite/537` okundu; yeni mekanik `floorplan` (kat planı, reveal modu); sahneler `plan_table`, `street`, `hidden_room`). ~~Bölüm 6 "Night Market"~~ (yapıldı 2026-10-22: Tema 6 `/unite/538` okundu; yeni mekanik `stalls` (tezgâhlar, or-soruları), yeni karakter `vendor`; sahneler `market`, `pier_sky`; menemen tarifi `sequence` ile). ~~Bölüm 7 "Warning"~~ (yapıldı 2026-10-22: Tema 7 `/unite/539` okundu; yeni mekanik yok, `match`/`note`/`evidence_board`/`interview` yetti; sahneler `camp`, `coast`; `hoot` baykuş sesi). ~~Bölüm 8 "Reply"~~ (yapıldı 2026-10-22: Tema 8 `/unite/540` okundu; sahneler `attic_sky`, `future_attic`; film türü eşleştirme, was/will kanıt panosu, senaryo yazımı `journal`, film çekimi `interview`, yanıt gönderimi `note` reveal; kapanış: radyo yeni dillerde cızırdar → 10. sınıf köprüsü). **1. sezon tamam.** 2. sezon (10. sınıf) başladı: Bölüm 9 "Rise and Shine" (2026-10-22; yeni mekanik `tags`, sahne `snow_school`; hikâye çerçevesi: sinyaller dünyanın başka okullarından geliyor, ilk sinyal Rusya'da karlı bir yatılı okuldan, öğrenci Anya). Bölüm 10 "Mind Map" yapıldı (2026-10-22; yeni mekanik `mindmap`, sahne `lab`; ikinci sinyal İtalya'da göl kenarında bir okul, öğrenci Marco). Bölüm 11 "In the Pink" yapıldı (2026-10-22; yeni mekanik `body` (vücut haritası), sahne `nurse` (revir); Omar grip olur, Marco moda ve karşılaştırma yapılarıyla arar; üçüncü sinyal Japonya'da dağ okulundan Yuki, büyükannesi 1996'da Northgate'teymiş). Bölüm 12 "Chin Up" yapıldı (2026-10-22; yeni mekanik `then_now`, sahne `mountain_school`; Student 12 = Hana Sato, Yuki'nin büyükannesi; Hana 1996'da Oda 0'da oyuncunun adını duymuş). Bölüm 13 "Catch the Bus" yapıldı (2026-10-22; yeni mekanik `route`, sahne `bus_stop`; Hana 1996-99 eczacı; 1997 fırtına fotoğrafında radyo tutan müşteri Echo'ya benziyor, arkasında "Pier 7. Friday. 20:00."). Bölüm 14 "Grab a Bite" yapıldı (2026-10-22; yeni mekanik `shop`, sahne `supermarket`; Anya, Marco ve Yuki Pier 7'ye gelir, dünya yemeği; Echo dört okulun buluştuğunu doğrular). Bölüm 15 "Save Our Planet" yapıldı (2026-10-22; yeni mekanik `link`, sahne `green_roof` (kuru/yeşil); dört okulun ortak çevre projesi; Echo: son sinyal Dünya'dan değil, 2100). Bölüm 16 "A Whole New World" yapıldı (2026-10-22; yeni mekanik `orbit`, sahne `observatory`; Echo 2100'de dört okulun 2056'da fırlattığı bir uydu; "2100'de hayat" posteri `journal` ile). **2. sezon (10. sınıf, 8 tema) tamam.** Sırada 5 (sınıfta deneme), 8 (seslendirme), 9 (öğretmen paneli), 11 (Arena).
11. Arena MVP.

## 11. Açık sorular (kullanıcıya sor)

- Görsel üslup: grafik roman / anime-lite önerisi uygun mu? Başka referans (film, oyun, dizi) var mı?
- Platform: PWA + PixiJS mi, Godot mu?
- Altyazı: Türkçe altyazı seçeneği olsun mu, yoksa tamamen İngilizce mi?
- Oyuncu karakteri: yüzü görünmesin (omuz üstü) mi, avatar seçsin mi?
- Seslendirme: TTS mi, gerçek ses kaydı mı?
- Proje çerçevesi: TÜBİTAK/okul projesi mi, bağımsız ürün mü?
- Bütçe: görsel üretim, TTS, LLM için aylık sınır?
- Arena sıralaması: gruplar mı, tek sınıf listesi mi? Öğrenci girişi nasıl?

## 12. Kaynaklar

- MEB TYMM İngilizce (9-12): https://tymm.meb.gov.tr/ogretim-programlari/ingilizce-dersi-9-12
- 9. sınıf Tema 1: https://tymm.meb.gov.tr/ingilizce-dersi-9-12/unite/533
- 9. sınıf Tema 7: https://tymm.meb.gov.tr/ingilizce-dersi-9-12/unite/539
- Taslak analizi: https://ingilizcepedia.com/?p=16687
