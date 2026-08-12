# KÖNİG DIGITAL PLATFORM — REV08 CMS

Bu sürüm REV07 ADMIN FIX2 üzerine eklenmiştir.

## Yeni
- Admin > Tüm Site / CMS
- Admin > Medya Library
- Admin > Gelişmiş / Tüm Veri JSON editörü
- Public sitede admin oturumu açıkken `✎ SİTEDE DÜZENLE` canlı düzenleme butonu
- Ürün sayfalarında canlı ürün düzenleme
- Sayfalarda canlı başlık / alt başlık / CTA düzenleme
- Renkler sayfasında canlı renk adı/sıra düzenleme
- Global header/footer metinleri ve SEO alanları
- Medya yükleme, yol kopyalama ve silme
- DB'nin tamamını doğrulayıp kaydetme endpoint'i

## Güvenlik
- Tüm CMS mutation endpointleri admin session gerektirir.
- Public site normal kullanıcıda edit butonunu göstermez.
- Şifre hash olarak tutulur.
