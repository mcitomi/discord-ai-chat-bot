import { ActivityType, Client, GatewayIntentBits, PermissionFlagsBits, REST, Routes, SlashCommandBuilder, AttachmentBuilder, type Interaction, MessageFlags, EmbedBuilder, Colors } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import { readFileSync, unlinkSync, statSync } from "node:fs";
import { join } from "node:path";

import { writeLog, getSavedHistory } from "./log.ts";

const geminiPromptResponseTimes = [];

export async function DiscordClient(bot_token: string, gemini_key: string, activities: string[], refresh_interval_sec: number, system_config: string, inforamtion_padding: string, max_req_per_min: number, maxOutputTokens: number, temperature: number, top_p: number, top_k: number) {
    try {
        var requestCount = 0;

        var history = getSavedHistory();

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

            (new REST({ version: '10' }).setToken(bot_token)).put(Routes.applicationCommands(client.user!.id), {
                body: [
                    new SlashCommandBuilder()
                        .setName("reset")
                        .setDescription("Reset the bot message history")
                        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

                    new SlashCommandBuilder()
                        .setName("info")
                        .setDescription("Get informations about the bot")
                ],
            });
        });

        client.on("interactionCreate", async (interaction: Interaction) => {
            if (!interaction.isCommand()) return;
            switch (interaction.commandName) {
                case "reset":
                    const logFilePath = join(import.meta.dir, "..", "log.txt");
                    const attachment = new AttachmentBuilder(logFilePath, { name: 'log.txt' });

                    const reply = await interaction.reply({ content: "History cleared", files: [attachment] });

                    if (reply.id) {
                        unlinkSync(logFilePath);

                        history = [];
                    }
                    break;

                case "info":
                    const logStat = statSync(join(import.meta.dir, "..", "log.txt"));

                    const embed = new EmbedBuilder()
                        .setTitle(`${client.user.username}'s informations`)
                        .setColor(Colors.Yellow)
                        .setTimestamp()
                        .setFooter({ text: "www.mcitomi.hu | https://github.com/mcitomi/discord-ai-chat-bot" })
                        .setDescription(
                            
                            `📁 Logfile size: ${logStat.size} byte.\n` +
                            `🌐 Latency: ${client.ws.ping} ms.\n` +
                            `${geminiPromptResponseTimes.length ? `🤖 Last prompt gen time: ${geminiPromptResponseTimes[geminiPromptResponseTimes.length - 1]} ms.\n` : ""}` +
                            `${geminiPromptResponseTimes.length ? `📡 AVG prompt gen time: ${Math.floor((geminiPromptResponseTimes.reduce((a, b) => a + b, 0)) / geminiPromptResponseTimes.length)} ms.\n` : ""}` +
                            `🕐 Uptime: ${formatUptime(process.uptime())}`
                        );

                    interaction.reply({ embeds: [embed] });
                    break;
                default:
                    break;
            }
        })

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

                if (message.includes("user:") || message.includes("text:")) {
                    msg.channel.send("⚠️ Illegal characters!");
                    return;
                }

                msg.channel.sendTyping();

                writeLog(`user: ${msg.member.nickname || msg.author.displayName} ; text: ${message}`)

                const chat = ai.chats.create({ model: 'gemini-2.0-flash', history });

                const sentResponseTimestamp = Date.now();
                const response = await chat.sendMessage({
                    message: `user: ${msg.member.nickname || msg.author.displayName} text: ${message}`,
                    config: {
                        systemInstruction: system_config + inforamtion_padding + modelInformations,
                        maxOutputTokens: maxOutputTokens,
                        temperature: temperature,
                        topK: top_k,
                        topP: top_p
                    }
                }).catch(e => {
                    return { text: null, promptFeedback: e.message }
                });

                geminiPromptResponseTimes.push(Date.now() - sentResponseTimestamp);

                if (!response.text) {
                    msg.reply({ content: `⚠️ Unable to generate response, reason: ${response.promptFeedback?.blockReason || "Unknown - Gemini Google server error / overloaded 🔥🔥"}` }).catch((e) => {
                        console.error(e);
                    });
                    return;
                }

                msg.reply(response?.text?.slice(0, 1700));

                writeLog(`user: aimodel ; text: ${response?.text?.slice(0, 1700)}`);

                history.push(
                    {
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
                                "text": `${response.text}`
                            }
                        ]
                    }
                )
            }
        });

        client.login(bot_token).catch((e) => {
            console.error("Invalid Discord bot token!");
            process.exit(0);
        });

    } catch (error) {
        console.log("Discord module error: ", error);
    }
};

function formatUptime(seconds: number): string {
    const weeks = Math.floor(seconds / (7 * 24 * 60 * 60));
    seconds %= 7 * 24 * 60 * 60;

    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    const pad = (n) => n.toString().padStart(2, '0');

    let result = "";
    if (weeks > 0) result += `${weeks} week `;
    if (days > 0 || weeks > 0) result += `${days} day `;

    result += `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return result.trim();
}
