const { storage_data } = require("./mongo");

const connection_db = storage_data.collection("Connection_DB");

// --------------------------------------- Add Channel --------------------------------------- //

async function addChannel(channel_id) {
    return await connection_db.updateOne(
        { _id: channel_id },
        { $set: { _id: channel_id } },
        { upsert: true }
    );
}

// --------------------------------------- GetChannel --------------------------------------- //

async function getChannel(channel_id) {
    return await connection_db.findOne({
        _id: channel_id
    });
}

// --------------------------------------- Remove Channel --------------------------------------- //

async function removeChannel(channel_id) {
    return await connection_db.deleteOne({
        _id: channel_id
    });
}

// --------------------------------------- Get All Channels --------------------------------------- //

async function getAllChannels() {
    return await connection_db.find({}).toArray();
}

async function getChannelCount() {
    return connection_db.countDocuments();
}

// --------------------------------------- Remove All Channels --------------------------------------- //

async function removeAllChannels() {
    return await connection_db.deleteMany({});
}

// --------------------------------------- Get All Channels Files --------------------------------------- //

async function getChannelIds() {
    const ids = [];
    const cursor = connection_db.find(
        {},
        { projection: { _id: 1 } }
    );
    for await (const doc of cursor) {
        ids.push(doc._id);
    }
    return ids;
}

module.exports = {
    addChannel,
    getChannel,
    removeChannel,
    getAllChannels,
    removeAllChannels,
    getChannelIds,
    getChannelCount
};
