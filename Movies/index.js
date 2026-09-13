require("dotenv").config();
const fs = require("fs");
const path = require("path");

const Config = require("../config");

const { Telegraf } = require("telegraf");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");


// ─────────────────────── ʙᴏᴛ & ᴄʟɪᴇɴᴛ ───────────────────────

const app = new Telegraf(Config.BOT_TOKEN);

const gramClient = new TelegramClient(
    new StringSession(Config.STRING || ""),
    Config.API_ID,
    Config.API_HASH,
    { connectionRetries: 5 }
);

module.exports = { app, gramClient };

// ─────────────────────── ʟᴏᴀᴅ ᴍᴏᴅᴜʟᴇꜱ ───────────────────────

const modulesPath = path.join(__dirname, "modules");

if (fs.existsSync(modulesPath)) {
    fs.readdirSync(modulesPath)
        .filter(file => file.endsWith(".js"))
        .forEach(file => {
            try {
                require(path.join(modulesPath, file));
                console.log(`◈ ʟᴏᴀᴅᴇᴅ → ${file}`);
            } catch (err) {
                console.log(`◈ ꜰᴀɪʟᴇᴅ → ${file}`);
                console.error(err);
            }
        });
} else {
    console.log("✦ ᴍᴏᴅᴜʟᴇꜱ ꜰᴏʟᴅᴇʀ ɴᴏᴛ ꜰᴏᴜɴᴅ");
}

// ─────────────────────── ꜱᴛᴀʀᴛ ───────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

async function startBot(attempt = 1) {
    try {
        console.log(`◈ ꜱᴛᴀʀᴛɪɴɢ (attempt ${attempt}/${MAX_RETRIES})`);

        // Ensure DB indexes
        const filesdb = require("./core/mongo/filesdb");
        await filesdb.ensureIndexes().catch(err => console.log("Index setup skipped:", err.message));

        await Promise.all([
            app.launch({
                dropPendingUpdates: true
            }),
            gramClient.start({
                botAuthToken: Config.BOT_TOKEN
            })
        ]);
        console.log("◈ ʙᴏᴛ ꜱᴛᴀʀᴛᴇᴅ");
        console.log("◈ ɢʀᴀᴍᴊꜱ ᴄᴏɴɴᴇᴄᴛᴇᴅ");
    } catch (err) {
        console.log(`◈ ꜱᴛᴀʀᴛᴜᴘ ꜰᴀɪʟᴇᴅ (attempt ${attempt}):`, err.message);
        if (attempt < MAX_RETRIES) {
            console.log(`◈ ʀᴇᴛʀʏɪɴɢ ɪɴ ${RETRY_DELAY / 1000}s...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY));
            return startBot(attempt + 1);
        }
        console.error("◈ ᴀʟʟ ʀᴇᴛʀɪᴇꜱ ꜰᴀɪʟᴇᴅ, ᴇxɪᴛɪɴɢ");
        process.exit(1);
    }
}

startBot();

// ─────────────────────── ꜱʜᴜᴛᴅᴏᴡɴ ───────────────────────

["SIGINT", "SIGTERM"].forEach(signal => process.on(signal, () => app.stop(signal)));
