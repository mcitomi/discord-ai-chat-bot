import { ActivityType, Client, GatewayIntentBits } from "discord.js";
import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { writeLog, getSavedHistory } from "./log.ts";

export async function DiscordClient(bot_token: string, gemini_key: string, activities: string[], refresh_interval_sec: number, system_config: string, inforamtion_padding: string, max_req_per_min: number) {
    try {
        var requestCount = 0;

        const history = getSavedHistory();

        const ai = new GoogleGenAI({ apiKey: gemini_key });

        const client: Client<boolean> = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
            ]
        });

        const modelInformations = readFileSync(join(import.meta.dir, "..", "config", "data.txt"), { encoding: "utf-8" });

        console.log(modelInformations + "\n -sys data loaded");

        client.on("ready", async () => {
            console.log(`- ${client.user.username} connected to Discord!`);

            client.user.setActivity({ name: activities[0], type: ActivityType.Listening });

            setInterval(() => {
                client.user.setActivity({ name: activities[Math.floor(Math.random() * activities.length)], type: ActivityType.Listening });
            }, refresh_interval_sec * 1000);
        });

        setInterval(() => {
            requestCount = 0;
        }, 60000);

        client.on("messageCreate", async (msg) => {
            if (msg.content.includes(`<@${client.user.id}>`)) {
                requestCount++;

                if (requestCount > max_req_per_min) {
                    msg.channel.send("⚠️ Too many request! Try again later (1min).");
                    return;
                }

                const message = msg.content.replaceAll(`<@${client.user.id}>`, "");

                if(message.includes("user:") || message.includes("text:")) {
                    msg.channel.send("⚠️ Illegal characters!");
                    return;
                }

                writeLog(`user: ${msg.member.nickname || msg.author.displayName} ; text: ${message}`)

                const chat = ai.chats.create({ model: 'gemini-2.0-flash', history });
                const response = await chat.sendMessage({
                    message: `user: ${msg.member.nickname || msg.author.displayName} text: ${message}`,
                    config: {
                        systemInstruction: system_config + inforamtion_padding + modelInformations
                    }
                });

                msg.channel.send(response.text);

                writeLog(`user: aimodel ; text: ${response.text}`);

                history.push({
                    "role": "user",
                    "parts": [
                        {
                            "text": `user: ${msg.member.nickname || msg.author.displayName} ; text: ${message}`
                        }
                    ]
                },
                    {
                        "role": "model",
                        "parts": [
                            {
                                "text": `user: aimodel ; text: ${response.text}`
                            }
                        ]
                    })
            }
        });

        client.login(bot_token).catch((e) => {
            console.error("Invalid Discord bot token!");
            process.exit(0);
            return;
        });

    } catch (error) {
        console.log("Discord module error: ", error);
    }
};