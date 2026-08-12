# KÖNİG Digital Brand Platform

Gerçek ürün verileri ve kullanıcı tarafından sağlanan KÖNİG kataloğu temel alınarak hazırlanmış çok sayfalı KÖNİG platformu.

## Çalıştırma

Node.js 20+ gerekir. Harici npm paketi yoktur.

```bash
npm start
```

Ardından: `http://localhost:3000`

## Admin

`http://localhost:3000/admin`

İlk kurulum:
- Kullanıcı: `admin`
- Şifre: `Konig2026!`

İlk girişten sonra **Güvenlik** bölümünden şifreyi değiştirin.

## Yönetilebilen içerikler

- Ürün teknik alanları ve yayın durumu
- Site metinleri
- Projeler
- Renk/dekor listesi
- Katalog PDF yükleme ve aktif katalog seçimi
- İletişim bilgileri
- Admin şifresi
- Proje teklif talepleri
- Admin medya yükleme altyapısı

## Veri modeli

Yerel sürümde kalıcı veri `data/db.json` dosyasında tutulur. Bu, kurulum gerektirmeyen gerçek yazma/okuma yapan bir içerik deposudur. Üretim ortamında PostgreSQL/Supabase gibi harici veritabanına taşınabilecek API sınırları ayrı tutulmuştur.

## Kaynak doğruluğu

Ürün teknik verileri yüklenen KÖNİG kataloğundan alınmıştır. DERA kurumsal bilgileri resmi DERA PVC web kaynağından kontrol edilmiştir. Kaynakta olmayan teknik değerler tahmin edilmemiştir.


REVISION 03 — FINAL DESIGN TOUCHES
- Renkler: premium interactive window color studio. Uses the nine catalog color/decor names and changes only the visual PVC frame layer.
- Product detail pages: real existing profile images remain unchanged. Added interactive technical hotspots, hover/click details, mobile bottom panel, plus existing zoom/pan.
- KÖNİG brand page: expanded editorial/architectural brand presentation using existing factory images, KÖNİG/DERA relationship, catalog-backed figures, production process, and product family.
- No new technical product values were invented.

## REV07 admin hotfix
- Fixed the blank `/admin` screen caused by calling `adminApp()` before the `#adminApp` route container existed. The normal route now creates the container first, then initializes the admin authentication UI.


### Asset servis düzeltmesi (REV12.1)
Sunucu kök dizini artık `process.cwd()` yerine doğrudan `server.js` konumundan belirlenir. Böylece uygulama başka bir klasörden başlatılsa bile `public/assets/*` dosyaları doğru servis edilir. `start.bat` ayrıca 3000 portunda kalan eski KÖNİG Node sürecini kapatıp güncel projeyi başlatır.
