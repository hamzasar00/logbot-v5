import {
  EmbedBuilder
} from "discord.js";
import { logger } from "../lib/logger.js";
const colors = {
  member: 5213439,
  message: 10181046,
  role: 15844367,
  channel: 1752220,
  voice: 3066993,
  moderation: 15158332,
  server: 9807270
};
async function sendLog(guild, store, type, title, description) {
  const channelId = store.getGuild(guild.id).logChannels[type];
  if (!channelId) return;
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return;
  const embed = new EmbedBuilder().setColor(colors[type]).setTitle(title).setDescription(description.slice(0, 4e3)).setTimestamp();
  await channel.send({ embeds: [embed] }).catch((error) => {
    logger.warn({ err: error, guildId: guild.id, type }, "Could not send Discord log");
  });
}
function getBotStatus(client) {
  return {
    configured: Boolean(process.env["DISCORD_TOKEN"]),
    connected: client.isReady(),
    user: client.user?.tag,
    guilds: client.guilds.cache.size
  };
}
export {
  getBotStatus,
  sendLog
};
