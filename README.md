# discord-ai-chat-bot

## 🚀 Installation
### Install Bun runtime.

**Navigate to the main folder, and run thesee commands:**

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## ✨ Configuration
1. Run the project to initalize te config files.
2. Open the configuration files and set them:

`custom.json`: Discord bot customisation settings
```json
{
    "activities" : [    // Discord bot statuses
        "www.mcitomi.hu",
        "https://github.com/mcitomi/discord-ai-chat-bot"
    ],
    "refresh_interval_sec" : 15 // Status change interval
}
```
`model.json`: Gemini model settings
```json
{
    "system_config": "You are a discord chat bot.", // The main system instruction
    "inforamtion_padding": "Information datapack: ",    // After this text comes the content of "data.txt"
    "max_req_per_min": 15,   // You can control the maximum number of requests (15 is the Gemini 2.0 flash free limit)
    "maxOutputTokens" : 300,
    "temperature": 1,   // Default gemini prompt values https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/adjust-parameter-values
    "top_p": 0.95,
    "top_k": 64
}
```
`data.txt`: In this file you can enter the AI ​​model tuning data, This will still be given as a "system instruction".

`secrets.json`: Your application api keys.
```json
{
    "bot_token" : "your discord bot token",
    "gemini_key" : "your gemini api key"
}
```

## 📝 About
The program will create a log.txt in the main folder, where all previous conversations are stored. The bot will load these after each restart and pass them to the AI ​​model as message history.

This log is infinitely long, you can manually delete things from it (later there will be a setting for this in the config)


## 🍻 Contact me on
*Discord: @mcitomi / https://dc.mcitomi.hu*