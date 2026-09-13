const { app } = require("../index");
const filesdb = require("../core/mongo/filesdb");
const connectiondb = require("../core/mongo/connectiondb");


// ---------------------------------------- CHANNEL POST HANDLER ---------------------------------------- //

app.on("channel_post", async (ctx) => {
    const msg = ctx.channelPost;
    if (!msg) return;
    const CHANNELS = await connectiondb.getChannelIds();
    if (!CHANNELS.includes(msg.chat.id)) return;
    const media = msg.document || msg.video;
    if (!media) return;

    console.log(`>> ${msg.chat.id} Received File`);
    await filesdb.addFile(
        msg.chat.id,
        msg.message_id,
        media.file_name || "Unknown File",
        media.file_size || 0
    );
    console.log(`>> Saved : ${media.file_size} | ${media.file_name}`);
});
// ---------------------------------------- CHANNEL CONNECT HANDLER ---------------------------------------- //

app.command("connect", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return await ctx.reply("Usage: /connect <channel_id>");
    }

    const channelId = Number(args[1]);
    if (isNaN(channelId)) {
        return await ctx.reply("Please provide a valid channel ID.");
    }
    await connectiondb.addChannel(channelId);
    await ctx.reply(`Successfully connected channel: ${channelId}`);
});

// ---------------------------------------- CHANNEL DISCONNECT HANDLER ---------------------------------------- //

app.command("disconnect", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return await ctx.reply("Usage: /disconnect <channel_id>");
    }

    const channelId = Number(args[1]);
    if (isNaN(channelId)) {
        return await ctx.reply("Please provide a valid channel ID.");
    }
    await connectiondb.removeChannel(channelId);
    await ctx.reply(`Successfully disconnected channel: ${channelId}`);
});

// ---------------------------------------- CHANNEL CONNECTION HANDLER ---------------------------------------- //

const { Markup } = require("telegraf");

app.command("connections", async (ctx) => {
    const channelIds = await connectiondb.getChannelIds();

    if (!channelIds.length) {
        return await ctx.reply("📡 No channels connected yet.");
    }

    let text = "╭─❖ 📡 Connected Channels ❖\n\n";

    for (let i = 0; i < channelIds.length; i++) {
        const channelId = channelIds[i];

        try {
            const chat = await ctx.telegram.getChat(channelId);
            text +=
                `┣ ${i + 1}. ${chat.title}\n` +
                `┃ 🆔 \`${channelId}\`\n` +
                `┃ ─────────────\n`;
        } catch {
            text +=
                `┣ ${i + 1}. Unknown Channel\n` +
                `┃ 🆔 \`${channelId}\`\n` +
                `┃ ─────────────\n`;
        }
    }
    text += `╰─❖ Total: ${channelIds.length} Channels ❖`;
    await ctx.reply(text, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("🗑 Remove All Channels", "remove_all_channels")]])
    });
});

// ---------------------------------------- REMOVE ALL CALLBACK HANDLER ---------------------------------------- //

app.action("remove_all_channels", async (ctx) => {
    await connectiondb.removeAllChannels();
    await ctx.answerCbQuery("All channels removed!");
    await ctx.editMessageText("✅ Successfully removed all connected channels.");
});

