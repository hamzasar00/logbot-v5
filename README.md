# Logbot V5

Discord toplulukları için V4 log altyapısından uyarlanan topluluk botu.

## Dahil olanlar

- /setup: log kanalları, rol menüsü, leaderboard ve geçici ses odası altyapısı
- /autorole set|disable|status: yeni üyeye otomatik rol
- /roles add|remove|menu: rol alma menüsü
- /leaderboard setup|show: mesaj, seviye ve ses süresi sıralaması
- /voice setup|join|leave: geçici ses odaları ve botun ses kanalına girmesi
- /mod warn|warnings|clear-warnings|timeout|kick|ban|purge: moderasyon
- Üye, mesaj, rol, ses ve moderasyon olayları için loglar

## Kurulum

1. Discord Developer Portal'da bot oluştur.
2. Server Members Intent ve Message Content Intent'i aç.
3. Botu gerekli izinlerle sunucuya davet et: Manage Channels, Move Members, Manage Roles, Moderate Members, Send Messages, Embed Links.
4. Windows'ta kurulum.bat dosyasını çalıştır.
5. Oluşan .env dosyasına DISCORD_TOKEN değerini gir.
6. baslat.bat dosyasını çalıştır.

## Rol hiyerarşisi

Bot rolü, otomatik vereceği ve menüdeki rollerin üzerinde olmalıdır.

## State

Guild ayarları, uyarılar ve leaderboard istatistikleri data/bot-state.json içinde tutulur. Bu dosya Git'e gönderilmez.
