const Config = {
    API_ID: Number(process.env.API_ID) || 26850449,
    API_HASH: process.env.API_HASH || "72a730c380e68095a8549ad7341b0608",
    BOT_TOKEN: process.env.BOT_TOKEN || "8993366576:AAHUsPShDLA2mzxAHaIJr3KVxk8FKqo9s20",
    OWNER_ID: Number(process.env.OWNER_ID) || 8462359928,
    CHANNEL_URL: process.env.CHANNEL_URL || "https://t.me/DevsHubChat",
    CHANNEL_IDS: process.env.CHANNEL_IDS
        ? process.env.CHANNEL_IDS.split(",").map(Number)
        : [-1002541457740],
    MONGO_DB: process.env.MONGO_DB || "mongodb+srv://Akatsumo:01psB3hxMeGIebgv@cluster0.6t7raqw.mongodb.net/?appName=Cluster0",
};

module.exports = Config;
