const express = require("express");
const path = require("path");
const router = express.Router();
const poker_rooms = require("../../games/poker/rooms.js");
const poker_game = require("../../games/poker/game.js");
const RedisClient = require("redisjson-express-session-store");

function sendhtml(res, file) {
	res.sendFile(path.join(__dirname, "..", "..", "..", "app", `${file}.html`));
}

router.get("/", async (req, res) => {
	sendhtml(res, "gamelist");
});

router.get("/poker", async (req, res) => {
	if (!req.session.AccountInfo.LoggedIn) {
		req.session.redirectNote =
			"You cannot access Poker whilst not logged in";
		res.redirect("/account/login?redirect=/games/poker");
	} else {
		sendhtml(res, "poker");
	}
});

router.post("/poker/createroom", async (req, res) => {
	if (!req.session.AccountInfo.LoggedIn) {
		res.json({
			success: false,
			errormessage: "You cannot access Poker whilst not logged in",
			redirect: "/account/login?redirect=/games/poker"
		});
	} else if (req.session.ingame) {
		res.json({
			success: false,
			errormessage: "You cannot access multiple games at once"
		});
	} else {
		poker_rooms.createRoom(req, res);
	}
});

router.post("/poker/joinroom", async (req, res) => {
	const { roomID } = req.body;
	if (req.session.ingame) {
		req.session.redirectNote = "You cannot access multiple games at once";
		res.redirect("/games/poker");
	} else {
		if (!req.session.AccountInfo.LoggedIn) {
			req.session.redirectNote =
				"You cannot access Poker whilst not logged in";
			res.redirect(`/account/login?redirect=/games/poker/${roomID}`);
		} else {
			if (!(await poker_rooms.rejoin(req, res))) {
				await poker_rooms.checkroomID(req, res, roomID);
			}
		}
	}
});

router.post("/poker/publicrooms", (req, res) => {
	poker_rooms.showpublicrooms(req, res);
});

router.post("/poker/kickplayer", (req, res) => {
	let { Username } = req.body;
	poker_rooms.removeplayer(req, res, Username, "Kicked");
});

router.post("/poker/banplayer", (req, res) => {
	let { Username } = req.body;
	poker_rooms.removeplayer(req, res, Username, "Banned");
});

router.post("/poker/startgame", (req, res) => {
	poker_game.startgame(req, res);
});

router.get("/poker/:roomID", async (req, res) => {
	if (req.session.ingame) {
		req.session.redirectNote = "You cannot access multiple games at once";
		res.redirect("/games/poker");
	} else {
		if (!req.session.AccountInfo.LoggedIn) {
			req.session.redirectNote =
				"You cannot access Poker whilst not logged in";
			res.redirect(
				`/account/login?redirect=/games/poker/${req.params.roomID}`
			);
		} else {
			sendhtml(res, "pokergame");
		}
	}
});

router.get("/blackjack", async (req, res) => {
	if (!req.session.AccountInfo.LoggedIn) {
		req.session.redirectNote =
			"You cannot access Blackjack whilst not logged in";
		res.redirect("/account/login?redirect=/games/blackjack");
	} else {
		req.session.redirect = req.query.redirect || "/";
		sendhtml(res, "blackjack");
	}
});
router.get("/roulette", async (req, res) => {
	if (!req.session.AccountInfo.LoggedIn) {
		req.session.redirectNote =
			"You cannot access Roulette whilst not logged in";
		res.redirect("/account/login?redirect=/games/roulette");
	} else {
		req.session.redirect = req.query.redirect || "/";
		sendhtml(res, "roulette");
	}
});

module.exports = router;
