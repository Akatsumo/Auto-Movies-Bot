const { app } = require("../index");
const Config = require("../../config");
const filesdb = require("../core/mongo/filesdb");
const chatsdb = require("../core/mongo/chatsdb");
const usersdb = require("../core/mongo/usersdb");
const connectiondb = require("../core/mongo/connectiondb");

// --------------------------------------- Chat Watcher --------------------------------------- //

const startTime = Date.now();

app.use(async (ctx, next) => {
    try {
        if (ctx.from) {
            const userId = ctx.from.id;
            if (!(await usersdb.isUserExist(userId))) {
                await usersdb.addUser(userId);
            }
        }

        if (ctx.chat) {
            const chatId = ctx.chat.id;
            if (!(await chatsdb.isChatExist(chatId))) {
                await chatsdb.addChat(chatId);
            }
        }
    } catch (error) {
        console.error(error);
    }
    return next();
});

// --------------------------------------- Bot Running Time --------------------------------------- //

function timeFormatter() {
    let seconds = Math.floor((Date.now() - startTime) / 1000);
    const weeks = Math.floor(seconds / (7 * 24 * 60 * 60));
    seconds %= (7 * 24 * 60 * 60);
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds %= (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    let uptime = "";

    if (weeks) uptime += `${weeks}w:`;
    if (days) uptime += `${days}d:`;
    if (hours) uptime += `${hours}h:`;
    if (minutes) uptime += `${minutes}m:`;
    if (seconds) uptime += `${seconds}s`;

    return uptime.replace(/:$/, "") || "0s";
}

// --------------------------------------- Stats Command --------------------------------------- //

const replyMarkup = {
    inline_keyboard: [[{text: "🗑 Close", callback_data: "delete_me"}]]
};

app.command("stats", async (ctx) => {
    if (ctx.from.id !== Config.OWNER_ID) return;

    const start = Date.now();

    const users = await usersdb.getUsersCount();
    const channels = await chatsdb.getChatsCount();
    const connections = await connectiondb.getChannelCount();
    const files = await filesdb.getFilesCount() 

    const me = await ctx.telegram.getMe();
    const ping = Date.now() - start;

    const text = `
╭────〔 🤖 ${me.first_name} 〕────╮
│
│ ⚡ Ping: ${ping} ms
│ ⏳ Uptime: ${timeFormatter()}
│
│ 👥 Users: ${users}
│ 📢 Channels: ${channels}
│ 🔗 Connects: ${connections}
│ 📂 Files: ${files}
│
│ 💚 Node.js: ${process.version}
│ 🍃 MongoDB: v9.6.3
│ 🎭 Telegraf: v4.16.3
│ ✈️ GramJS: v2.26.6
│
╰──────── 🟢 Online ────────╯
`;
    await ctx.replyWithPhoto(
        "https://media.animerealms.org/image/AgACAgUAAx0EboWBewAC9vRqKuzTeZb5_UdHPJyNZwABwin7q8MAAvkQaxvfVllVf8fMdkA-CvABAAMCAAN3AAM8BA",
        {
            caption: text,
            parse_mode: "Markdown",
            reply_markup: replyMarkup
        }
    );
});
