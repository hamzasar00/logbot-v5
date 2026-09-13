# Logbot V5

Logbot V4 mantığından yalnızca şu özellikler uyarlanmıştır:

- Otomatik rol
- Leaderboard: mesaj, seviye ve ses süresi
- Geçici/özel ses odaları ve botun ses kanalına katılması
- Slash moderasyon komutları: warn, warnings, clear-warnings, timeout, kick, ban, purge

## Kurulum

1. Discord Developer Portal'da Server Members Intent ve Message Content Intent'i aç.
2. Botu gerekli kanal, rol, moderasyon ve ses izinleriyle sunucuya ekle.
3. Windows'ta kurulum.bat dosyasını çalıştır.
4. .env içine DISCORD_TOKEN değerini ekle.
5. baslat.bat dosyasını çalıştır.

## Komutlar

- /setup: leaderboard kanalı ve geçici ses odası altyapısını hazırlar
- /autorole set|disable|status
- /leaderboard setup|show
- /voice setup|join|leave
- /mod warn|warnings|clear-warnings|timeout|kick|ban|purge

