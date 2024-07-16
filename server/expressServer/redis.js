const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
require("dotenv").config();

const RedisClient = createClient({
	url: `redis://localhost:${process.env.REDISPORT}`
});
RedisClient.connect();

RedisClient.on("connect", () => {
	console.log("Connected to Redis");
});
RedisClient.on("error", (err) => {
	console.error(
		"Redis not running or error with connection on port",
		process.env.REDISPORT
	);
	throw err;
});
RedisClient.on("disconnect", () => {
	console.error("Redis disconnect");
});
class RedisJsonStore extends RedisStore {
	constructor(options = {}) {
		super(options);
	}

	async get(sid, cb) {
		try {
			const sessionData = await RedisJsonGet(`sess:${sid}`);
			cb(null, sessionData);
		} catch (err) {
			cb(err);
		}
	}

	async set(sid, sessionData, cb) {
		try {
			await RedisJsonSet(`sess:${sid}`, ".", sessionData);
			cb(null);
		} catch (err) {
			cb(err);
		}
	}

	async destroy(sid, cb) {
		try {
			await RedisJsonDel(`sess:${sid}`);
			cb(null);
		} catch (err) {
			cb(err);
		}
	}
}

const RedisJsonGet = RedisClient.json.get.bind(RedisClient.json);
const RedisJsonSet = RedisClient.json.set.bind(RedisClient.json);
const RedisJsonDel = RedisClient.json.del.bind(RedisClient.json);

const sessionWriting = new Map();

const store = new RedisJsonStore({ client: RedisClient });

async function getSession(sessionID) {
	return await RedisJsonGet(`sess:${sessionID}`);
}

const changingsessions = new Map();

async function updateSession(sessionID, data) {
	changingsessions.set(sessionID, 1);
	await RedisJsonSet(`sess:${sessionID}`, ".", data);
	changingsessions.delete(sessionID);
}

async function setSession(sessionID, key, data) {
	// console.warn(`Started: ${key} -> ${data}`);
	changingsessions.set(sessionID, 1);
	await RedisJsonSet(`sess:${sessionID}`, `.${key}`, data);
	changingsessions.delete(sessionID);
	// console.log(`Finished: ${key} -> ${data}`);
}

async function setSessiondouble(sessionID, keys, data) {
	// console.warn(`Started: ${keys} -> ${data}`);
	changingsessions.set(sessionID, 1);
	await RedisJsonSet(`sess:${sessionID}`, `.${keys[0]}`, data[0]);
	await RedisJsonSet(`sess:${sessionID}`, `.${keys[1]}`, data[1]);
	changingsessions.delete(sessionID);
	// console.log(`Finished: ${keys} -> ${data}`);
}

module.exports = {
	store,
	getSession,
	updateSession,
	setSession,
	setSessiondouble,
	changingsessions
};
