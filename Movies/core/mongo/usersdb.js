const { storage_data } = require("./mongo");

const usersdb = storage_data.collection("Users_DB");


// --------------------------------------- Ensure Indexes --------------------------------------- //

async function ensureIndexes() {
    await usersdb.createIndex(
        { user: 1 },
        { unique: true }
    );
}


// --------------------------------------- Get All Users --------------------------------------- //

async function getAllUsers() {
    const users = await usersdb
        .find(
            { user: { $gt: 0 } },
            { projection: { _id: 0, user: 1 } }
        )
        .toArray();

    return users.map(doc => doc.user);
}

async function getUsersCount() {
    return usersdb.countDocuments({
        user: { $gt: 0 }
    });
}

// --------------------------------------- Check Users Exists --------------------------------------- //

async function isUserExist(user) {
    return Boolean(
        await usersdb.findOne({ user })
    );
}

// --------------------------------------- Add Users --------------------------------------- //

async function addUser(user) {
    await usersdb.updateOne(
        { user },
        {
            $setOnInsert: {user}
        },
        {
            upsert: true
        }
    );
}


// --------------------------------------- Delete Users --------------------------------------- //
async function delUser(user) {
    await usersdb.deleteOne({ user });
}


module.exports = {
    ensureIndexes,
    getAllUsers,
    isUserExist,
    addUser,
    delUser,
    getUsersCount
};
