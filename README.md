| `src/arena/` | Arena sayfası (`arena.html`): giriş, menü, üç oyun, lig. Sahne motoru ve karakter portreleri hikâyeyle ortak. |
| `src/tasks/` |tüm sahneler bu geçişten geçti (eski taslak çizimler dosyanın üst kısmında duruyor, üzerine yazılıyor). || `src/engine/bg.js` | Canvas sahne motoru: parallax katmanlar, yağmur, fener titremesi, toz, parazit, sinyal dalgası. Tüm sahneler kodla çizilir (görsel üretim modeli yok). Dosya sonundaki "Illustrated scene pass" bloğu, sahneleri portrelerle aynı üsluba (mürekkep kontur, düz renk) çeken yeniden çizimleri içerir; şimdilik `gate_night`, `dorm`, `attic`. || `src/engine/ui.js` | Balon, seçenekler, kartlar, başlık kartı. Konuşan karakterin yarı gövde portresi (`cast`) solda belirir. |
| `src/engine/chars.js` | Karakter portreleri: kodla çizilen SVG, karakter başına 7 ifade (neutral, surprised, smile, worried, excited, wink, think). Grafik roman / anime-lite üslup: kalın yumuşak mürekkep çizgi, düz renkler, tek gölge katmanı. Yeni karakter eklemek için `CHARS_ART` tablosuna bir satır (ten, saç, stil, üst giysi, aksesuar) yeter. |Okuma Notu (R2-R3, `note`), Kim Kimdir / yıllık (L2-V1, `whois`), Robot Resim (V1-R2, `composite`; `mode: "reveal"` ile cliffhanger), Eşleştirme (V1, `match`: iki sütun), Aile Ağacı (V1, `family`), Kat Planı (V1-G1, `floorplan`; `mode: "reveal"` ile planda olmayan oda belirir), Gece Pazarı Tezgâhları (L2-S-G1, `stalls`: satıcı sorar, oyuncu seçer, ipucu kartı düşer; Bölüm 9'da kulüp fuarı olarak da kullanılıyor), Soru Kuyrukları (G1-P1, `tags`: "…, isn't it?" tamamlama; 10. sınıfta beş temada tekrar eder), Zihin Haritası (V1, `mindmap`: merkez kavram, dallar, kelime kartları), Vücut Haritası (V1-L2, `body`: karakter portresi üzerinde noktalar, tarif edilen bölgeye dokunma), O Zaman / Şimdi (G1, `then_now`: iki fotoğraf çerçevesi, cümleyi doğru zamana iğneleme), Rota Seçimi (V1-S, `route`: ulaşım kartları, artı-eksi, ihtiyaca göre seçim), Market (V1-G1, `shop`: raflar, alışveriş listesi, some/any/much/many), Cümle Bağlama (G1, `link`: iki yarım, bağlaç seçimi which/who/that/so), Yörünge (V1-L2, `orbit`: güneş sistemi, ipucuyla gezegeni yerleştirme; `mode: "reveal"` ile Neptün ötesinde Echo belirir). Okuma Notu `mode: "reveal"` ile daktilo efektli cliffhanger olur. Portreler `src/engine/portrait.js` ile prosedürel SVG olarak çizilir. || `public/content/chapter-01.json` … `chapter-03.json` | Bölüm 1 (Static, School Life), Bölüm 2 (07:45, Classroom Life), Bölüm 3 (The Blurred Face, Appearance & Personality), Bölüm 4 (Frequency, Family Life), Bölüm 5 (Room 0, House & Neighbourhood), Bölüm 6 (Night Market, City & Country), Bölüm 7 (Warning, World & Nature), Bölüm 8 (Reply, Universe & Future; sezon finali), Bölüm 9 (Rise and Shine; 10. sınıf Tema 1), Bölüm 10 (Mind Map; Tema 2 Classroom Life & Learning), Bölüm 11 (In the Pink; Tema 3), Bölüm 12 (Chin Up; Tema 4), Bölüm 13 (Catch the Bus; Tema 5), Bölüm 14 (Grab a Bite; Tema 6), Bölüm 15 (Save Our Planet; Tema 7), Bölüm 16 (A Whole New World; Tema 8 Universe & The Future; 2. sezon finali).| `src/tasks/` | Görevler: Bozuk Mesaj (V1), Kanıt Panosu + hız turu (G1), Ses Kilidi (P1), Röportaj kaydı (performans), Kaptan Günlüğü (W), Rutin Sıralama (L2, `sequence`), Sinyal Panosu / ders programı (L2-R2, `signal_grid`; `mode: "reveal"` ile cliffhanger), Okuma Notu (R2-R3, `note`). || `public/content/chapter-01.json`, `chapter-02.json` | Bölüm 1 (Static, School Life) ve Bölüm 2 (07:45, Classroom Life). Sahneler, balonlar (≤8 kelime), seçenekler, görevler. Kod değişmeden yeni bölüm eklenir (11. sınıf için `chapter-17.json` → `?ch=17`); bir önceki bölümün `next` alanı zinciri kurar. |# Signal — 1. sezon (Bölüm 1-8, 9. sınıf) + 2. sezon (Bölüm 9-16, 10. sınıf)

Tarayıcıda çalışan, derleme gerektirmeyen sinematik hikâye oyunu. Proje planı için `CLAUDE (2).md`.

## Çalıştırma

**Arena** (bireysel hızlı turlar): `http://localhost:5173/arena.html` veya başlangıç ekranındaki ARENA düğmesi. Üç oyun (Static Blitz = Bozuk Mesaj Blitz V1, Spot the Mistake = Hatayı Bul G1, Sound Hunt = Ses Avı L2-L3); soru havuzu `public/content/chapter-*.json` dosyalarından otomatik üretilir (bozuk mesaj boşlukları, seçenekli diyaloglar, hız turu soruları, notlar sesli okunur, rutin saatleri, "kim konuşuyor"). Puan = sinyal gücü (doğru 10 + süre bonusu 5'e kadar + her 3 seride 5). Takma ad, avatar, puanlar ve geçmiş cihazda (`localStorage` "arena"). Lig: toplam, bu hafta, gelişim (son 3 turun ortalaması − önceki 3), seri. Sunucu yok.


```
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` aç (Bölüm 1). Bölüm 2-16 için `?ch=02` … `?ch=16` (9-16 = 2. sezon); her bölüm bitince bir sonraki otomatik açılır. Oyuncunun adı ve ülkesi cihazda hatırlanır; sonraki bölümler tekrar sormaz (başlangıç ekranındaki "new player" bağlantısı sıfırlar). Ses ve mikrofon için Chrome veya Edge önerilir (konuşma tanıma yalnızca bunlarda var; diğer tarayıcılarda ses kilidi "bas-konuş" moduna düşer).

Sınıf kullanımı için derle: `npm run build` → `dist/` klasörünü herhangi bir statik sunucuya koy. İlk açılıştan sonra çevrimdışı çalışır (service worker).

## Yapı

| Yol | Ne |
|---|---|
| `public/content/chapter-01.json` | Bölüm 1'in tüm içeriği: sahneler, balonlar (≤8 kelime), seçenekler, görevler. Kod değişmeden yeni bölüm eklenir: `chapter-02.json` → `?ch=02`. |
| `src/engine/bg.js` | Canvas sahne motoru: parallax katmanlar, yağmur, fener titremesi, toz, parazit, sinyal dalgası. Şimdilik prosedürel çizim; gerçek illüstrasyon gelince katmanlar resimle değiştirilir. |
| `src/engine/audio.js` | Yağmur/parazit sesi (sentez), çan, karakter başına tarayıcı TTS. |
| `src/engine/ui.js` | Balon, seçenekler, kartlar, başlık kartı. |
| `src/engine/sequencer.js` | JSON adımlarını sırayla oynatır. |
| `src/tasks/` | Görevler: Bozuk Mesaj (V1), Kanıt Panosu + hız turu (G1), Ses Kilidi (P1), Röportaj kaydı (performans), Kaptan Günlüğü (W). |

## Adım türleri (JSON)

`cold_open`, `title`, `bg`, `say`, `choice`, `name_entry`, `flag_pick`, `broken_message`, `evidence_board`, `voice_lock`, `interview`, `journal`, `sequence`, `signal_grid`, `note`, `whois`, `composite`, `match`, `family`, `floorplan`, `stalls`, `tags`, `mindmap`, `body`, `then_now`, `route`, `shop`, `link`, `orbit`, `sfx`, `fade`, `wait`, `end`.
Her adıma `skipIf: "name"` gibi bir alan eklenirse o bilgi zaten biliniyorsa adım atlanır. `bg` ve soğuk açılış karelerinde `vars` (ör. `{ "clock": "07:45", "alarm": true }`) sahneye değişken geçirir, `sfx` ses çalar (`alarm`, `thud`, `chime`, `burst`, `hoot`).
Metinlerde `{name}`, `{country}`, `{flag}`, `{nationality}`, `{language}` yer tutucuları kullanılabilir. Her balonda `tr` alanı isteğe bağlı Türkçe altyazıdır (sağ üstteki TR düğmesi).
