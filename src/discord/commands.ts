import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Leaderboard ve geçici ses odası altyapısını hazırlar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString()),

  new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Yeni üyeler için otomatik rol ayarını yönetir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Otomatik verilecek rolü ayarlar.")
        .addRoleOption((option) =>
          option.setName("role").setDescription("Yeni üye rolü").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("disable").setDescription("Otomatik rolü kapatır."),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("status").setDescription("Otomatik rol ayarını gösterir."),
    ),

  new SlashCommandBuilder()
    .setName("roles")
    .setDescription("V4 rol alma menüsünü yönetir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles.toString())
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Bir rolü V4 seçim menüsüne ekler.")
        .addRoleOption((option) =>
          option.setName("role").setDescription("Menüde görünecek rol").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("V4 rol kategorisi")
            .setRequired(true)
            .addChoices(
              { name: "Etkinlik", value: "event" },
              { name: "Renk", value: "color" },
              { name: "Burç", value: "zodiac" },
              { name: "Oyun", value: "game" },
              { name: "Takım", value: "team" },
              { name: "Diğer", value: "other" },
            ),
        )
        .addStringOption((option) =>
          option.setName("emoji").setDescription("İsteğe bağlı emoji").setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Rolü menüden çıkarır; sunucudan silmez.")
        .addRoleOption((option) =>
          option.setName("role").setDescription("Menüden çıkarılacak rol").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("menu").setDescription("Bağımsız rol-menusu kanalını oluşturur veya yeniler."),
    ),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Sunucu sıralama menüsünü yönetir.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
    .addSubcommand((subcommand) =>
      subcommand.setName("setup").setDescription("Leaderboard menüsünü gönderir."),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("show").setDescription("Leaderboard menüsünü gösterir."),
    ),

  new SlashCommandBuilder()
    .setName("voice")
    .setDescription("Ses odası işlemlerini yönetir.")
    .addSubcommand((subcommand) =>
      subcommand.setName("setup").setDescription("Geçici ses odası sistemini hazırlar."),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("join").setDescription("Bulunduğun ses odasına botu sokar."),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("leave").setDescription("Botu ses odasından çıkarır."),
    ),

  new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Moderasyon komutları.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers.toString())
    .addSubcommand((subcommand) =>
      subcommand
        .setName("warn")
        .setDescription("Kullanıcıya uyarı verir.")
        .addUserOption((option) =>
          option.setName("user").setDescription("Uyarılacak kullanıcı").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Uyarı nedeni").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("warnings")
        .setDescription("Kullanıcının uyarılarını gösterir.")
        .addUserOption((option) =>
          option.setName("user").setDescription("Uyarıları gösterilecek kullanıcı").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear-warnings")
        .setDescription("Kullanıcının tüm uyarılarını siler.")
        .addUserOption((option) =>
          option.setName("user").setDescription("Uyarıları silinecek kullanıcı").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("timeout")
        .setDescription("Kullanıcıyı süreli susturur.")
        .addUserOption((option) =>
          option.setName("user").setDescription("Susturulacak kullanıcı").setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("minutes")
            .setDescription("Dakika")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(40320),
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Susturma nedeni").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kick")
        .setDescription("Kullanıcıyı sunucudan atar.")
        .addUserOption((option) =>
          option.setName("user").setDescription("Atılacak kullanıcı").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Atılma nedeni").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ban")
        .setDescription("Kullanıcıyı sunucudan yasaklar.")
        .addUserOption((option) =>
          option.setName("user").setDescription("Yasaklanacak kullanıcı").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("Yasaklama nedeni").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("purge")
        .setDescription("Kanaldan mesajları toplu siler.")
        .addIntegerOption((option) =>
          option.setName("amount").setDescription("Silinecek mesaj sayısı").setRequired(true).setMinValue(1).setMaxValue(100),
        ),
    ),
].map((command) => command.toJSON()) satisfies RESTPostAPIChatInputApplicationCommandsJSONBody[];

export function getSubcommand(
  interaction: ChatInputCommandInteraction,
): string {
  return interaction.options.getSubcommand();
}