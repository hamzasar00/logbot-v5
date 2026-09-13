package com.logbot.v5;

import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.Role;
import net.dv8tion.jda.api.entities.channel.concrete.Category;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import net.dv8tion.jda.api.entities.channel.concrete.VoiceChannel;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.ButtonInteractionEvent;
import net.dv8tion.jda.api.events.interaction.component.StringSelectInteractionEvent;
import net.dv8tion.jda.api.events.guild.member.GuildMemberJoinEvent;
import net.dv8tion.jda.api.events.guild.voice.GuildVoiceUpdateEvent;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.interactions.commands.DefaultMemberPermissions;
import net.dv8tion.jda.api.interactions.commands.OptionType;
import net.dv8tion.jda.api.interactions.commands.build.CommandData;
import net.dv8tion.jda.api.interactions.commands.build.Commands;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;
import net.dv8tion.jda.api.interactions.commands.build.SubcommandData;
import net.dv8tion.jda.api.interactions.components.buttons.Button;
import net.dv8tion.jda.api.interactions.components.selections.StringSelectMenu;
import net.dv8tion.jda.api.requests.restaction.CommandListUpdateAction;
import net.dv8tion.jda.api.utils.messages.MessageCreateBuilder;
import net.dv8tion.jda.api.utils.messages.MessageEditData;
import net.dv8tion.jda.api.utils.messages.MessageCreateData;

import java.time.Duration;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public final class LogbotListener extends ListenerAdapter {
    private static final String ROLE_MENU_CHANNEL = "rol-menusu";
    private static final String ROOM_MENU_CHANNEL = "oda-menusu";
    private static final String LEADERBOARD_CHANNEL = "leaderboard";
    private static final String ROOM_CATEGORY = "ÖZEL ODALAR";
    private static final String ROOM_BUTTON = "room:create";
    private static final String ROLE_MENU = "role-select";
    private static final String LEADERBOARD_MENU = "leaderboard-select";

    private final BotStateStore store;
    private final Map<String, String> roomOwners = new ConcurrentHashMap<>();
    private final Map<String, Long> voiceStartedAt = new ConcurrentHashMap<>();

    public LogbotListener(BotStateStore store) {
        this.store = store;
    }

    @Override
    public void onReady(net.dv8tion.jda.api.events.session.ReadyEvent event) {
        for (Guild guild : event.getJDA().getGuilds()) {
            registerCommands(guild);
        }
        System.out.println("Registered guild slash commands for " + event.getGuildTotalCount() + " guild(s).");
    }

    @Override
    public void onGuildMemberJoin(GuildMemberJoinEvent event) {
        String roleId = store.guild(event.getGuild().getId()).autoRoleId;
        if (roleId == null) return;
        Role role = event.getGuild().getRoleById(roleId);
        if (role != null) event.getGuild().addRoleToMember(event.getMember(), role).queue();
    }

    @Override
    public void onMessageReceived(MessageReceivedEvent event) {
        if (!event.isFromGuild() || event.getAuthor().isBot()) return;
        store.addMessage(event.getGuild().getId(), event.getAuthor().getId());
    }

    @Override
    public void onGuildVoiceUpdate(GuildVoiceUpdateEvent event) {
        Member member = event.getMember();
        if (member.getUser().isBot()) return;

        String key = event.getGuild().getId() + ":" + member.getId();
        if (event.getChannelJoined() != null && event.getChannelLeft() == null) {
            voiceStartedAt.put(key, System.currentTimeMillis());
        }
        if (event.getChannelLeft() != null && event.getChannelJoined() == null) {
            Long started = voiceStartedAt.remove(key);
            if (started != null) {
                store.addVoiceSeconds(event.getGuild().getId(), member.getId(),
                        Math.max(1, (System.currentTimeMillis() - started) / 1000));
            }
            String owner = roomOwners.get(event.getChannelLeft().getId());
            if (owner != null && event.getChannelLeft().getMembers().isEmpty()) {
                roomOwners.remove(event.getChannelLeft().getId());
                event.getChannelLeft().delete().queue();
            }
        }
        if (event.getChannelJoined() != null) {
            String owner = roomOwners.get(event.getChannelJoined().getId());
            if (owner != null && event.getChannelJoined().getMembers().isEmpty()) {
                roomOwners.remove(event.getChannelJoined().getId());
                event.getChannelJoined().delete().queue();
            }
        }
    }

    @Override
    public void onSlashCommandInteraction(SlashCommandInteractionEvent event) {
        if (!event.isFromGuild()) {
            event.reply("Bu komut sadece sunucuda kullanılabilir.").setEphemeral(true).queue();
            return;
        }
        try {
            switch (event.getName()) {
                case "setup" -> setup(event);
                case "autorole" -> autorole(event);
                case "roles" -> roles(event);
                case "leaderboard" -> leaderboard(event);
                case "voice" -> voice(event);
                case "mod" -> moderation(event);
                default -> event.reply("Bilinmeyen komut.").setEphemeral(true).queue();
            }
        } catch (Exception exception) {
            exception.printStackTrace();
            if (!event.isAcknowledged()) {
                event.reply("Komut çalıştırılırken hata oluştu.").setEphemeral(true).queue();
            }
        }
    }

    @Override
    public void onStringSelectInteraction(StringSelectInteractionEvent event) {
        if (ROLE_MENU.equals(event.getComponentId())) {
            Role role = event.getGuild().getRoleById(event.getValues().get(0));
            if (role == null) {
                event.reply("Bu rol artık mevcut değil.").setEphemeral(true).queue();
                return;
            }
            event.getGuild().addRoleToMember(event.getMember(), role).queue(
                    ignored -> event.reply(role.getName() + " rolü verildi.").setEphemeral(true).queue(),
                    error -> event.reply("Rol verilemedi. Bot rolünün hedef rolden yukarıda olduğundan emin ol.")
                            .setEphemeral(true).queue()
            );
        } else if (LEADERBOARD_MENU.equals(event.getComponentId())) {
            sendLeaderboard(event, event.getValues().get(0));
        }
    }

    @Override
    public void onButtonInteraction(ButtonInteractionEvent event) {
        if (!ROOM_BUTTON.equals(event.getComponentId())) return;
        createPrivateRoom(event);
    }

    private void registerCommands(Guild guild) {
        guild.updateCommands().addCommands(commandData()).queue();
    }

    private List<CommandData> commandData() {
        List<CommandData> commands = new ArrayList<>();
        commands.add(Commands.slash("setup", "Leaderboard, V4 rol menüsü ve özel ses odası altyapısını hazırlar.")
                .setDefaultPermissions(DefaultMemberPermissions.enabledFor(Permission.MANAGE_SERVER)));

        commands.add(Commands.slash("autorole", "Yeni üyeler için otomatik rol ayarını yönetir.")
                .setDefaultPermissions(DefaultMemberPermissions.enabledFor(Permission.MANAGE_SERVER))
                .addSubcommands(
                        new SubcommandData("set", "Otomatik rolü ayarla.")
                                .addOption(OptionType.ROLE, "role", "Yeni üyelere verilecek rol.", true),
                        new SubcommandData("disable", "Otomatik rolü kapat."),
                        new SubcommandData("status", "Otomatik rol durumunu göster.")
                ));

        OptionData category = new OptionData(OptionType.STRING, "category", "V4 rol kategorisi.", true)
                .addChoice("Etkinlik", "event")
                .addChoice("Renk", "color")
                .addChoice("Burç", "zodiac")
                .addChoice("Oyun", "game")
                .addChoice("Takım", "team")
                .addChoice("Diğer", "other");
        commands.add(Commands.slash("roles", "V4 rol menüsünü yönetir.")
                .setDefaultPermissions(DefaultMemberPermissions.enabledFor(Permission.MANAGE_ROLES))
                .addSubcommands(
                        new SubcommandData("add", "Rolü V4 seçim menüsüne ekle.")
                                .addOption(OptionType.ROLE, "role", "Menüye eklenecek rol.", true)
                                .addOptions(category)
                                .addOption(OptionType.STRING, "emoji", "İsteğe bağlı emoji.", false),
                        new SubcommandData("remove", "Rolü menüden çıkar; sunucudan silmez.")
                                .addOption(OptionType.ROLE, "role", "Menüden çıkarılacak rol.", true),
                        new SubcommandData("menu", "Bağımsız rol-menusu kanalını oluştur veya yenile.")
                ));

        commands.add(Commands.slash("leaderboard", "Mesaj, seviye ve ses sıralamasını yönetir.")
                .setDefaultPermissions(DefaultMemberPermissions.enabledFor(Permission.MANAGE_SERVER))
                .addSubcommands(
                        new SubcommandData("setup", "Leaderboard panelini oluştur."),
                        new SubcommandData("show", "Seviye sıralamasını göster.")
                ));

        commands.add(Commands.slash("voice", "V4 özel ses odası işlemlerini yönetir.")
                .addSubcommands(
                        new SubcommandData("setup", "oda-menusu ve özel oda kategorisini hazırla."),
                        new SubcommandData("join", "Botu bulunduğun ses kanalına sok."),
                        new SubcommandData("leave", "Botu ses kanalından çıkar.")
                ));

        commands.add(Commands.slash("mod", "Moderasyon komutları.")
                .setDefaultPermissions(DefaultMemberPermissions.enabledFor(Permission.MODERATE_MEMBERS))
                .addSubcommands(
                        userReason("warn", "Kullanıcıya uyarı ver."),
                        userOnly("warnings", "Kullanıcının uyarılarını göster."),
                        userOnly("clear-warnings", "Kullanıcının uyarılarını temizle."),
                        timeoutCommand(),
                        userReason("kick", "Kullanıcıyı sunucudan at."),
                        userReason("ban", "Kullanıcıyı sunucudan yasakla."),
                        new SubcommandData("purge", "Mesajları topluca sil.")
                                .addOption(OptionType.INTEGER, "amount", "Silinecek mesaj sayısı.", true)
                ));
        return commands;
    }

    private SubcommandData userReason(String name, String description) {
        return new SubcommandData(name, description)
                .addOption(OptionType.USER, "user", "Hedef kullanıcı.", true)
                .addOption(OptionType.STRING, "reason", "Sebep.", true);
    }

    private SubcommandData userOnly(String name, String description) {
        return new SubcommandData(name, description)
                .addOption(OptionType.USER, "user", "Hedef kullanıcı.", true);
    }

    private SubcommandData timeoutCommand() {
        return new SubcommandData("timeout", "Kullanıcıyı süreli sustur.")
                .addOption(OptionType.USER, "user", "Hedef kullanıcı.", true)
                .addOption(OptionType.INTEGER, "minutes", "Dakika.", true)
                .addOption(OptionType.STRING, "reason", "Sebep.", true);
    }

    private void setup(SlashCommandInteractionEvent event) {
        Guild guild = event.getGuild();
        BotStateStore.GuildState state = ensureInfrastructure(guild);
        ensureRoleMenu(guild, state);
        ensureRoomMenu(guild, state);
        ensureLeaderboard(guild, state);
        event.reply("Kurulum tamamlandı: V4 rol menüsü, leaderboard ve özel ses odaları hazır.")
                .setEphemeral(true).queue();
    }

    private void autorole(SlashCommandInteractionEvent event) {
        BotStateStore.GuildState state = store.guild(event.getGuild().getId());
        switch (event.getSubcommandName()) {
            case "set" -> {
                Role role = event.getOption("role").getAsRole();
                state.autoRoleId = role.getId();
                store.save();
                event.reply("Otomatik rol " + role.getAsMention() + " olarak ayarlandı.").setEphemeral(true).queue();
            }
            case "disable" -> {
                state.autoRoleId = null;
                store.save();
                event.reply("Otomatik rol kapatıldı.").setEphemeral(true).queue();
            }
            default -> event.reply(state.autoRoleId == null
                    ? "Otomatik rol ayarlı değil."
                    : "Otomatik rol: <@&" + state.autoRoleId + ">").setEphemeral(true).queue();
        }
    }

    private void roles(SlashCommandInteractionEvent event) {
        Guild guild = event.getGuild();
        BotStateStore.GuildState state = store.guild(guild.getId());
        switch (event.getSubcommandName()) {
            case "add" -> {
                Role role = event.getOption("role").getAsRole();
                String category = event.getOption("category").getAsString();
                String emoji = event.getOption("emoji") == null ? null : event.getOption("emoji").getAsString();
                state.roleMenuEntries.removeIf(entry -> role.getId().equals(entry.roleId));
                state.roleMenuEntries.add(new BotStateStore.RoleEntry(role.getId(), role.getName(), category, emoji));
                store.save();
                ensureRoleMenu(guild, state);
                event.reply(role.getAsMention() + " V4 rol menüsüne eklendi.").setEphemeral(true).queue();
            }
            case "remove" -> {
                Role role = event.getOption("role").getAsRole();
                state.roleMenuEntries.removeIf(entry -> role.getId().equals(entry.roleId));
                store.save();
                ensureRoleMenu(guild, state);
                event.reply(role.getAsMention() + " menüden çıkarıldı; sunucudan silinmedi.").setEphemeral(true).queue();
            }
            default -> {
                ensureRoleMenu(guild, state);
                event.reply("Bağımsız rol-menusu kanalı hazırlandı.").setEphemeral(true).queue();
            }
        }
    }

    private void leaderboard(SlashCommandInteractionEvent event) {
        BotStateStore.GuildState state = store.guild(event.getGuild().getId());
        if ("setup".equals(event.getSubcommandName())) {
            ensureLeaderboard(event.getGuild(), state);
            event.reply("Leaderboard paneli hazırlandı.").setEphemeral(true).queue();
        } else {
            sendLeaderboard(event, "levels");
        }
    }

    private void voice(SlashCommandInteractionEvent event) {
        if ("setup".equals(event.getSubcommandName())) {
            BotStateStore.GuildState state = ensureInfrastructure(event.getGuild());
            ensureRoomMenu(event.getGuild(), state);
            event.reply("V4 oda-menusu ve özel ses odası kategorisi hazırlandı.").setEphemeral(true).queue();
            return;
        }
        if ("join".equals(event.getSubcommandName())) {
            if (event.getMember().getVoiceState() == null || event.getMember().getVoiceState().getChannel() == null) {
                event.reply("Önce bir ses kanalına gir.").setEphemeral(true).queue();
                return;
            }
            event.getGuild().getAudioManager().openAudioConnection(event.getMember().getVoiceState().getChannel());
            event.reply("Bot ses kanalına katıldı.").setEphemeral(true).queue();
        } else {
            event.getGuild().getAudioManager().closeAudioConnection();
            event.reply("Bot ses kanalından ayrıldı.").setEphemeral(true).queue();
        }
    }

    private void moderation(SlashCommandInteractionEvent event) {
        Member moderator = event.getMember();
        if (moderator == null || (!moderator.hasPermission(Permission.MODERATE_MEMBERS)
                && !moderator.hasPermission(Permission.MANAGE_SERVER))) {
            event.reply("Bu komut için moderasyon yetkisi gerekiyor.").setEphemeral(true).queue();
            return;
        }
        String subcommand = event.getSubcommandName();
        if ("purge".equals(subcommand)) {
            int amount = Math.max(1, Math.min(100, event.getOption("amount").getAsInt()));
            if (!(event.getChannel() instanceof TextChannel channel)) {
                event.reply("Bu komut sadece yazı kanalında kullanılabilir.").setEphemeral(true).queue();
                return;
            }
            channel.getHistory().retrievePast(amount).queue(messages -> {
                channel.purgeMessages(messages);
                event.reply(messages.size() + " mesaj silindi.").setEphemeral(true).queue();
            });
            return;
        }

        String userId = event.getOption("user").getAsUser().getId();
        event.getGuild().retrieveMemberById(userId).queue(member -> {
            String reason = event.getOption("reason") == null ? "Logbot moderasyonu" : event.getOption("reason").getAsString();
            switch (subcommand) {
                case "warn" -> {
                    store.addWarning(event.getGuild().getId(), userId, moderator.getId(), reason);
                    event.reply(member.getAsMention() + " uyarıldı: " + reason).queue();
                }
                case "warnings" -> {
                    List<BotStateStore.Warning> warnings = store.guild(event.getGuild().getId())
                            .warnings.getOrDefault(userId, List.of());
                    String text = warnings.isEmpty() ? "Bu kullanıcı için uyarı yok."
                            : warnings.stream().map(warning -> "• " + warning.reason).reduce((a, b) -> a + "\n" + b).orElse("");
                    event.reply(text).setEphemeral(true).queue();
                }
                case "clear-warnings" -> {
                    int count = store.clearWarnings(event.getGuild().getId(), userId);
                    event.reply(count + " uyarı temizlendi.").setEphemeral(true).queue();
                }
                case "timeout" -> {
                    int minutes = event.getOption("minutes").getAsInt();
                    member.timeoutFor(Duration.ofMinutes(minutes)).reason(reason).queue();
                    event.reply(member.getAsMention() + " " + minutes + " dakika susturuldu.").queue();
                }
                case "kick" -> member.kick().reason(reason).queue(
                        ignored -> event.reply(member.getAsMention() + " sunucudan atıldı.").queue());
                case "ban" -> member.ban(0, java.util.concurrent.TimeUnit.DAYS).reason(reason).queue(
                        ignored -> event.reply(member.getAsMention() + " sunucudan yasaklandı.").queue());
                default -> event.reply("Geçersiz moderasyon komutu.").setEphemeral(true).queue();
            }
        }, error -> event.reply("Kullanıcı bulunamadı.").setEphemeral(true).queue());
    }

    private BotStateStore.GuildState ensureInfrastructure(Guild guild) {
        BotStateStore.GuildState state = store.guild(guild.getId());
        Category category = guild.getCategoriesByName(ROOM_CATEGORY, true).stream().findFirst().orElse(null);
        if (category == null) {
            guild.createCategory(ROOM_CATEGORY).queue(created -> {
                state.roomCategoryId = created.getId();
                store.save();
            });
        } else {
            state.roomCategoryId = category.getId();
        }
        store.save();
        return state;
    }

    private void ensureRoleMenu(Guild guild, BotStateStore.GuildState state) {
        guild.getTextChannelsByName(ROLE_MENU_CHANNEL, true).stream().findFirst()
                .ifPresentOrElse(channel -> {
                    state.roleMenuChannelId = channel.getId();
                    postRoleMenu(channel, state);
                }, () -> guild.createTextChannel(ROLE_MENU_CHANNEL).queue(channel -> {
                    state.roleMenuChannelId = channel.getId();
                    store.save();
                    postRoleMenu(channel, state);
                }));
    }

    private void postRoleMenu(TextChannel channel, BotStateStore.GuildState state) {
        StringSelectMenu.Builder menu = StringSelectMenu.create(ROLE_MENU)
                .setPlaceholder("Rolünü seç");
        for (BotStateStore.RoleEntry entry : state.roleMenuEntries.stream().limit(25).toList()) {
            String label = entry.label == null ? "Rol" : entry.label.substring(0, Math.min(100, entry.label.length()));
            String description = (entry.category == null ? "other" : entry.category) + " kategorisi";
            menu.addOption(label, entry.roleId, description);
        }
        MessageCreateBuilder message = new MessageCreateBuilder()
                .setEmbeds(new EmbedBuilder().setTitle("👥 Rol Seçim Menüsü")
                        .setDescription("V4 rol menüsünden rolünü seç. Menü rol verir; rol kaldırma için yönetici komutunu kullanır.")
                        .build());
        if (!state.roleMenuEntries.isEmpty()) message.addActionRow(menu.build());
        channel.sendMessage(message.build()).queue(sent -> {
            state.roleMenuMessageId = sent.getId();
            store.save();
        });
    }

    private void ensureRoomMenu(Guild guild, BotStateStore.GuildState state) {
        guild.getTextChannelsByName(ROOM_MENU_CHANNEL, true).stream().findFirst()
                .ifPresentOrElse(channel -> {
                    state.roomMenuChannelId = channel.getId();
                    postRoomMenu(channel, state);
                }, () -> guild.createTextChannel(ROOM_MENU_CHANNEL).queue(channel -> {
                    state.roomMenuChannelId = channel.getId();
                    store.save();
                    postRoomMenu(channel, state);
                }));
    }

    private void postRoomMenu(TextChannel channel, BotStateStore.GuildState state) {
        channel.sendMessage(new MessageCreateBuilder()
                .setEmbeds(new EmbedBuilder().setTitle("🎧 Özel Oda Oluşturma")
                        .setDescription("Aşağıdaki butona basarak kendine özel geçici ses odası açabilirsin.")
                        .build())
                .setActionRow(Button.success(ROOM_BUTTON, "Özel Oda Oluştur"))
                .build()).queue(sent -> {
            state.roomMenuMessageId = sent.getId();
            store.save();
        });
    }

    private void ensureLeaderboard(Guild guild, BotStateStore.GuildState state) {
        guild.getTextChannelsByName(LEADERBOARD_CHANNEL, true).stream().findFirst()
                .ifPresentOrElse(channel -> {
                    state.leaderboardChannelId = channel.getId();
                    postLeaderboard(channel, state);
                }, () -> guild.createTextChannel(LEADERBOARD_CHANNEL).queue(channel -> {
                    state.leaderboardChannelId = channel.getId();
                    store.save();
                    postLeaderboard(channel, state);
                }));
    }

    private void postLeaderboard(TextChannel channel, BotStateStore.GuildState state) {
        channel.sendMessage(new MessageCreateBuilder()
                .setEmbeds(new EmbedBuilder().setTitle("📊 Sunucu Leaderboard")
                        .setDescription("Mesaj, seviye ve ses sıralamasını seç.")
                        .build())
                .setActionRow(StringSelectMenu.create(LEADERBOARD_MENU)
                        .setPlaceholder("Sıralama türünü seç")
                        .addOption("Mesaj", "messages", "En çok mesaj gönderenler")
                        .addOption("Seviye", "levels", "En yüksek seviyedekiler")
                        .addOption("Ses", "voice", "En çok ses dakikası")
                        .build())
                .build()).queue(sent -> {
            state.leaderboardMessageId = sent.getId();
            store.save();
        });
    }

    private void sendLeaderboard(StringSelectInteractionEvent event, String type) {
        List<Map.Entry<String, BotStateStore.MemberStats>> rows =
                store.topStats(event.getGuild().getId(), type);
        if (rows.isEmpty()) {
            event.reply("Henüz leaderboard verisi yok.").setEphemeral(true).queue();
            return;
        }
        List<String> lines = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            Map.Entry<String, BotStateStore.MemberStats> row = rows.get(i);
            long value = switch (type) {
                case "messages" -> row.getValue().messages;
                case "levels" -> row.getValue().level;
                default -> row.getValue().voiceSeconds / 60;
            };
            lines.add((i + 1) + ". <@" + row.getKey() + "> — " + value);
        }
        event.reply(String.join("\n", lines)).setEphemeral(true).queue();
    }

    private void sendLeaderboard(SlashCommandInteractionEvent event, String type) {
        List<Map.Entry<String, BotStateStore.MemberStats>> rows =
                store.topStats(event.getGuild().getId(), type);
        String text = rows.isEmpty() ? "Henüz leaderboard verisi yok." :
                rows.stream().map(row -> "<@" + row.getKey() + "> — " + row.getValue().level)
                        .reduce((a, b) -> a + "\n" + b).orElse("");
        event.reply(text).setEphemeral(true).queue();
    }

    private void createPrivateRoom(ButtonInteractionEvent event) {
        Guild guild = event.getGuild();
        BotStateStore.GuildState state = ensureInfrastructure(guild);
        Category category = state.roomCategoryId == null ? null : guild.getCategoryById(state.roomCategoryId);
        if (category == null) {
            event.reply("Özel oda kategorisi henüz hazır değil; birkaç saniye sonra tekrar dene.")
                    .setEphemeral(true).queue();
            return;
        }
        String safeName = event.getMember().getEffectiveName().replaceAll("[^\\p{L}\\p{N}_-]", "-");
        guild.createVoiceChannel("oda-" + safeName)
                .setParent(category)
                .queue(channel -> {
                    roomOwners.put(channel.getId(), event.getMember().getId());
                    guild.moveVoiceMember(event.getMember(), channel).queue();
                    event.reply("Özel ses odan oluşturuldu.").setEphemeral(true).queue();
                }, error -> event.reply("Özel ses odası oluşturulamadı.").setEphemeral(true).queue());
    }
}