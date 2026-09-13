import {
  EmbedBuilder,
  type Client,
  type Guild,
  type TextChannel,
} from "discord.js";
import { logger } from "../lib/logger";
import type { LogType, StateStore } from "./state";

const colors: Record<LogType, number> = {
  member: 0x4f8cff,
  message: 0x9b59b6,
  role: 0xf1c40f,
  channel: 0x1abc9c,
  voice: 0x2ecc71,
  moderation: 0xe74c3c,
  server: 0x95a5a6,
};

export async function sendLog(
  guild: Guild,
  store: StateStore,
  type: LogType,
  title: string,
  description: string,
): Promise<void> {
  const channelId = store.getGuild(guild.id).logChannels[type];
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(colors[type])
    .setTitle(title)
    .setDescription(description.slice(0, 4000))
    .setTimestamp();

  await (channel as TextChannel).send({ embeds: [embed] }).catch((error) => {
    logger.warn({ err: error, guildId: guild.id, type }, "Could not send Discord log");
  });
}

export function getBotStatus(client: Client): {
  configured: boolean;
  connected: boolean;
  user?: string;
  guilds: number;
} {
  return {
    configured: Boolean(process.env["DISCORD_TOKEN"]),
    connected: client.isReady(),
    user: client.user?.tag,
    guilds: client.guilds.cache.size,
  };
}