const { MongoClient } = require("mongodb");
const Config = require("../../../config")

const client = new MongoClient(Config.MONGO_DB, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
});

async function connectWithRetry(retries = 3, delay = 3000) {
    for (let i = 1; i <= retries; i++) {
        try {
            await client.connect();
            console.log("MongoDB Connected");
            return;
        } catch (err) {
            console.error(`MongoDB Connection Error (attempt ${i}/${retries}):`, err.message);
            if (i < retries) {
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    console.error("MongoDB: All connection retries failed");
}

connectWithRetry();

storage_data = client.db("telegram_database");


module.exports = { storage_data };
