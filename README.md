# Logbot V5 Java

V4 dalından şu özellikler Java/JDA ile uyarlanmıştır:

- Otomatik rol
- V4 rol menüsü: bağımsız `rol-menusu`, etkinlik/renk/burç/oyun/takım/diğer kategorileri
- Leaderboard: mesaj, seviye ve ses süresi
- V4 tarzı `oda-menusu` ile özel/geçici ses odaları
- Slash moderasyon: warn, warnings, clear-warnings, timeout, kick, ban, purge

## Kurulum

1. Java 19+ ve Maven kur.
2. `kurulum.bat` çalıştır.
3. `.env` dosyasına `DISCORD_TOKEN` ekle.
4. `baslat.bat` çalıştır.

## Discord izinleri

Server Members Intent ve Message Content Intent'i aç. Bot için kanal görüntüleme, mesaj gönderme, rol yönetme, kanal yönetme, üyeleri taşıma, bağlanma, konuşma ve moderasyon izinleri gerekir.

State `data/bot-state.json` içinde tutulur.
