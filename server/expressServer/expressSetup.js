const session = require("express-session");
const nocache = require("nocache");
const cookieParser = require("cookie-parser");
const bodyparser = require("body-parser");

const homerouter = require("./routers/home.js");
const gamesrouter = require("./routers/games.js");
const accountrouter = require("./routers/accounts.js");
const uploadrouter = require("./routers/uploads.js");

const accounts = require("../management/accounts.js");
const cookies = require("../management/cookies.js");
const db = require("../management/dbmanager.js");

const RedisClient = require("redisjson-express-session-store");

const crypto = require("crypto");
const path = require("path");
require("dotenv").config();

RedisClient.setClient(null, {
	url: `redis://localhost:${process.env.REDISPORT}`
});

const sessionmiddleware = session({
	store: RedisClient.createJSONStore(),
	secret: crypto.randomBytes(32).toString("hex"),
	resave: false,
	saveUninitialized: true
});

const changeurl = (req, res, next) => {
	if (req.url.at(-1) !== "/" && req.method === "GET") {
		res.redirect(`${req.url}/`);
	} else {
		next();
	}
};

const changeip = (req, res, next) => {
	let ip = req.ip;
	if (ip.startsWith("::ffff:")) {
		ip = ip.replace("::ffff:", "");
	}
	if (ip === "::1") {
		ip = "127.0.0.1";
	}
	req.clientIP = ip;
	next();
};

const awaitchanges = async (req, res, next) => {
	try {
		await RedisClient.inactiveSession(req.session);
		req.session.reload(() => {
			next();
		});
	} catch {
		console.warn("Request timed out.");
		const timeouterror = new Error("Timed Out Request");
		timeouterror.status = 408;
		next(timeouterror);
	}
};

const setsessioninfo = async (req, res, next) => {
	if (!req.session.AccountInfo) {
		await accounts.logInAuto(req, res);
	} else {
		try {
			const account = await db.checkSessionInfo(req.session.SessionInfo);
			if (!account) {
				req.session.AccountInfo = { LoggedIn: false };
			} else {
				if (account.AccountID !== req.session.AccountInfo.AccountID) {
					req.session.AccountInfo = { LoggedIn: false };
				}
			}
		} catch (e) {
			console.log("error", e.message);
		}
	}
	if (!req.session.socketids) {
		req.session.socketids = {
			poker_socket: null,
			blackjack_socket: null,
			roulette_socket: null,
			socket: null
		};
	}
	next();
};

const setDisplayInformation = async (req, res, next) => {
	cookies.createDisplayInformationCookie(req, res);
	next();
};

const setonline = async (req, res, next) => {
	try {
		if (req.session.AccountInfo.LoggedIn) req.session.isOnline = true;
	} catch {}
	next();
};

function expressSetup(express, app) {
	app.use(nocache());
	app.use(express.static(path.join(__dirname, "..", "..", "app", "public")));
	app.use("/uploads", uploadrouter);
	app.use(changeurl);
	app.use(changeip);
	app.use(sessionmiddleware);
	app.use(awaitchanges);
	app.use(cookieParser());
	app.use(setsessioninfo);
	app.use(setDisplayInformation);
	app.use(setonline);
	app.use(bodyparser.json());
	app.use("/", homerouter);
	app.use("/games", gamesrouter);
	app.use("/account", accountrouter);
	app.get("/robots.txt", (req, res) => {
		res.sendFile(path.join(__dirname, "..", "..", "app", "robots.txt"));
	});
	app.get("*", (req, res) => {
		res.redirect("/404error");
	});
	return sessionmiddleware;
}

module.exports = {
	expressSetup
};
