import { DiscordClient } from "./src/client.ts";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const configDir = join(import.meta.dir, "config");
if (!existsSync(configDir)) {
    console.log("Config folder created!");
    mkdirSync(configDir);
}

const customConfig = join(import.meta.dir, "config", "custom.json");
if (!existsSync(customConfig)) {
    console.log("custom.json created!");
    writeFileSync(customConfig, JSON.stringify({
        "activities": [
            "www.mcitomi.hu",
            "https://github.com/mcitomi/discord-ai-chat-bot"
        ],
        "refresh_interval_sec": 15
    }, null, 4));
}
const { activities, refresh_interval_sec } = await import(customConfig);

const modelConfig = join(import.meta.dir, "config", "model.json");
if (!existsSync(modelConfig)) {
    console.log("model.json created!");
    writeFileSync(modelConfig, JSON.stringify({
        "system_config": "You are a discord chat bot.",
        "inforamtion_padding": "Information datapack: ",
        "max_req_per_min": 15
    }, null, 4));
}
const { system_config, inforamtion_padding, max_req_per_min } = await import(modelConfig);

const secretConfig = join(import.meta.dir, "config", "secrets.json");
if (!existsSync(secretConfig)) {
    console.log("secrets.json created!");
    writeFileSync(secretConfig, JSON.stringify({
        "bot_token" : "your discord bot token",
        "gemini_key" : "your gemini api key"
    }, null, 4));
}
const { bot_token, gemini_key } = await import(secretConfig);

const dataText = join(import.meta.dir, "config", "data.txt");
if (!existsSync(dataText)) {
    console.log("data file created!");
    writeFileSync(dataText, "Data examples..");
}

console.log("- Hello via Bun!");

DiscordClient(bot_token, gemini_key, activities, refresh_interval_sec, system_config, inforamtion_padding, max_req_per_min);
