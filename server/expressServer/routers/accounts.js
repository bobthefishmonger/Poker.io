const express = require("express");
const path = require("path");
const router = express.Router();
const accounts = require("../../management/accounts.js");
const multer = require("multer");
const cookies = require("../../management/cookies.js");
const db = require("../../management/dbmanager.js");
const fs = require("fs");
const RedisClient = require("redisjson-express-session-store");
const crypto = require("crypto");
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, "..", "..", "database", "uploads"));
	},
	filename: (req, file, cb) => {
		cb(
			null,
			req.session.AccountInfo.AccountID + path.extname(file.originalname)
		);
	}
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		if (!file.mimetype.startsWith("image/")) {
			return cb(new Error("Not image"), false);
		}
		cb(null, true);
	}
});

function sendhtml(res, file) {
	res.sendFile(
		path.join(__dirname, "..", "..", "..", "app", "client", `${file}.html`)
	);
}

router.get("/", (req, res) => {
	if (!req.session.AccountInfo.LoggedIn) {
		req.session.redirectNote = "Cannot access account while not logged in";
		res.redirect("/account/login");
	} else {
		sendhtml(res, "account");
	}
});

router.get("/login", (req, res) => {
	if (req.session.AccountInfo.LoggedIn) {
		req.session.redirectNote = "Already logged in";
		res.redirect("/account");
	} else {
		req.session.redirect = req.query.redirect || "/";
		sendhtml(res, "login");
	}
});

router.post("/login", async (req, res) => {
	if (req.session.AccountInfo.LoggedIn) {
		req.session.redirectNote = "Already logged in";
		res.redirect("/account");
	} else {
		let { username, password, stayLoggedIn } = req.body;
		const sessionInfo = req.session.SessionInfo;
		if (stayLoggedIn) {
			stayLoggedIn = 1;
		} else {
			stayLoggedIn = 0;
		}
		try {
			await accounts.logInUser(
				req,
				sessionInfo,
				username,
				password,
				stayLoggedIn
			);
			res.json({ success: true, redirect: req.session.redirect || "/" });
		} catch (error) {
			if (error.message) {
				res.json({ success: false, message: error.message });
			} else {
				res.json({ success: false, message: error });
			}
		}
	}
});

router.get("/signup", (req, res) => {
	if (req.session.AccountInfo.LoggedIn) {
		req.session.redirectNote = "Already logged in";
		res.redirect("/account");
	} else {
		req.session.redirect = req.query.redirect || "/";
		sendhtml(res, "signup");
	}
});

router.post("/signup", async (req, res) => {
	if (req.session.AccountInfo.LoggedIn) {
		req.session.redirectNote = "Already logged in";
		res.redirect("/account");
	} else {
		let { username, password, stayLoggedIn, theme, imagePath } = req.body;
		const ip = req.clientIP;
		const sessionInfo = req.session.SessionInfo;
		if (stayLoggedIn) {
			stayLoggedIn = 1;
		} else {
			stayLoggedIn = 0;
		}
		try {
			await accounts.signUpUser(
				req,
				sessionInfo,
				username,
				password,
				ip,
				stayLoggedIn,
				theme,
				imagePath
			);
			res.json({ success: true, redirect: req.session.redirect });
		} catch (error) {
			if (error.message) {
				res.json({ success: false, message: error.message });
			} else {
				res.json({ success: false, message: error });
			}
		}
	}
});

router.post("/logout", async (req, res) => {
	if (req.session.ingame) {
		req.session.redirectNote = "You cannot log out whilst in a game";
		res.redirect("/home");
	} else {
		try {
			req.session.AccountInfo = { LoggedIn: false };
			req.session.SessionInfo = cookies.resetSessionInfoCookie(res, req);
			res.clearCookie("DisplayInformation");
			await RedisClient.setSession(req.sessionID, "ingame", false);
			res.json({ success: true, redirect: "/home" });
		} catch {
			res.json({ success: false });
		}
	}
});

router.get("/missingaccount", (req, res) => {
	sendhtml(res, "missingPA");
});

const uploadfile = (req, res, next) => {
	upload.single("file")(req, res, async (err) => {
		if (err || !req.file) {
			res.json({ success: false });
		} else {
			req.session.AccountInfo.Visuals.AccountImage = `${
				req.session.AccountInfo.AccountID
			}${path.extname(req.file.originalname)}`;
			cookies.createDisplayInformationCookie(req, res);
			try {
				await db.updatePreference(
					req.session.AccountInfo.AccountID,
					req.session.AccountInfo.Visuals.Theme,
					req.session.AccountInfo.Visuals.AccountImage
				);
			} catch (err) {
				console.error(err);
			}
			res.json({ success: true });
		}
		next();
	});
};
router.post("/uploadimage", uploadfile, (req, res) => {});

router.post("/updatetheme", async (req, res) => {
	try {
		const theme = req.body.theme;
		if (theme === "Default" || theme === "Light") {
			req.session.AccountInfo.Visuals.Theme = theme;
			cookies.createDisplayInformationCookie(req, res);
			try {
				await db.updatePreference(
					req.session.AccountInfo.AccountID,
					req.session.AccountInfo.Visuals.Theme,
					req.session.AccountInfo.Visuals.AccountImage
				);
				res.json({ success: true });
			} catch (err) {
				console.error(err);
			}
		} else {
			res.json({ success: false });
		}
	} catch {
		res.json({ success: false });
	}
});

router.get("/:AccountID", async (req, res) => {
	try {
		const AccountID = req.params.AccountID;
		const dbData = await db.getPublicInfo(AccountID);
		const htmlFilePath = path.join(
			__dirname,
			"..",
			"..",
			"..",
			"app",
			"client",
			"publicaccount.html"
		);
		let data = fs.readFileSync(htmlFilePath, "utf8");
		let newFile = data.replace("{{Username}}", dbData.Username);
		newFile = newFile.replace("{{imagePath}}", dbData.ImagePath);
		newFile = newFile.replace("{{pokerEarnings}}", dbData.PokerEarnings);
		newFile = newFile.replace(
			"{{blackjackEarnings}}",
			dbData.BlackjackEarnings
		);
		newFile = newFile.replace(
			"{{rouletteEarnings}}",
			dbData.RouletteEarnings
		);
		res.send(newFile);
	} catch (err) {
		if (err === "No Account Found") {
			res.redirect(
				`/account/missingaccount?account=${req.params.AccountID}`
			);
		} else {
			console.error(err);
			res.redirect("back");
		}
	}
});

router.post("/deleteaccount", (req, res) => {
	if (!req.session.AccountInfo.LoggedIn) {
		req.session.redirectNote = "Not logged in";
		res.redirect("/account/login");
	} else if (req.session.ingame) {
		res.send({
			success: false,
			message: "You cannot delete an account whilst playing a game"
		});
	} else {
		const key = crypto.randomUUID();
		req.session.deletekey = key;
		req.session.candelete = false;
		res.send({
			success: true,
			redirect: `/account/deleteaccount/verify/${key}/`
		});
	}
});

router.get("/deleteaccount/verify/:key", async (req, res) => {
	if (
		!req.params.key ||
		!req.session.deletekey ||
		req.params.key !== req.session.deletekey ||
		req.session.candelete
	) {
		res.redirect("/account");
	} else {
		await RedisClient.setSession(req.sessionID, "candelete", true);
		req.session.reload(() => {
			sendhtml(res, "deleteverify");
		});
	}
});

router.post("/deleteaccount/verify/submit", async (req, res) => {
	const { username, password, key } = req.body;
	await accounts.deleteAccount(req, res, username, password, key);
});

module.exports = router;
