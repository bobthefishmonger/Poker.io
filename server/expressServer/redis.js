const RedisStore  = require("connect-redis").default;
const {createClient} = require("redis");
const RedisClient = createClient({
    url: "redis://localhost:6379"
}) 
RedisClient.connect();
RedisClient.on("connect", () => {
    console.log("Connected to Redis");
});
RedisClient.on("error", (err) => {
    console.error("Redis connection error:", err);
});
RedisClient.on("disconnect", () => {
    console.error("Redis disconnect");
});
const store = new RedisStore({client: RedisClient});
module.exports = {
    store,
    RedisClient
}