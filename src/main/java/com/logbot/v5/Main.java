package com.logbot.v5;

import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.entities.Activity;
import net.dv8tion.jda.api.requests.GatewayIntent;

import java.nio.file.Path;
import java.util.EnumSet;

public final class Main {
    private Main() {}

    public static void main(String[] args) throws Exception {
        String token = System.getenv("DISCORD_TOKEN");
        if (token == null || token.isBlank() || token.startsWith("BURAYA_")) {
            throw new IllegalStateException("DISCORD_TOKEN is required.");
        }

        Path statePath = Path.of(System.getenv().getOrDefault("BOT_STATE_FILE", "data/bot-state.json"));
        BotStateStore state = new BotStateStore(statePath);
        state.load();

        EnumSet<GatewayIntent> intents = EnumSet.of(
                GatewayIntent.GUILD_MEMBERS,
                GatewayIntent.GUILD_MESSAGES,
                GatewayIntent.MESSAGE_CONTENT,
                GatewayIntent.GUILD_VOICE_STATES
        );

        JDA jda = JDABuilder.create(token, intents)
                .addEventListeners(new LogbotListener(state))
                .setActivity(Activity.listening("/setup"))
                .build();

        jda.awaitReady();
        System.out.println("Logbot V5 Java bot connected as " + jda.getSelfUser().getAsTag());
    }
}