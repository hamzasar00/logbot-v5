package com.logbot.v5;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class BotStateStore {
    public static final class State {
        public Map<String, GuildState> guilds = new HashMap<>();
    }

    public static final class GuildState {
        public String autoRoleId;
        public String roleMenuChannelId;
        public String roleMenuMessageId;
        public List<RoleEntry> roleMenuEntries = new ArrayList<>();
        public String leaderboardChannelId;
        public String leaderboardMessageId;
        public String roomMenuChannelId;
        public String roomMenuMessageId;
        public String roomCategoryId;
        public Map<String, MemberStats> stats = new HashMap<>();
        public Map<String, List<Warning>> warnings = new HashMap<>();
    }

    public static final class RoleEntry {
        public String roleId;
        public String label;
        public String category;
        public String emoji;

        public RoleEntry() {}

        public RoleEntry(String roleId, String label, String category, String emoji) {
            this.roleId = roleId;
            this.label = label;
            this.category = category;
            this.emoji = emoji;
        }
    }

    public static final class MemberStats {
        public int messages;
        public int xp;
        public int level;
        public long voiceSeconds;
    }

    public static final class Warning {
        public String id;
        public String userId;
        public String moderatorId;
        public String reason;
        public String createdAt;

        public Warning() {}

        public Warning(String userId, String moderatorId, String reason) {
            this.id = Long.toString(System.currentTimeMillis());
            this.userId = userId;
            this.moderatorId = moderatorId;
            this.reason = reason;
            this.createdAt = Instant.now().toString();
        }
    }

    private final Path path;
    private final ObjectMapper mapper = new ObjectMapper()
            .enable(SerializationFeature.INDENT_OUTPUT);
    private State state = new State();

    public BotStateStore(Path path) {
        this.path = path;
    }

    public synchronized void load() {
        try {
            if (Files.exists(path)) {
                state = mapper.readValue(path.toFile(), State.class);
                if (state.guilds == null) state.guilds = new HashMap<>();
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Could not load bot state from " + path, exception);
        }
    }

    public synchronized GuildState guild(String guildId) {
        return state.guilds.computeIfAbsent(guildId, ignored -> new GuildState());
    }

    public synchronized MemberStats addMessage(String guildId, String userId) {
        MemberStats stats = stats(guildId, userId);
        stats.messages++;
        stats.xp += 15;
        stats.level = (int) Math.floor(Math.sqrt(stats.xp / 100.0));
        save();
        return stats;
    }

    public synchronized void addVoiceSeconds(String guildId, String userId, long seconds) {
        MemberStats stats = stats(guildId, userId);
        stats.voiceSeconds += Math.max(0, seconds);
        save();
    }

    public synchronized void addWarning(String guildId, String userId, String moderatorId, String reason) {
        guild(guildId).warnings.computeIfAbsent(userId, ignored -> new ArrayList<>())
                .add(new Warning(userId, moderatorId, reason));
        save();
    }

    public synchronized int clearWarnings(String guildId, String userId) {
        List<Warning> warnings = guild(guildId).warnings.remove(userId);
        save();
        return warnings == null ? 0 : warnings.size();
    }

    public synchronized List<Map.Entry<String, MemberStats>> topStats(String guildId, String type) {
        Comparator<Map.Entry<String, MemberStats>> comparator = Comparator.comparingLong(entry -> {
            MemberStats stats = entry.getValue();
            return switch (type) {
                case "messages" -> stats.messages;
                case "levels" -> stats.level;
                default -> stats.voiceSeconds / 60;
            };
        });
        return guild(guildId).stats.entrySet().stream()
                .sorted(comparator.reversed())
                .limit(10)
                .toList();
    }

    public synchronized void save() {
        try {
            Files.createDirectories(path.getParent() == null ? Path.of(".") : path.getParent());
            mapper.writeValue(path.toFile(), state);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not save bot state to " + path, exception);
        }
    }

    private MemberStats stats(String guildId, String userId) {
        return guild(guildId).stats.computeIfAbsent(userId, ignored -> new MemberStats());
    }
}