const { Markup } = require("telegraf");
const Config = require("../../config");
const { Button } = require("telegram/tl/custom/button");



// -------------------------------- Force Subscribe -------------------------------- //

async function genLink(ctx, chatId) {
    const inviteLink = await ctx.telegram.createChatInviteLink(chatId);
    return inviteLink.invite_link;
}

async function subscribe(ctx) {
    if (!ctx.from) return false;

    const buttons = [];
    const userId = ctx.from.id;

    for (const channel of Config.CHANNEL_IDS) {
        try {
            const member = await ctx.telegram.getChatMember(channel,userId);
            const isMember = ["creator", "administrator", "member"].includes(member.status);
            if (!isMember) { const link = await genLink(ctx, channel);
                buttons.push([Markup.button.url("📢 Join Channel", link)]);
            }

        } catch (error) {
            console.error(`Failed to check channel ${channel}:`, error.message);
            return false;
        }
    }
    if (!buttons.length) return false;
    await ctx.replyWithPhoto("https://telegra.ph/file/b7a933f423c153f866699.jpg",
        {
            caption: `**ʜᴇʏ** ${ctx.from.first_name}

**ᴀᴄᴄᴏʀᴅɪɴɢ ᴛᴏ ᴍʏ ᴅᴀᴛᴀʙᴀsᴇ ʏᴏᴜ'ᴠᴇ ɴᴏᴛ ᴊᴏɪɴᴇᴅ ᴜᴘᴅᴀᴛᴇs ᴄʜᴀɴɴᴇʟ ʏᴇᴛ, ɪғ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ᴜsᴇ ᴍᴇ ᴛʜᴇɴ ᴊᴏɪɴ ᴜᴘᴅᴀᴛᴇs ᴄʜᴀɴɴᴇʟ ᴀɴᴅ sᴛᴀʀᴛ ᴍᴇ ᴀɢᴀɪɴ !**
`,
           parse_mode: "Markdown",
            ...Markup.inlineKeyboard(buttons)
        }
    );
    return true;
}


// -------------------------------- Format Size -------------------------------- //
function formatSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// -------------------------------- Auto Delete -------------------------------- /
async function autoDelete(ctx, sent, time = 120000) {
    setTimeout(async () => {
        try {
            await ctx.telegram.deleteMessage(sent.chat.id, sent.message_id);
        } catch (err) {
            console.error("Auto delete failed:", err.message);
        }
    }, time);
}

// -------------------------------- Keyboard Generate -------------------------------- //
async function getKeyboard(ctx, movies, page = 0) {
    const perPage = 8;
    const start = page * perPage;
    const end = start + perPage;
    const chunk = movies.slice(start, end);
    const buttons = [];
    const me = await ctx.telegram.getMe();

    buttons.push([Markup.button.url("📢 Channel", Config.CHANNEL_URL)]);

    for (const movie of chunk) {
        buttons.push([Markup.button.url(
                `${formatSize(movie.file_size.value)} | ${movie.file_name.slice(0, 40)}`,
                `https://telegram.dog/${me.username}?start=files_${base64_encodeDecode(`${movie.chat_id}_${movie.msg_id}`)}`
            )
        ]);
    }
    const nav = [];

    if (page > 0) {
        nav.push(Markup.button.callback("﹤ Prev", `movie_prev_${page - 1}_${ctx.from.id}`));
    }
    if (end < movies.length) {
        nav.push(Markup.button.callback("Next ﹥", `movie_next_${page + 1}_${ctx.from.id}`));
    } else {
        nav.push(Markup.button.callback("📄 No More Pages", "movie_nomore"));
    }
    buttons.push(nav);
    return Markup.inlineKeyboard(buttons);
}

// -------------------------------- Base64 Encode or Decode -------------------------------- //
function base64_encodeDecode(text, encode = true) {
    return encode
        ? Buffer.from(text, "utf8").toString("base64")
        : Buffer.from(text, "base64").toString("utf8");
}

// -------------------------------- Media File Sender -------------------------------- //
async function mediaFile(ctx, file_data, client) {
    try {
        const userId = ctx.from.id;
        const [chat_id, msg_id] = base64_encodeDecode(file_data, false).split("_");

        if (!chat_id || !msg_id) {
            return ctx.reply("❌ Invalid file link. Please try again.");
        }

        const msg = (await client.getMessages(Number(chat_id), { ids: Number(msg_id) }))?.[0];
        if (!msg) {
            return ctx.reply("❌ File not found. It may have been deleted from the source channel.");
        }

        const media = msg.video || msg.document;
        if (!media) {
            return ctx.reply("❌ No media found in this message.");
        }

        const fileName = media.attributes?.find(x => x.fileName)?.fileName || "Unknown";
        await client.sendFile(userId, {
            file: msg.media,
            caption: `📁 ${fileName}`,
            buttons: [[Button.url("🌐 Channel", Config.CHANNEL_URL)]]
        });
        console.log(`File Sent Succesfully | ${userId} | ${fileName}`)
    } catch (err) {
        console.error(`mediaFile error: ${err.message}`);
        await ctx.reply("❌ Failed to send the file. Please try again later.").catch(() => {});
    }
}


module.exports = {
    formatSize,
    autoDelete,
    getKeyboard,
    base64_encodeDecode,
    mediaFile,
    subscribe,
}
