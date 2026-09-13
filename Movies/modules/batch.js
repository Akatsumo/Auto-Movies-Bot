const Config = require("../../config");
const { Markup } = require("telegraf");
const { app, gramClient } = require("../index");
const filesdb = require("../core/mongo/filesdb");

const runningBatch = new Map();

// --------------------------- Parse Link --------------------------- //

const parseLink = async (ctx, link) => {
    const parts = link.split("/");
    const msg_id = Number(parts.pop());
    let chat;
    if (parts[3] === "c") {
        chat = Number(`-100${parts[4]}`);
    } else {
        const data = await ctx.telegram.getChat(`@${parts[3]}`);
        chat = data.id;
    }
    return {chat, msg_id};
};


// --------------------------- Batch ---------------------------  //

app.command("batch", async (ctx) => {
    if (ctx.from.id !== Config.OWNER_ID) return;

    const [, start, end] = ctx.message.text.split(" ");
    if (!start || !end) {
        return ctx.reply("Usage: /batch <start_link> <end_link>");
    }

    try {
        const s = await parseLink(ctx, start);
        const e = await parseLink(ctx, end);
        const total = e.msg_id - s.msg_id + 1;
        const batchId = `${ctx.from.id}_${Date.now()}`;
        runningBatch.set(batchId, { running: true, saved: 0, skipped: 0, checked: 0, total });

        const status = await ctx.reply(`📦 Batch Started\n\n0/${total}`,
            Markup.inlineKeyboard([[Markup.button.callback("🛑 Cancel", `cancel_batch:${batchId}`)]]));

        processBatch(batchId, s, e, ctx.chat.id, status.message_id);

    } catch (err) {
        console.log(err);
        await ctx.reply("❌ Batch Failed: " + (err.message || "Unknown error"));
    }
});

// --------------------------- Batch Functions ---------------------------  //

const CHUNK_SIZE = 50;
const CHUNK_DELAY = 100;

async function processBatch(batchId, s, e, chatId, messageId) {
    const batch = runningBatch.get(batchId);
    let lastUpdate = Date.now();

    try {
        const allIds = [];
        for (let i = s.msg_id; i <= e.msg_id; i++) {
            allIds.push(i);
        }

        for (let c = 0; c < allIds.length; c += CHUNK_SIZE) {
            if (!batch.running) break;

            const chunkIds = allIds.slice(c, c + CHUNK_SIZE);
            let msgs = [];

            try {
                msgs = await gramClient.getMessages(s.chat, { ids: chunkIds });
            } catch (err) {
                console.log(`Batch chunk error: ${err.message}`);
                batch.skipped += chunkIds.length;
                batch.checked += chunkIds.length;
                continue;
            }

            for (let j = 0; j < msgs.length; j++) {
                if (!batch.running) break;
                batch.checked++;

                const data = msgs[j];
                if (!data) { batch.skipped++; continue; }

                let media = null;
                if (data.document)
                    media = data.document;
                else if (data.video)
                    media = data.video;

                if (!media) { batch.skipped++; continue; }
                const file_name = media.attributes?.find(x => x.fileName)?.fileName || `file_${chunkIds[j]}`;
                const file_size = media.size || 0;

                try {
                    await filesdb.addFile(Number(s.chat), Number(chunkIds[j]), file_name, file_size);
                    batch.saved++;
                } catch {batch.skipped++;}
            }

            if (Date.now() - lastUpdate > 3000 || batch.checked >= batch.total) {
                lastUpdate = Date.now();
                await updateBatchProgress(batch, chatId, messageId, batchId);
            }

            if (c + CHUNK_SIZE < allIds.length && batch.running) {
                await new Promise(r => setTimeout(r, CHUNK_DELAY));
            }
        }
        if (batch.running) {
            await app.telegram.editMessageText(chatId, messageId, undefined,
`
✅ Batch Completed

📁 Saved   : ${batch.saved}
⚠️ Skipped : ${batch.skipped}

📦 Total   : ${batch.total}
`
            ).catch(() => {});
        }
    } catch (err) {
        console.log(`Batch fatal error: ${err.message}`);
        await app.telegram.editMessageText(chatId, messageId, undefined,
`
❌ Batch Failed

📁 Saved   : ${batch.saved}
⚠️ Skipped : ${batch.skipped}
📦 Checked : ${batch.checked}/${batch.total}

Error: ${err.message || "Unknown"}
`
        ).catch(() => {});
    } finally { runningBatch.delete(batchId); }
}

// --------------------------- Update Batch Progress ---------------------------  //

async function updateBatchProgress(batch, chatId, messageId, batchId) {
    const percent = Math.floor((batch.checked / batch.total) * 100);
    const bar = progressBar(batch.checked, batch.total);
    await app.telegram.editMessageText(chatId, messageId, undefined,
`
📦 Batch Processing

${bar} ${percent}%

📁 Saved   : ${batch.saved}
⚠️ Skipped : ${batch.skipped}

${batch.checked}/${batch.total}
`,
        {
            reply_markup: Markup.inlineKeyboard([[Markup.button.callback("🛑 Cancel", `cancel_batch:${batchId}`)]]).reply_markup
        }
    ).catch(() => {});
}

// --------------------------- Batch Progress Bar ---------------------------  //

function progressBar(current, total) {
    const size = 10;
    const filled = Math.floor((current / total) * size);
    return ("█".repeat(filled) + "░".repeat(size - filled));
}



// --------------------------- Cancel Batch Action ---------------------------  //

app.action(/^cancel_batch:(.+)$/, async (ctx) => {
    const batchId = ctx.match[1];

    if (!batchId.startsWith(String(ctx.from.id))) {
        return ctx.answerCbQuery("Not your batch", { show_alert: true });
    }
    const batch = runningBatch.get(batchId);
    if (batch) {batch.running = false;}
    await ctx.answerCbQuery("Batch cancelled", { show_alert: true });
});


// --------------------------- Delete File ---------------------------  //

app.command("delete", async (ctx) => {
    if (ctx.from.id !== Config.OWNER_ID) return;

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return await ctx.reply("Usage: /delete <channel_link>");
    }
    const msg = await parseLink(ctx, args[1]);
    await filesdb.removeFile(parseInt(msg.chat), parseInt(msg.msg_id));
    await ctx.reply(`Successfully Deleted File from ${msg.chat} filed id ${msg.msg_id}`);
});

// --------------------------- Delete All Specific Channel ---------------------------  //

app.command("deleteall", async (ctx) => {
    if (ctx.from.id !== Config.OWNER_ID) return;
    await filesdb.removeAllFiles();
    await ctx.reply("Successfully Deleted All File");
});
