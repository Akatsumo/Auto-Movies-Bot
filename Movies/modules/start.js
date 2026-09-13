const Config = require("../../config");
const { app, gramClient } = require("../index");
const main_func = require("../core/main_func");

const PHOTO ="https://media.animerealms.org/image/AgACAgUAAx0EboWBewAC961qLms4O3eitpNJzL4bTItT64xRaQACGxFrG57EcVUMPx-4HgZRJwEAAwIAA3gAAzwE";

// -------------------------------- Buttons -------------------------------- //

const replyMarkup = {
  inline_keyboard: [
    [{ text: "🧰 Tools", callback_data: "tools_" }],
    [{ text: "🌐 Channel", url: Config.CHANNEL_URL }]
  ]
};

const toolsKeyboard = {
  inline_keyboard: [
    [{ text: "🏠 Home", callback_data: "home_" }]
  ]
};

// -------------------------------- Captions -------------------------------- //

const homeCaption = async (ctx) => {
    const me = await ctx.telegram.getMe();
    return `✦ Hello ${ctx.from.first_name}

Welcome To ${me.first_name}

Search for the latest movies and web series instantly. Simply send the correct title, and I'll find the best available results for you.`;
}

const tools = `
🧰 <b>Available Tools</b>

Here are all the commands related to the movies bot

→ <code>/batch</code> : Save multiple movies to the database in bulk.
→ <code>/delete</code> : Remove a specific file from the database.
→ <code>/deleteall</code> : Delete all files currently stored in the database.
→ <code>/connect</code> : Connect a channel and automatically index new movie files posted there.
→ <code>/disconnect</code> : Disconnect a channel from the bot and disable automatic indexing for it.
→ <code>/connections</code> : View all connected channels.
→ <code>/stats</code> : Check the bot's current statistics and usage details.
→ <code>/info</code> : View your account information and bot-related details.

<i>Click the button below to go back.</i>
`;

// -------------------------------- Start Command -------------------------------- //

app.command("start", async (ctx) => {
  if (await main_func.subscribe(ctx)) return;
  const text = ctx.message.text;

  if (text.startsWith("/start files_")) {
    return await main_func.mediaFile(ctx, text.split(" ")[1].split("_")[1], gramClient);
  }
  await ctx.replyWithPhoto(PHOTO, {caption: (await homeCaption(ctx)), reply_markup: replyMarkup});
});


// -------------------------------- Tools Button -------------------------------- //

app.action("tools_", async (ctx) => {
  await ctx.editMessageCaption(tools, {
    parse_mode: "HTML",
    reply_markup: toolsKeyboard
  });
});

// -------------------------------- Home Button -------------------------------- //

app.action("home_", async (ctx) => {
  await ctx.editMessageMedia({type: "photo", media: PHOTO, caption: (await homeCaption(ctx))},
    {
      reply_markup: replyMarkup
    }
  );
});
