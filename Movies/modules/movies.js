const { app } = require("../index");
const main_func = require("../core/main_func")
const Config = require("../../config")
const filesdb = require("../core/mongo/filesdb");

const movieCache = new Map();

// -------------------------------- Text Filter -------------------------------- //

app.use(async (ctx, next) => {
    if (ctx.chat?.type !== "private" && ctx.message?.text && !ctx.message.text.startsWith("/")) {
        const query = ctx.message.text.toLowerCase().trim();
        if (!query) return next();
        const movies = await filesdb.searchFiles(query);

        if (!movies.length) {
            const sent = await ctx.replyWithPhoto(
                "https://media.animerealms.org/image/AgACAgUAAx0EboWBewAC96xqLjy8VXdUO0kIphSqqbakMtCXmQACxhBrG57EcVVb2LUYbJ7MrgEAAwIAA3gAAzwE",
                {
                    caption: `🔍 **No Results Found**

● Try searching with the exact title.
● The content may not be available in our database yet.
● Remove special characters or extra words and try again.`,
                    parse_mode: "Markdown",
                    reply_markup: {inline_keyboard: [[{text: "☎️ Request Here", url: Config.CHANNEL_URL}]]}
                }
            );
            await main_func.autoDelete(ctx, sent);
            return next();
        }
        const sent = await sendMoviePage(ctx, movies, 0);
        await main_func.autoDelete(ctx, sent);
    }
    return next();
});

// -------------------------------- Send Movie Func -------------------------------- //

async function sendMoviePage(ctx, movies, page = 0) {
    movieCache.set(ctx.from.id, movies);
    const query = ctx.message.text.charAt(0).toUpperCase() + ctx.message.text.slice(1).toLowerCase();
    return ctx.replyWithPhoto(
        "https://media.animerealms.org/image/AgACAgUAAx0EboWBewAC96xqLjy8VXdUO0kIphSqqbakMtCXmQACxhBrG57EcVVb2LUYbJ7MrgEAAwIAA3gAAzwE",
        {
            caption: `
🔎 **Query:** ${query} ⁽Found:** ${movies.length}⁾
📝 **Pages:** ${Math.ceil(movies.length / 8)}

⊚ This message will be automatically deleted in **2 minutes** for content security and copyright compliance.
            `,
            parse_mode: "Markdown",
            reply_markup: (await main_func.getKeyboard(ctx, movies, page)).reply_markup
        }
    );
}

// -------------------------------- Callback Action -------------------------------- //

app.action(/^movie_(?:next|prev)_(\d+)_(\d+)$/, async (ctx) => {
    const clicked = Number(ctx.from.id);
    const page = Number(ctx.match[1]);
    const auth_id = Number(ctx.match[2]);

    if (clicked !== auth_id) {
        return ctx.answerCbQuery("This is not for you!!", {show_alert: true});
    }
    const movies = movieCache.get(auth_id);
    if (!movies) {return ctx.answerCbQuery("Expired");}
    await ctx.editMessageReplyMarkup((await main_func.getKeyboard(ctx, movies, page)).reply_markup);
    await ctx.answerCbQuery();
});

app.action("movie_nomore", async (ctx) => {
    await ctx.answerCbQuery("No More Pages");
});
