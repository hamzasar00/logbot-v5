# Logbot V5

JavaScript ile yazılmış Discord topluluk botu.

- Otomatik rol
- V4 rol menüsü: bağımsız `rol-menusu`, etkinlik/renk/burç/oyun/takım/diğer kategorileri
- Leaderboard: mesaj, seviye ve ses süresi
- Geçici/özel ses odaları ve botun ses kanalına katılması
- Slash moderasyon: warn, warnings, clear-warnings, timeout, kick, ban, purge

## Kurulum

1. Node.js 22 veya daha yeni bir sürüm kur.
2. `kurulum.bat` çalıştır.
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
