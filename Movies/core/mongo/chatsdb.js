const { storage_data } = require("./mongo");

const chatsdb = storage_data.collection("Chats_DB");

// --------------------------------------- Ensure Indexes --------------------------------------- //

async function ensureIndexes() {
    await chatsdb.createIndex(
        { chat: 1 },
        { unique: true }
    );
}

// --------------------------------------- Get All Chats --------------------------------------- //

async function getAllChats() {
    const chats = await chatsdb
        .find(
            { chat: { $gt: 0 } },
            { projection: { _id: 0, chat: 1 } }
        )
        .toArray();
    return chats.map(doc => doc.chat);
}

async function getChatsCount() {
    return chatsdb.countDocuments({
        chat: { $gt: 0 }
    });
}

// --------------------------------------- Check Chat Exists --------------------------------------- //

async function isChatExist(chat) {
    return Boolean(await chatsdb.findOne({ chat }));
}

// --------------------------------------- Add Chat --------------------------------------- //

async function addChat(chat) {
    await chatsdb.updateOne(
        { chat },
        {
            $setOnInsert: {chat}
        },
        {
            upsert: true
        }
    );
}

// --------------------------------------- Delete Chat --------------------------------------- //

async function delChat(chat) {
    await chatsdb.deleteOne({ chat });
}


module.exports = {
    ensureIndexes,
    getAllChats,
    isChatExist,
    addChat,
    delChat,
    getChatsCount
};
