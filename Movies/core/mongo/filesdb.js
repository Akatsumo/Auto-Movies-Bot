const { storage_data } = require("./mongo");

const file_db = storage_data.collection("Files_DB");

// --------------------------------------- Ensure Indexes --------------------------------------- //

async function ensureIndexes() {
    await file_db.createIndex({ file_name: "text" }).catch(() => {});
    await file_db.createIndex({ file_name: 1 }).catch(() => {});
}

// --------------------------------------- Add File --------------------------------------- //

async function addFile(chat_id, msg_id, file_name, file_size) {
    return await file_db.insertOne({
        chat_id,
        msg_id,
        file_name,
        file_size
    });
}

// --------------------------------------- Remove File --------------------------------------- //

async function removeFile(chat_id, msg_id) {
    return await file_db.deleteOne({
        chat_id,
        msg_id
    });
}

// --------------------------------------- Remove All Files of Channel --------------------------------------- //

async function removeChannelFiles(chat_id) {
    return await file_db.deleteMany({
        chat_id
    });
}

// --------------------------------------- Remove All Files --------------------------------------- //

async function removeAllFiles() {
    return await file_db.deleteMany({});
}

// --------------------------------------- Get All Files --------------------------------------- //

async function getAllFiles() {
    return await file_db.find({}).toArray();
}

// --------------------------------------- Search Files --------------------------------------- //

async function searchFiles(query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return await file_db.find({
        file_name: { $regex: escaped, $options: "i" }
    }).toArray();
}

async function getFilesCount() {
    return file_db.countDocuments();
}


module.exports = {
    addFile,
    removeFile,
    removeChannelFiles,
    removeAllFiles,
    getAllFiles,
    searchFiles,
    ensureIndexes,
    getFilesCount
};
