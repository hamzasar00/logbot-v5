# Logbot V5

Logbot V4 mantığından JavaScript/TypeScript ile uyarlanan topluluk botu.

- Otomatik rol
- V4 rol menüsü: bağımsız `rol-menusu`, etkinlik/renk/burç/oyun/takım/diğer kategorileri
- Leaderboard: mesaj, seviye ve ses süresi
- Geçici/özel ses odaları ve botun ses kanalına katılması
- Slash moderasyon: warn, warnings, clear-warnings, timeout, kick, ban, purge

## Kurulum

1. Discord Developer Portal'da Server Members Intent ve Message Content Intent'i aç.
2. Node.js 22+ kur ve `kurulum.bat` çalıştır.
3. `.env` içine `DISCORD_TOKEN` ekle.
4. `baslat.bat` çalıştır.

## Komutlar

- `/setup`: rol menüsü, leaderboard ve geçici ses altyapısını hazırlar
- `/roles add|remove|menu`: V4 rol menüsünü yönetir
- `/autorole set|disable|status`
- `/leaderboard setup|show`
- `/voice setup|join|leave`
- `/mod warn|warnings|clear-warnings|timeout|kick|ban|purge`

State `data/bot-state.json` içinde tutulur.
