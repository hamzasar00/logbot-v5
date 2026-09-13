# Logbot V5

JavaScript ile yazılmış Discord topluluk botu.

- Otomatik rol
- V4 rol menüsü: bağımsız `rol-menusu`, etkinlik/renk/burç/oyun/takım/diğer kategorileri
- Sıralama: mesaj, seviye ve ses süresi
- Geçici/özel ses odaları ve botun ses kanalına katılması
- Türkçe slash moderasyon komutları

## Türkçe komutlar

- `/kurulum`
- `/otomatik-rol ayarla|kapat|durum`
- `/roller ekle|cikar|menu`
- `/siralama kur|goster`
- `/ses kur|katil|ayril`
- `/moderasyon uyar|uyarilar|uyarilari-temizle|sustur|at|yasakla|temizle`

## Kurulum

1. Node.js 22 veya daha yeni bir sürüm kur.
2. `kurulum.bat` çalıştır.
3. `.env` içine `DISCORD_TOKEN` ekle.
4. `baslat.bat` çalıştır.

State `data/bot-state.json` içinde tutulur.
