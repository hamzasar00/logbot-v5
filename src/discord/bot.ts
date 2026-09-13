import {
  ActionRowBuilder,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  GuildMember,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextChannel,
  User,
  VoiceChannel,
  type ChatInputCommandInteraction,
  type Interaction,
  type Role,
} from "discord.js";
import {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
  getVoiceConnection,
} from "@discordjs/voice";
import { logger } from "../lib/logger";
import { commands, getSubcommand } from "./commands";
import { getBotStatus } from "./logging";
import { StateStore, type GuildState } from "./state";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
  ],
});

const store = new StateStore();
const voiceStartedAt = new Map<string, number>();
let startPromise: Promise<void> | undefined;

function isModerator(interaction: ChatInputCommandInteraction): boolean {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild),
  );
}

function isGuildInteraction(
  interaction: Interaction,
): interaction is ChatInputCommandInteraction {
  return interaction.isChatInputCommand() && Boolean(interaction.guild);
}

async function reply(
  interaction: ChatInputCommandInteraction,
  content: string,
): Promise<void> {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, ephemeral: true });
  } else {
    await interaction.reply({ content, ephemeral: true });
  }
}

async function ensureTextChannel(
  guild: NonNullable<ChatInputCommandInteraction["guild"]>,
  name: string,
): Promise<TextChannel> {
  const existing = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      channel.name === name &&
      !channel.parentId,
  );
  if (existing?.isTextBased()) return existing as TextChannel;
  return guild.channels.create({
    name,
    type: ChannelType.GuildText,
  });
}

async function ensureSetup(
  guild: NonNullable<ChatInputCommandInteraction["guild"]>,
): Promise<GuildState> {
  const guildState = store.getGuild(guild.id);
  const leaderboardChannel = await ensureTextChannel(guild, "leaderboard");
  guildState.leaderboardChannelId = leaderboardChannel.id;
  const roleMenuChannel = await ensureTextChannel(guild, "rol-menusu");
  guildState.roleMenuChannelId = roleMenuChannel.id;

  let voiceCategory = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === "GEÇİCİ SES ODALARI",
  );
  if (!voiceCategory || voiceCategory.type !== ChannelType.GuildCategory) {
    voiceCategory = await guild.channels.create({
      name: "GEÇİCİ SES ODALARI",
      type: ChannelType.GuildCategory,
    });
  }
  let voiceHub = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildVoice &&
      channel.name === "Oda Oluştur" &&
      channel.parentId === voiceCategory.id,
  );
  if (!voiceHub || voiceHub.type !== ChannelType.GuildVoice) {
    voiceHub = await guild.channels.create({
      name: "Oda Oluştur",
      type: ChannelType.GuildVoice,
      parent: voiceCategory.id,
    });
  }
  guildState.voiceHubId = voiceHub.id;
  guildState.tempVoiceCategoryId = voiceCategory.id;
  store.save();
  return guildState;
}

function leaderboardComponents(): ActionRowBuilder<StringSelectMenuBuilder>[] {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("logbot:leaderboard")
    .setPlaceholder("Sıralama türünü seç")
    .addOptions(
      { label: "Mesaj sıralaması", value: "messages", description: "En çok mesaj gönderenler" },
      { label: "Seviye sıralaması", value: "levels", description: "En yüksek seviyedeki üyeler" },
      { label: "Ses sıralaması", value: "voice", description: "En uzun süre ses odasında kalanlar" },
    );
  return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)];
}

function roleMenuComponents(state: GuildState): ActionRowBuilder<StringSelectMenuBuilder>[] {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("logbot:role-menu")
    .setPlaceholder("V4 rol menüsünden rolünü seç")
    .addOptions(
      state.roleMenuEntries.slice(0, 25).map((entry) => ({
        label: entry.label.slice(0, 100),
        value: entry.roleId,
        description: `${entry.category} kategorisi`,
        ...(entry.emoji ? { emoji: entry.emoji } : {}),
      })),
    );
  return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)];
}

async function postRoleMenu(
  guild: NonNullable<ChatInputCommandInteraction["guild"]>,
  state: GuildState,
): Promise<void> {
  if (!state.roleMenuChannelId) throw new Error("Rol menüsü kanalı bulunamadı.");
  const channel = await guild.channels.fetch(state.roleMenuChannelId);
  if (!channel?.isTextBased()) throw new Error("Rol menüsü kanalı kullanılamıyor.");
  const message = await (channel as TextChannel).send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("👥 Rol Seçim Menüsü")
        .setDescription(
          state.roleMenuEntries.length > 0
            ? "V4 rol menüsünden bir rol seç. Menü rol verir; rol kaldırma için `/roles remove` kullanılır."
            : "Henüz menüye rol eklenmedi. Yönetici `/roles add` ile rol ekleyebilir.",
        ),
    ],
    components: state.roleMenuEntries.length > 0 ? roleMenuComponents(state) : [],
  });
  state.roleMenuMessageId = message.id;
  store.save();
}

async function postLeaderboard(
  guild: NonNullable<ChatInputCommandInteraction["guild"]>,
  state: GuildState,
): Promise<void> {
  if (!state.leaderboardChannelId) throw new Error("Leaderboard kanalı bulunamadı.");
  const channel = await guild.channels.fetch(state.leaderboardChannelId);
  if (!channel?.isTextBased()) throw new Error("Leaderboard kanalı kullanılamıyor.");
  const message = await (channel as TextChannel).send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Sunucu Leaderboard")
        .setDescription("Sıralama türünü seçerek topluluk liderlerini gör."),
    ],
    components: leaderboardComponents(),
  });
  state.leaderboardMessageId = message.id;
  store.save();
}

function sortedStats(
  state: GuildState,
  type: "messages" | "levels" | "voice",
): Array<[string, number]> {
  return Object.entries(state.stats)
    .map(([userId, stats]) => [
      userId,
      type === "messages"
        ? stats.messages
        : type === "levels"
          ? stats.level
          : Math.floor(stats.voiceSeconds / 60),
    ] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

async function leaderboardResponse(
  interaction: StringSelectMenuInteraction,
  type: "messages" | "levels" | "voice",
): Promise<void> {
  if (!interaction.guild) return;
  const state = store.getGuild(interaction.guild.id);
  const labels = { messages: "Mesaj", levels: "Seviye", voice: "Ses dakikası" };
  const lines = sortedStats(state, type);
  const description =
    lines.length === 0
      ? "Henüz sıralama verisi oluşmadı."
      : (
          await Promise.all(
            lines.map(async ([userId, value], index) => {
              const user = await client.users.fetch(userId).catch(() => null);
              return `${index + 1}. ${user?.username ?? "Bilinmeyen üye"} — ${value} ${labels[type]}`;
            }),
          )
        ).join("\n");
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Leaderboard · ${labels[type]}`)
        .setDescription(description),
    ],
    ephemeral: true,
  });
}

async function handleSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  await ensureSetup(interaction.guild!);
  await reply(
    interaction,
    'Kurulum tamamlandı. V4 rol menüsü, leaderboard kanalı ve "Oda Oluştur" geçici ses sistemi hazır.',
  );
}

async function handleAutorole(interaction: ChatInputCommandInteraction): Promise<void> {
  const state = store.getGuild(interaction.guild!.id);
  const subcommand = getSubcommand(interaction);
  if (subcommand === "set") {
    const role = interaction.options.getRole("role", true);
    state.autoRoleId = role.id;
    store.save();
    await reply(interaction, `Otomatik rol ${role} olarak ayarlandı.`);
  } else if (subcommand === "disable") {
    delete state.autoRoleId;
    store.save();
    await reply(interaction, "Otomatik rol kapatıldı.");
  } else {
    const role = state.autoRoleId ? `<@&${state.autoRoleId}>` : "ayarlı değil";
    await reply(interaction, `Otomatik rol: ${role}`);
  }
}

async function handleRoles(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;
  const state = store.getGuild(guild.id);
  const subcommand = getSubcommand(interaction);
  if (subcommand === "add") {
    const role = interaction.options.getRole("role", true);
    const category = interaction.options.getString("category", true);
    const emoji = interaction.options.getString("emoji") ?? undefined;
    state.roleMenuEntries = state.roleMenuEntries.filter((entry) => entry.roleId !== role.id);
    state.roleMenuEntries.push({
      roleId: role.id,
      label: role.name,
      description: `${category} rolü`,
      emoji,
      category,
    });
    store.save();
    if (!state.roleMenuChannelId) await ensureSetup(guild);
    await postRoleMenu(guild, state);
    await reply(interaction, `${role} V4 rol menüsüne eklendi.`);
  } else if (subcommand === "remove") {
    const role = interaction.options.getRole("role", true);
    state.roleMenuEntries = state.roleMenuEntries.filter((entry) => entry.roleId !== role.id);
    store.save();
    if (!state.roleMenuChannelId) await ensureSetup(guild);
    await postRoleMenu(guild, state);
    await reply(interaction, `${role} menüden çıkarıldı; sunucudan silinmedi.`);
  } else {
    if (!state.roleMenuChannelId) await ensureSetup(guild);
    await postRoleMenu(guild, state);
    await reply(interaction, "Bağımsız rol-menusu kanalı hazırlandı.");
  }
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
  const state = store.getGuild(interaction.guild!.id);
  if (getSubcommand(interaction) === "setup") {
    await postLeaderboard(interaction.guild!, state);
    await reply(interaction, "Leaderboard menüsü hazırlandı.");
    return;
  }
  const lines = sortedStats(state, "levels");
  await reply(interaction, lines.length === 0 ? "Henüz leaderboard verisi yok." : lines.map(([id, value], i) => `${i + 1}. <@${id}> — seviye ${value}`).join("\n"));
}

async function handleVoice(interaction: ChatInputCommandInteraction): Promise<void> {
  const guild = interaction.guild!;
  const subcommand = getSubcommand(interaction);
  if (subcommand === "setup") {
    await ensureSetup(guild);
    await reply(interaction, `Geçici ses sistemi hazır. Üyeler <#${store.getGuild(guild.id).voiceHubId}> kanalına girince özel oda açılır.`);
    return;
  }
  const member = interaction.member as GuildMember;
  if (subcommand === "join") {
    const voiceChannel = member.voice.channel;
    if (!voiceChannel || !voiceChannel.isVoiceBased()) {
      await reply(interaction, "Önce bir ses kanalına gir.");
      return;
    }
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
    });
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    await reply(interaction, `Bot **${voiceChannel.name}** ses odasına girdi.`);
  } else {
    getVoiceConnection(guild.id)?.destroy();
    await reply(interaction, "Bot ses odasından çıktı.");
  }
}

async function handleModeration(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isModerator(interaction)) {
    await reply(interaction, "Bu komut için moderasyon yetkisi gerekiyor.");
    return;
  }
  const guild = interaction.guild!;
  const subcommand = getSubcommand(interaction);
  const user = interaction.options.getUser("user") as User | null;
  if (subcommand === "warn" && user) {
    const reason = interaction.options.getString("reason", true);
    store.addWarning(guild.id, user.id, interaction.user.id, reason);
    await reply(interaction, `${user} uyarıldı: ${reason}`);
  } else if (subcommand === "warnings" && user) {
    const warnings = store.getGuild(guild.id).warnings[user.id] ?? [];
    await reply(interaction, warnings.length === 0 ? `${user} için uyarı yok.` : warnings.map((warning, index) => `${index + 1}. ${warning.reason}`).join("\n"));
  } else if (subcommand === "clear-warnings" && user) {
    const count = store.clearWarnings(guild.id, user.id);
    await reply(interaction, `${user} için ${count} uyarı silindi.`);
  } else if (subcommand === "timeout" && user) {
    const member = await guild.members.fetch(user.id);
    const minutes = interaction.options.getInteger("minutes", true);
    const reason = interaction.options.getString("reason", true);
    await member.timeout(minutes * 60_000, reason);
    await reply(interaction, `${user} ${minutes} dakika susturuldu.`);
  } else if (subcommand === "kick" && user) {
    const member = await guild.members.fetch(user.id);
    const reason = interaction.options.getString("reason", true);
    await member.kick(reason);
    await reply(interaction, `${user} sunucudan atıldı.`);
  } else if (subcommand === "ban" && user) {
    const member = await guild.members.fetch(user.id);
    const reason = interaction.options.getString("reason", true);
    await member.ban({ reason });
    await reply(interaction, `${user} sunucudan yasaklandı.`);
  } else if (subcommand === "purge") {
    const amount = interaction.options.getInteger("amount", true);
    if (!interaction.channel || !interaction.channel.isTextBased()) {
      await reply(interaction, "Bu komut sadece yazı kanalında kullanılabilir.");
      return;
    }
    const deleted = await (interaction.channel as TextChannel).bulkDelete(amount, true);
    await reply(interaction, `${deleted.size} mesaj silindi.`);
  }
}

async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    if (interaction.commandName === "setup") await handleSetup(interaction);
    else if (interaction.commandName === "autorole") await handleAutorole(interaction);
    else if (interaction.commandName === "roles") await handleRoles(interaction);
    else if (interaction.commandName === "leaderboard") await handleLeaderboard(interaction);
    else if (interaction.commandName === "voice") await handleVoice(interaction);
    else if (interaction.commandName === "mod") await handleModeration(interaction);
  } catch (error) {
    logger.error({ err: error, command: interaction.commandName }, "Discord command failed");
    await reply(interaction, "Komut çalıştırılırken bir hata oluştu.");
  }
}

async function handleComponent(interaction: StringSelectMenuInteraction): Promise<void> {
  if (interaction.customId === "logbot:role-menu") {
    const role = interaction.guild?.roles.cache.get(interaction.values[0]);
    const member = interaction.member as GuildMember;
    if (!role) {
      await interaction.reply({ content: "Bu rol artık mevcut değil.", ephemeral: true });
      return;
    }
    await member.roles.add(role);
    await interaction.reply({ content: `${role.name} rolü verildi.`, ephemeral: true });
  } else if (interaction.customId === "logbot:leaderboard") {
    await leaderboardResponse(interaction, interaction.values[0] as "messages" | "levels" | "voice");
  }
}

async function createTempVoice(member: GuildMember): Promise<void> {
  const state = store.getGuild(member.guild.id);
  if (!state.voiceHubId || member.voice.channelId !== state.voiceHubId || !state.tempVoiceCategoryId) return;
  const channel = await member.guild.channels.create({
    name: `${member.displayName}'in odası`,
    type: ChannelType.GuildVoice,
    parent: state.tempVoiceCategoryId,
    permissionOverwrites: [{ id: member.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] }],
  });
  await member.voice.setChannel(channel);
}

function trackVoiceChange(oldState: { channelId: string | null; member: GuildMember | null }, newState: { channelId: string | null; member: GuildMember | null }): void {
  const member = newState.member ?? oldState.member;
  if (!member || member.user.bot) return;
  const key = `${member.guild.id}:${member.id}`;
  if (!oldState.channelId && newState.channelId) voiceStartedAt.set(key, Date.now());
  if (oldState.channelId && !newState.channelId) {
    const startedAt = voiceStartedAt.get(key);
    if (startedAt) store.addVoiceSeconds(member.guild.id, member.id, (Date.now() - startedAt) / 1000);
    voiceStartedAt.delete(key);
  }
}

client.once("ready", async () => {
  logger.info({ user: client.user?.tag, guilds: client.guilds.cache.size }, "Discord bot connected");
  await Promise.all(
    [...client.guilds.cache.values()].map((guild) =>
      guild.commands.set(commands),
    ),
  );
});

client.on("interactionCreate", async (interaction) => {
  if (isGuildInteraction(interaction)) await handleCommand(interaction);
  else if (interaction.isStringSelectMenu()) await handleComponent(interaction);
});

client.on("guildMemberAdd", async (member) => {
  const autoRoleId = store.getGuild(member.guild.id).autoRoleId;
  if (autoRoleId) {
    const role = member.guild.roles.cache.get(autoRoleId);
    if (role) await member.roles.add(role).catch((error) => logger.warn({ err: error }, "Could not assign autorole"));
  }
});

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  store.addMessage(message.guild.id, message.author.id);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  trackVoiceChange(oldState, newState);
  if (newState.member) await createTempVoice(newState.member);
  if (oldState.channelId && oldState.channel?.name !== "Oda Oluştur" && oldState.channel?.members.size === 0 && oldState.channel.parentId === store.getGuild(oldState.guild.id).tempVoiceCategoryId) {
    await oldState.channel.delete("Geçici oda boş kaldı").catch(() => undefined);
  }
});

export async function startDiscordBot(): Promise<void> {
  if (startPromise) return startPromise;
  startPromise = (async () => {
    await store.load();
    const token = process.env["DISCORD_TOKEN"];
    if (!token) {
      logger.warn("DISCORD_TOKEN yok; Discord botu beklemede. Sırrı ekleyince servisi yeniden başlat.");
      return;
    }
    await client.login(token);
  })();
  return startPromise;
}

export function discordBotStatus(): ReturnType<typeof getBotStatus> {
  return getBotStatus(client);
}