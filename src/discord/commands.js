import {
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
const commands = [
  new SlashCommandBuilder().setName("kurulum").setDescription("S\u0131ralama ve ge\xE7ici ses odas\u0131 altyap\u0131s\u0131n\u0131 haz\u0131rlar.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()),
  new SlashCommandBuilder().setName("otomatik-rol").setDescription("Yeni \xFCyeler i\xE7in otomatik rol ayar\u0131n\u0131 y\xF6netir.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()).addSubcommand(
    (subcommand) => subcommand.setName("ayarla").setDescription("Otomatik verilecek rol\xFC ayarlar.").addRoleOption(
      (option) => option.setName("rol").setDescription("Yeni \xFCye rol\xFC").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("kapat").setDescription("Otomatik rol\xFC kapat\u0131r.")
  ).addSubcommand(
    (subcommand) => subcommand.setName("durum").setDescription("Otomatik rol ayar\u0131n\u0131 g\xF6sterir.")
  ),
  new SlashCommandBuilder().setName("roller").setDescription("V4 rol alma men\xFCs\xFCn\xFC y\xF6netir.").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles.toString()).addSubcommand(
    (subcommand) => subcommand.setName("ekle").setDescription("Bir rol\xFC V4 se\xE7im men\xFCs\xFCne ekler.").addRoleOption(
      (option) => option.setName("rol").setDescription("Men\xFCde g\xF6r\xFCnecek rol").setRequired(true)
    ).addStringOption(
      (option) => option.setName("kategori").setDescription("V4 rol kategorisi").setRequired(true).addChoices(
        { name: "Etkinlik", value: "event" },
        { name: "Renk", value: "color" },
        { name: "Bur\xE7", value: "zodiac" },
        { name: "Oyun", value: "game" },
        { name: "Tak\u0131m", value: "team" },
        { name: "Di\u011Fer", value: "other" }
      )
    ).addStringOption(
      (option) => option.setName("emoji").setDescription("\u0130ste\u011Fe ba\u011Fl\u0131 emoji").setRequired(false)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("cikar").setDescription("Rol\xFC men\xFCden \xE7\u0131kar\u0131r; sunucudan silmez.").addRoleOption(
      (option) => option.setName("rol").setDescription("Men\xFCden \xE7\u0131kar\u0131lacak rol").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("menu").setDescription("Ba\u011F\u0131ms\u0131z rol-menusu kanal\u0131n\u0131 olu\u015Fturur veya yeniler.")
  ),
  new SlashCommandBuilder().setName("siralama").setDescription("Sunucu s\u0131ralama men\xFCs\xFCn\xFC y\xF6netir.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()).addSubcommand(
    (subcommand) => subcommand.setName("kur").setDescription("S\u0131ralama men\xFCs\xFCn\xFC g\xF6nderir.")
  ).addSubcommand(
    (subcommand) => subcommand.setName("goster").setDescription("S\u0131ralama men\xFCs\xFCn\xFC g\xF6sterir.")
  ),
  new SlashCommandBuilder().setName("ses").setDescription("Ses odas\u0131 i\u015Flemlerini y\xF6netir.").addSubcommand(
    (subcommand) => subcommand.setName("kur").setDescription("Ge\xE7ici ses odas\u0131 sistemini haz\u0131rlar.")
  ).addSubcommand(
    (subcommand) => subcommand.setName("katil").setDescription("Bulundu\u011Fun ses odas\u0131na botu sokar.")
  ).addSubcommand(
    (subcommand) => subcommand.setName("ayril").setDescription("Botu ses odas\u0131ndan \xE7\u0131kar\u0131r.")
  ),
  new SlashCommandBuilder().setName("moderasyon").setDescription("Moderasyon komutlar\u0131.").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers.toString()).addSubcommand(
    (subcommand) => subcommand.setName("uyar").setDescription("Kullan\u0131c\u0131ya uyar\u0131 verir.").addUserOption(
      (option) => option.setName("kullanici").setDescription("Uyar\u0131lacak kullan\u0131c\u0131").setRequired(true)
    ).addStringOption(
      (option) => option.setName("neden").setDescription("Uyar\u0131 nedeni").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("uyarilar").setDescription("Kullan\u0131c\u0131n\u0131n uyar\u0131lar\u0131n\u0131 g\xF6sterir.").addUserOption(
      (option) => option.setName("kullanici").setDescription("Uyar\u0131lar\u0131 g\xF6sterilecek kullan\u0131c\u0131").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("uyarilari-temizle").setDescription("Kullan\u0131c\u0131n\u0131n t\xFCm uyar\u0131lar\u0131n\u0131 siler.").addUserOption(
      (option) => option.setName("kullanici").setDescription("Uyar\u0131lar\u0131 silinecek kullan\u0131c\u0131").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("sustur").setDescription("Kullan\u0131c\u0131y\u0131 s\xFCreli susturur.").addUserOption(
      (option) => option.setName("kullanici").setDescription("Susturulacak kullan\u0131c\u0131").setRequired(true)
    ).addIntegerOption(
      (option) => option.setName("dakika").setDescription("Dakika").setRequired(true).setMinValue(1).setMaxValue(40320)
    ).addStringOption(
      (option) => option.setName("neden").setDescription("Susturma nedeni").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("at").setDescription("Kullan\u0131c\u0131y\u0131 sunucudan atar.").addUserOption(
      (option) => option.setName("kullanici").setDescription("At\u0131lacak kullan\u0131c\u0131").setRequired(true)
    ).addStringOption(
      (option) => option.setName("neden").setDescription("At\u0131lma nedeni").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("yasakla").setDescription("Kullan\u0131c\u0131y\u0131 sunucudan yasaklar.").addUserOption(
      (option) => option.setName("kullanici").setDescription("Yasaklanacak kullan\u0131c\u0131").setRequired(true)
    ).addStringOption(
      (option) => option.setName("neden").setDescription("Yasaklama nedeni").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("temizle").setDescription("Kanaldan mesajlar\u0131 toplu siler.").addIntegerOption(
      (option) => option.setName("miktar").setDescription("Silinecek mesaj say\u0131s\u0131").setRequired(true).setMinValue(1).setMaxValue(100)
    )
  )
].map((command) => command.toJSON());
function getSubcommand(interaction) {
  return interaction.options.getSubcommand();
}
export {
  commands,
  getSubcommand
};
