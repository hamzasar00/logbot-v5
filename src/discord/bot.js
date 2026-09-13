import {
  ActionRowBuilder,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  StringSelectMenuBuilder
} from "discord.js";
import {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
  getVoiceConnection
} from "@discordjs/voice";
import { logger } from "../lib/logger.js";
import { commands, getSubcommand } from "./commands.js";
import { getBotStatus } from "./logging.js";
import { StateStore } from "./state.js";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration
  ]
});
const store = new StateStore();
const voiceStartedAt = /* @__PURE__ */ new Map();
let startPromise;
function isModerator(interaction) {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) || interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
  );
}
function isGuildInteraction(interaction) {
  return interaction.isChatInputCommand() && Boolean(interaction.guild);
}
async function reply(interaction, content) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, ephemeral: true });
  } else {
    await interaction.reply({ content, ephemeral: true });
  }
}
async function ensureTextChannel(guild, name) {
  const existing = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildText && channel.name === name && !channel.parentId
  );
  if (existing?.isTextBased()) return existing;
  return guild.channels.create({
    name,
    type: ChannelType.GuildText
  });
}
async function ensureSetup(guild) {
  const guildState = store.getGuild(guild.id);
  const leaderboardChannel = await ensureTextChannel(guild, "leaderboard");
  guildState.leaderboardChannelId = leaderboardChannel.id;
  const roleMenuChannel = await ensureTextChannel(guild, "rol-menusu");
  guildState.roleMenuChannelId = roleMenuChannel.id;
  let voiceCategory = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name === "GE\xC7\u0130C\u0130 SES ODALARI"
  );
  if (!voiceCategory || voiceCategory.type !== ChannelType.GuildCategory) {
    voiceCategory = await guild.channels.create({
      name: "GE\xC7\u0130C\u0130 SES ODALARI",
      type: ChannelType.GuildCategory
    });
  }
  let voiceHub = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildVoice && channel.name === "Oda Olu\u015Ftur" && channel.parentId === voiceCategory.id
  );
  if (!voiceHub || voiceHub.type !== ChannelType.GuildVoice) {
    voiceHub = await guild.channels.create({
      name: "Oda Olu\u015Ftur",
      type: ChannelType.GuildVoice,
      parent: voiceCategory.id
    });
  }
  guildState.voiceHubId = voiceHub.id;
  guildState.tempVoiceCategoryId = voiceCategory.id;
  store.save();
  return guildState;
}
function leaderboardComponents() {
  const menu = new StringSelectMenuBuilder().setCustomId("logbot:leaderboard").setPlaceholder("S\u0131ralama t\xFCr\xFCn\xFC se\xE7").addOptions(
    { label: "Mesaj s\u0131ralamas\u0131", value: "messages", description: "En \xE7ok mesaj g\xF6nderenler" },
    { label: "Seviye s\u0131ralamas\u0131", value: "levels", description: "En y\xFCksek seviyedeki \xFCyeler" },
    { label: "Ses s\u0131ralamas\u0131", value: "voice", description: "En uzun s\xFCre ses odas\u0131nda kalanlar" }
  );
  return [new ActionRowBuilder().addComponents(menu)];
}
function roleMenuComponents(state) {
  const menu = new StringSelectMenuBuilder().setCustomId("logbot:role-menu").setPlaceholder("V4 rol men\xFCs\xFCnden rol\xFCn\xFC se\xE7").addOptions(
    state.roleMenuEntries.slice(0, 25).map((entry) => ({
      label: entry.label.slice(0, 100),
      value: entry.roleId,
      description: `${entry.category} kategorisi`,
      ...entry.emoji ? { emoji: entry.emoji } : {}
    }))
  );
  return [new ActionRowBuilder().addComponents(menu)];
}
async function postRoleMenu(guild, state) {
  if (!state.roleMenuChannelId) throw new Error("Rol men\xFCs\xFC kanal\u0131 bulunamad\u0131.");
  const channel = await guild.channels.fetch(state.roleMenuChannelId);
  if (!channel?.isTextBased()) throw new Error("Rol men\xFCs\xFC kanal\u0131 kullan\u0131lam\u0131yor.");
  const message = await channel.send({
    embeds: [
      new EmbedBuilder().setColor(5763719).setTitle("\u{1F465} Rol Se\xE7im Men\xFCs\xFC").setDescription(
        state.roleMenuEntries.length > 0 ? "V4 rol men\xFCs\xFCnden bir rol se\xE7. Men\xFC rol verir; rol kald\u0131rma i\xE7in `/roles remove` kullan\u0131l\u0131r." : "Hen\xFCz men\xFCye rol eklenmedi. Y\xF6netici `/roles add` ile rol ekleyebilir."
      )
    ],
    components: state.roleMenuEntries.length > 0 ? roleMenuComponents(state) : []
  });
  state.roleMenuMessageId = message.id;
  store.save();
}
async function postLeaderboard(guild, state) {
  if (!state.leaderboardChannelId) throw new Error("Leaderboard kanal\u0131 bulunamad\u0131.");
  const channel = await guild.channels.fetch(state.leaderboardChannelId);
  if (!channel?.isTextBased()) throw new Error("Leaderboard kanal\u0131 kullan\u0131lam\u0131yor.");
  const message = await channel.send({
    embeds: [
      new EmbedBuilder().setColor(5793266).setTitle("Sunucu Leaderboard").setDescription("S\u0131ralama t\xFCr\xFCn\xFC se\xE7erek topluluk liderlerini g\xF6r.")
    ],
    components: leaderboardComponents()
  });
  state.leaderboardMessageId = message.id;
  store.save();
}
function sortedStats(state, type) {
  return Object.entries(state.stats).map(([userId, stats]) => [
    userId,
    type === "messages" ? stats.messages : type === "levels" ? stats.level : Math.floor(stats.voiceSeconds / 60)
  ]).sort((a, b) => b[1] - a[1]).slice(0, 10);
}
async function leaderboardResponse(interaction, type) {
  if (!interaction.guild) return;
  const state = store.getGuild(interaction.guild.id);
  const labels = { messages: "Mesaj", levels: "Seviye", voice: "Ses dakikas\u0131" };
  const lines = sortedStats(state, type);
  const description = lines.length === 0 ? "Hen\xFCz s\u0131ralama verisi olu\u015Fmad\u0131." : (await Promise.all(
    lines.map(async ([userId, value], index) => {
      const user = await client.users.fetch(userId).catch(() => null);
      return `${index + 1}. ${user?.username ?? "Bilinmeyen \xFCye"} \u2014 ${value} ${labels[type]}`;
    })
  )).join("\n");
  await interaction.reply({
    embeds: [
      new EmbedBuilder().setColor(5793266).setTitle(`Leaderboard \xB7 ${labels[type]}`).setDescription(description)
    ],
    ephemeral: true
  });
}
async function handleSetup(interaction) {
  await ensureSetup(interaction.guild);
  await reply(
    interaction,
    'Kurulum tamamland\u0131. V4 rol men\xFCs\xFC, leaderboard kanal\u0131 ve "Oda Olu\u015Ftur" ge\xE7ici ses sistemi haz\u0131r.'
  );
}
async function handleAutorole(interaction) {
  const state = store.getGuild(interaction.guild.id);
  const subcommand = getSubcommand(interaction);
  if (subcommand === "set") {
    const role = interaction.options.getRole("role", true);
    state.autoRoleId = role.id;
    store.save();
    await reply(interaction, `Otomatik rol ${role} olarak ayarland\u0131.`);
  } else if (subcommand === "disable") {
    delete state.autoRoleId;
    store.save();
    await reply(interaction, "Otomatik rol kapat\u0131ld\u0131.");
  } else {
    const role = state.autoRoleId ? `<@&${state.autoRoleId}>` : "ayarl\u0131 de\u011Fil";
    await reply(interaction, `Otomatik rol: ${role}`);
  }
}
async function handleRoles(interaction) {
  const guild = interaction.guild;
  const state = store.getGuild(guild.id);
  const subcommand = getSubcommand(interaction);
  if (subcommand === "add") {
    const role = interaction.options.getRole("role", true);
    const category = interaction.options.getString("category", true);
    const emoji = interaction.options.getString("emoji") ?? void 0;
    state.roleMenuEntries = state.roleMenuEntries.filter((entry) => entry.roleId !== role.id);
    state.roleMenuEntries.push({
      roleId: role.id,
      label: role.name,
      description: `${category} rol\xFC`,
      emoji,
      category
    });
    store.save();
    if (!state.roleMenuChannelId) await ensureSetup(guild);
    await postRoleMenu(guild, state);
    await reply(interaction, `${role} V4 rol men\xFCs\xFCne eklendi.`);
  } else if (subcommand === "remove") {
    const role = interaction.options.getRole("role", true);
    state.roleMenuEntries = state.roleMenuEntries.filter((entry) => entry.roleId !== role.id);
    store.save();
    if (!state.roleMenuChannelId) await ensureSetup(guild);
    await postRoleMenu(guild, state);
    await reply(interaction, `${role} men\xFCden \xE7\u0131kar\u0131ld\u0131; sunucudan silinmedi.`);
  } else {
    if (!state.roleMenuChannelId) await ensureSetup(guild);
    await postRoleMenu(guild, state);
    await reply(interaction, "Ba\u011F\u0131ms\u0131z rol-menusu kanal\u0131 haz\u0131rland\u0131.");
  }
}
async function handleLeaderboard(interaction) {
  const state = store.getGuild(interaction.guild.id);
  if (getSubcommand(interaction) === "setup") {
    await postLeaderboard(interaction.guild, state);
    await reply(interaction, "Leaderboard men\xFCs\xFC haz\u0131rland\u0131.");
    return;
  }
  const lines = sortedStats(state, "levels");
  await reply(interaction, lines.length === 0 ? "Hen\xFCz leaderboard verisi yok." : lines.map(([id, value], i) => `${i + 1}. <@${id}> \u2014 seviye ${value}`).join("\n"));
}
async function handleVoice(interaction) {
  const guild = interaction.guild;
  const subcommand = getSubcommand(interaction);
  if (subcommand === "setup") {
    await ensureSetup(guild);
    await reply(interaction, `Ge\xE7ici ses sistemi haz\u0131r. \xDCyeler <#${store.getGuild(guild.id).voiceHubId}> kanal\u0131na girince \xF6zel oda a\xE7\u0131l\u0131r.`);
    return;
  }
  const member = interaction.member;
  if (subcommand === "join") {
    const voiceChannel = member.voice.channel;
    if (!voiceChannel || !voiceChannel.isVoiceBased()) {
      await reply(interaction, "\xD6nce bir ses kanal\u0131na gir.");
      return;
    }
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false
    });
    await entersState(connection, VoiceConnectionStatus.Ready, 15e3);
    await reply(interaction, `Bot **${voiceChannel.name}** ses odas\u0131na girdi.`);
  } else {
    getVoiceConnection(guild.id)?.destroy();
    await reply(interaction, "Bot ses odas\u0131ndan \xE7\u0131kt\u0131.");
  }
}
async function handleModeration(interaction) {
  if (!isModerator(interaction)) {
    await reply(interaction, "Bu komut i\xE7in moderasyon yetkisi gerekiyor.");
    return;
  }
  const guild = interaction.guild;
  const subcommand = getSubcommand(interaction);
  const user = interaction.options.getUser("user");
  if (subcommand === "warn" && user) {
    const reason = interaction.options.getString("reason", true);
    store.addWarning(guild.id, user.id, interaction.user.id, reason);
    await reply(interaction, `${user} uyar\u0131ld\u0131: ${reason}`);
  } else if (subcommand === "warnings" && user) {
    const warnings = store.getGuild(guild.id).warnings[user.id] ?? [];
    await reply(interaction, warnings.length === 0 ? `${user} i\xE7in uyar\u0131 yok.` : warnings.map((warning, index) => `${index + 1}. ${warning.reason}`).join("\n"));
  } else if (subcommand === "clear-warnings" && user) {
    const count = store.clearWarnings(guild.id, user.id);
    await reply(interaction, `${user} i\xE7in ${count} uyar\u0131 silindi.`);
  } else if (subcommand === "timeout" && user) {
    const member = await guild.members.fetch(user.id);
    const minutes = interaction.options.getInteger("minutes", true);
    const reason = interaction.options.getString("reason", true);
    await member.timeout(minutes * 6e4, reason);
    await reply(interaction, `${user} ${minutes} dakika susturuldu.`);
  } else if (subcommand === "kick" && user) {
    const member = await guild.members.fetch(user.id);
    const reason = interaction.options.getString("reason", true);
    await member.kick(reason);
    await reply(interaction, `${user} sunucudan at\u0131ld\u0131.`);
  } else if (subcommand === "ban" && user) {
    const member = await guild.members.fetch(user.id);
    const reason = interaction.options.getString("reason", true);
    await member.ban({ reason });
    await reply(interaction, `${user} sunucudan yasakland\u0131.`);
  } else if (subcommand === "purge") {
    const amount = interaction.options.getInteger("amount", true);
    if (!interaction.channel || !interaction.channel.isTextBased()) {
      await reply(interaction, "Bu komut sadece yaz\u0131 kanal\u0131nda kullan\u0131labilir.");
      return;
    }
    const deleted = await interaction.channel.bulkDelete(amount, true);
    await reply(interaction, `${deleted.size} mesaj silindi.`);
  }
}
async function handleCommand(interaction) {
  try {
    if (interaction.commandName === "setup") await handleSetup(interaction);
    else if (interaction.commandName === "autorole") await handleAutorole(interaction);
    else if (interaction.commandName === "roles") await handleRoles(interaction);
    else if (interaction.commandName === "leaderboard") await handleLeaderboard(interaction);
    else if (interaction.commandName === "voice") await handleVoice(interaction);
    else if (interaction.commandName === "mod") await handleModeration(interaction);
  } catch (error) {
    logger.error({ err: error, command: interaction.commandName }, "Discord command failed");
    await reply(interaction, "Komut \xE7al\u0131\u015Ft\u0131r\u0131l\u0131rken bir hata olu\u015Ftu.");
  }
}
async function handleComponent(interaction) {
  if (interaction.customId === "logbot:role-menu") {
    const role = interaction.guild?.roles.cache.get(interaction.values[0]);
    const member = interaction.member;
    if (!role) {
      await interaction.reply({ content: "Bu rol art\u0131k mevcut de\u011Fil.", ephemeral: true });
      return;
    }
    await member.roles.add(role);
    await interaction.reply({ content: `${role.name} rol\xFC verildi.`, ephemeral: true });
  } else if (interaction.customId === "logbot:leaderboard") {
    await leaderboardResponse(interaction, interaction.values[0]);
  }
}
async function createTempVoice(member) {
  const state = store.getGuild(member.guild.id);
  if (!state.voiceHubId || member.voice.channelId !== state.voiceHubId || !state.tempVoiceCategoryId) return;
  const channel = await member.guild.channels.create({
    name: `${member.displayName}'in odas\u0131`,
    type: ChannelType.GuildVoice,
    parent: state.tempVoiceCategoryId,
    permissionOverwrites: [{ id: member.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] }]
  });
  await member.voice.setChannel(channel);
}
function trackVoiceChange(oldState, newState) {
  const member = newState.member ?? oldState.member;
  if (!member || member.user.bot) return;
  const key = `${member.guild.id}:${member.id}`;
  if (!oldState.channelId && newState.channelId) voiceStartedAt.set(key, Date.now());
  if (oldState.channelId && !newState.channelId) {
    const startedAt = voiceStartedAt.get(key);
    if (startedAt) store.addVoiceSeconds(member.guild.id, member.id, (Date.now() - startedAt) / 1e3);
    voiceStartedAt.delete(key);
  }
}
client.once("ready", async () => {
  logger.info({ user: client.user?.tag, guilds: client.guilds.cache.size }, "Discord bot connected");
  await Promise.all(
    [...client.guilds.cache.values()].map(
      (guild) => guild.commands.set(commands)
    )
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
  if (oldState.channelId && oldState.channel?.name !== "Oda Olu\u015Ftur" && oldState.channel?.members.size === 0 && oldState.channel.parentId === store.getGuild(oldState.guild.id).tempVoiceCategoryId) {
    await oldState.channel.delete("Ge\xE7ici oda bo\u015F kald\u0131").catch(() => void 0);
  }
});
async function startDiscordBot() {
  if (startPromise) return startPromise;
  startPromise = (async () => {
    await store.load();
    const token = process.env["DISCORD_TOKEN"];
    if (!token) {
      logger.warn("DISCORD_TOKEN yok; Discord botu beklemede. S\u0131rr\u0131 ekleyince servisi yeniden ba\u015Flat.");
      return;
    }
    await client.login(token);
  })();
  return startPromise;
}
function discordBotStatus() {
  return getBotStatus(client);
}
export {
  discordBotStatus,
  startDiscordBot
};
