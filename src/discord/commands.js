import {
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
const commands = [
  new SlashCommandBuilder().setName("setup").setDescription("Leaderboard ve ge\xE7ici ses odas\u0131 altyap\u0131s\u0131n\u0131 haz\u0131rlar.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()),
  new SlashCommandBuilder().setName("autorole").setDescription("Yeni \xFCyeler i\xE7in otomatik rol ayar\u0131n\u0131 y\xF6netir.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()).addSubcommand(
    (subcommand) => subcommand.setName("set").setDescription("Otomatik verilecek rol\xFC ayarlar.").addRoleOption(
      (option) => option.setName("role").setDescription("Yeni \xFCye rol\xFC").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("disable").setDescription("Otomatik rol\xFC kapat\u0131r.")
  ).addSubcommand(
    (subcommand) => subcommand.setName("status").setDescription("Otomatik rol ayar\u0131n\u0131 g\xF6sterir.")
  ),
  new SlashCommandBuilder().setName("roles").setDescription("V4 rol alma men\xFCs\xFCn\xFC y\xF6netir.").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles.toString()).addSubcommand(
    (subcommand) => subcommand.setName("add").setDescription("Bir rol\xFC V4 se\xE7im men\xFCs\xFCne ekler.").addRoleOption(
      (option) => option.setName("role").setDescription("Men\xFCde g\xF6r\xFCnecek rol").setRequired(true)
    ).addStringOption(
      (option) => option.setName("category").setDescription("V4 rol kategorisi").setRequired(true).addChoices(
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
    (subcommand) => subcommand.setName("remove").setDescription("Rol\xFC men\xFCden \xE7\u0131kar\u0131r; sunucudan silmez.").addRoleOption(
      (option) => option.setName("role").setDescription("Men\xFCden \xE7\u0131kar\u0131lacak rol").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("menu").setDescription("Ba\u011F\u0131ms\u0131z rol-menusu kanal\u0131n\u0131 olu\u015Fturur veya yeniler.")
  ),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Sunucu s\u0131ralama men\xFCs\xFCn\xFC y\xF6netir.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()).addSubcommand(
    (subcommand) => subcommand.setName("setup").setDescription("Leaderboard men\xFCs\xFCn\xFC g\xF6nderir.")
  ).addSubcommand(
    (subcommand) => subcommand.setName("show").setDescription("Leaderboard men\xFCs\xFCn\xFC g\xF6sterir.")
  ),
  new SlashCommandBuilder().setName("voice").setDescription("Ses odas\u0131 i\u015Flemlerini y\xF6netir.").addSubcommand(
    (subcommand) => subcommand.setName("setup").setDescription("Ge\xE7ici ses odas\u0131 sistemini haz\u0131rlar.")
  ).addSubcommand(
    (subcommand) => subcommand.setName("join").setDescription("Bulundu\u011Fun ses odas\u0131na botu sokar.")
  ).addSubcommand(
    (subcommand) => subcommand.setName("leave").setDescription("Botu ses odas\u0131ndan \xE7\u0131kar\u0131r.")
  ),
  new SlashCommandBuilder().setName("mod").setDescription("Moderasyon komutlar\u0131.").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers.toString()).addSubcommand(
    (subcommand) => subcommand.setName("warn").setDescription("Kullan\u0131c\u0131ya uyar\u0131 verir.").addUserOption(
      (option) => option.setName("user").setDescription("Uyar\u0131lacak kullan\u0131c\u0131").setRequired(true)
    ).addStringOption(
      (option) => option.setName("reason").setDescription("Uyar\u0131 nedeni").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("warnings").setDescription("Kullan\u0131c\u0131n\u0131n uyar\u0131lar\u0131n\u0131 g\xF6sterir.").addUserOption(
      (option) => option.setName("user").setDescription("Uyar\u0131lar\u0131 g\xF6sterilecek kullan\u0131c\u0131").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("clear-warnings").setDescription("Kullan\u0131c\u0131n\u0131n t\xFCm uyar\u0131lar\u0131n\u0131 siler.").addUserOption(
      (option) => option.setName("user").setDescription("Uyar\u0131lar\u0131 silinecek kullan\u0131c\u0131").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("timeout").setDescription("Kullan\u0131c\u0131y\u0131 s\xFCreli susturur.").addUserOption(
      (option) => option.setName("user").setDescription("Susturulacak kullan\u0131c\u0131").setRequired(true)
    ).addIntegerOption(
      (option) => option.setName("minutes").setDescription("Dakika").setRequired(true).setMinValue(1).setMaxValue(40320)
    ).addStringOption(
      (option) => option.setName("reason").setDescription("Susturma nedeni").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("kick").setDescription("Kullan\u0131c\u0131y\u0131 sunucudan atar.").addUserOption(
      (option) => option.setName("user").setDescription("At\u0131lacak kullan\u0131c\u0131").setRequired(true)
    ).addStringOption(
      (option) => option.setName("reason").setDescription("At\u0131lma nedeni").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("ban").setDescription("Kullan\u0131c\u0131y\u0131 sunucudan yasaklar.").addUserOption(
      (option) => option.setName("user").setDescription("Yasaklanacak kullan\u0131c\u0131").setRequired(true)
    ).addStringOption(
      (option) => option.setName("reason").setDescription("Yasaklama nedeni").setRequired(true)
    )
  ).addSubcommand(
    (subcommand) => subcommand.setName("purge").setDescription("Kanaldan mesajlar\u0131 toplu siler.").addIntegerOption(
      (option) => option.setName("amount").setDescription("Silinecek mesaj say\u0131s\u0131").setRequired(true).setMinValue(1).setMaxValue(100)
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
