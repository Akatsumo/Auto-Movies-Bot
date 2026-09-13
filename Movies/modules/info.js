const {app} = require("../index");


async function getUser_ProfilePic(ctx, userId) {
  const { total_count, photos } = await ctx.telegram.getUserProfilePhotos(userId);
  return total_count > 0 ? photos[0][2].file_id : '';
}

const replyMarkup = {
  inline_keyboard: [
    [{ text: "Delete", callback_data: "delete_me" }]
  ]
};

// --------------------------- INFO --------------------------- //

app.command("info", async (ctx) => {
  try {
    const targetUser = ctx.message.reply_to_message ? ctx.message.reply_to_message.from : ctx.message.from;
    const userProfilePic = await getUser_ProfilePic(ctx, targetUser.id);
    const caption = `Name: ${targetUser.first_name}\nUser ID: <code>${targetUser.id}</code>\nMention: <a href="tg://user?id=${targetUser.id}">${targetUser.first_name}</a>`;

    let responseOptions = {
      parse_mode: "HTML",
      reply_to_message_id: ctx.message.message_id,
      reply_markup: replyMarkup
    };

    if (targetUser.id === 7085444748) {
      responseOptions.caption = `${caption}\n\nHe is my Founder`;
    } else if (targetUser.is_bot) {
      responseOptions.caption = `${caption}\n\n${targetUser.first_name} is a bot.`;
    } else if (userProfilePic) {
      responseOptions.caption = caption;
      responseOptions.photo = userProfilePic;
    }

    await ctx.replyWithPhoto(userProfilePic, responseOptions);
  } catch (error) {
    console.log(error);
  }
});

// --------------------------- DELETE CALLBACK --------------------------- //

app.action('delete_me', async (ctx) => {
  try {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);

    if (ctx.callbackQuery.message.reply_to_message) {
      await ctx.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.reply_to_message.message_id);
    }
  } catch (error) {
    console.log('Error deleting message:', error);
  }
});