import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type LogType =
  | "member"
  | "message"
  | "role"
  | "channel"
  | "voice"
  | "moderation"
  | "server";

export type Warning = {
  id: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: string;
};

export type RoleMenuEntry = {
  roleId: string;
  label: string;
  description: string;
  emoji?: string;
  category: string;
};

export type MemberStats = {
  messages: number;
  xp: number;
  level: number;
  voiceSeconds: number;
};

export type GuildState = {
  logChannels: Partial<Record<LogType, string>>;
  autoRoleId?: string;
  roleMenuChannelId?: string;
  roleMenuMessageId?: string;
  roleMenuEntries: RoleMenuEntry[];
  leaderboardChannelId?: string;
  leaderboardMessageId?: string;
  voiceHubId?: string;
  tempVoiceCategoryId?: string;
  stats: Record<string, MemberStats>;
  warnings: Record<string, Warning[]>;
};

type PersistedState = {
  guilds: Record<string, GuildState>;
};

function createGuildState(): GuildState {
  return {
    logChannels: {},
    roleMenuEntries: [],
    stats: {},
    warnings: {},
  };
}

export class StateStore {
  private readonly filePath: string;
  private data: PersistedState = { guilds: {} };
  private writeChain: Promise<void> = Promise.resolve();

  constructor(dataDirectory = path.resolve(process.cwd(), "data")) {
    this.filePath = path.join(dataDirectory, "bot-state.json");
  }

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      this.data = { guilds: parsed.guilds ?? {} };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
      await this.persist();
    }
  }

  getGuild(guildId: string): GuildState {
    this.data.guilds[guildId] ??= createGuildState();
    return this.data.guilds[guildId];
  }

  save(): void {
    this.writeChain = this.writeChain.then(() => this.persist());
  }

  addMessage(guildId: string, userId: string): MemberStats {
    const guild = this.getGuild(guildId);
    const current = guild.stats[userId] ?? {
      messages: 0,
      xp: 0,
      level: 0,
      voiceSeconds: 0,
    };
    current.messages += 1;
    current.xp += 15;
    current.level = Math.floor(Math.sqrt(current.xp / 100));
    guild.stats[userId] = current;
    this.save();
    return current;
  }

  addVoiceSeconds(guildId: string, userId: string, seconds: number): void {
    const guild = this.getGuild(guildId);
    const current = guild.stats[userId] ?? {
      messages: 0,
      xp: 0,
      level: 0,
      voiceSeconds: 0,
    };
    current.voiceSeconds += Math.max(0, Math.floor(seconds));
    guild.stats[userId] = current;
    this.save();
  }

  addWarning(
    guildId: string,
    userId: string,
    moderatorId: string,
    reason: string,
  ): Warning {
    const guild = this.getGuild(guildId);
    const warning: Warning = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      moderatorId,
      reason,
      createdAt: new Date().toISOString(),
    };
    guild.warnings[userId] ??= [];
    guild.warnings[userId].push(warning);
    this.save();
    return warning;
  }

  clearWarnings(guildId: string, userId: string): number {
    const guild = this.getGuild(guildId);
    const count = guild.warnings[userId]?.length ?? 0;
    delete guild.warnings[userId];
    this.save();
    return count;
  }

  private async persist(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.data, null, 2), "utf8");
  }
}