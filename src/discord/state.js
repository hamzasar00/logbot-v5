import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
function createGuildState() {
  return {
    logChannels: {},
    roleMenuEntries: [],
    stats: {},
    warnings: {}
  };
}
class StateStore {
  filePath;
  data = { guilds: {} };
  writeChain = Promise.resolve();
  constructor(dataDirectory = path.resolve(process.cwd(), "data")) {
    this.filePath = path.join(dataDirectory, "bot-state.json");
  }
  async load() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.data = { guilds: parsed.guilds ?? {} };
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      await this.persist();
    }
  }
  getGuild(guildId) {
    this.data.guilds[guildId] ??= createGuildState();
    return this.data.guilds[guildId];
  }
  save() {
    this.writeChain = this.writeChain.then(() => this.persist());
  }
  addMessage(guildId, userId) {
    const guild = this.getGuild(guildId);
    const current = guild.stats[userId] ?? {
      messages: 0,
      xp: 0,
      level: 0,
      voiceSeconds: 0
    };
    current.messages += 1;
    current.xp += 15;
    current.level = Math.floor(Math.sqrt(current.xp / 100));
    guild.stats[userId] = current;
    this.save();
    return current;
  }
  addVoiceSeconds(guildId, userId, seconds) {
    const guild = this.getGuild(guildId);
    const current = guild.stats[userId] ?? {
      messages: 0,
      xp: 0,
      level: 0,
      voiceSeconds: 0
    };
    current.voiceSeconds += Math.max(0, Math.floor(seconds));
    guild.stats[userId] = current;
    this.save();
  }
  addWarning(guildId, userId, moderatorId, reason) {
    const guild = this.getGuild(guildId);
    const warning = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      moderatorId,
      reason,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    guild.warnings[userId] ??= [];
    guild.warnings[userId].push(warning);
    this.save();
    return warning;
  }
  clearWarnings(guildId, userId) {
    const guild = this.getGuild(guildId);
    const count = guild.warnings[userId]?.length ?? 0;
    delete guild.warnings[userId];
    this.save();
    return count;
  }
  async persist() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
  }
}
export {
  StateStore
};
