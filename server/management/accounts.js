const db = require("./dbmanager.js");
const argon2 = require("argon2");
const cookies = require("./cookies.js");
const RedisClient = require("../expressServer/redis.js");

const activeaccounts = {};

async function accountisactive(uname) {
	if (!activeaccounts[uname]) return false;
	return (await RedisClient.getSession(activeaccounts[uname])).isOnline;
}

function check_password(password) {
	const chars = Array.from(password);
	if (!password) {
		throw Error("Password cannot be empty");
	} else if (password.length < 8) {
		throw Error("Password must be at least 8 letters");
	} else if (!chars.some((char) => /[A-Z]/.test(char))) {
		throw Error("Password must contain at least 1 uppercase character");
	} else if (!chars.some((char) => /[a-z]/.test(char))) {
		throw Error("Password must contain at least 1 lowercase character");
	} else if (!chars.some((char) => !isNaN(char) && char !== " ")) {
		throw Error("Password must contain at least 1 number");
	} else if (!chars.some((char) => /[!@#$%^&*(),.?":{}|<>]/.test(char))) {
		throw Error("Password must contain at least 1 special character");
	}
}

async function writeSignUp(
	SessionInfo,
	Username,
	Password,
	IP,
	Stayloggedin,
	Theme,
	ImagePath
) {
	return new Promise(async (resolve, reject) => {
		try {
			if (await db.usernameinuse(Username)) {
				reject("Username in use");
			} else {
				Password = await argon2.hash(Password);
				const PK = await db.createAccount(
					Username,
					Password,
					IP,
					SessionInfo,
					Stayloggedin,
					Theme,
					ImagePath
				);
				resolve(PK);
			}
		} catch (err) {
			reject(err);
		}
	});
}

async function signUpUser(
	req,
	sessionInfo,
	username,
	password,
	ip,
	stayLoggedIn,
	theme,
	imagePath
) {
	try {
		if (!username) {
			throw Error("Username cannot be empty");
		}
		check_password(password);
		const accountID = await writeSignUp(
			sessionInfo,
			username,
			password,
			ip,
			stayLoggedIn,
			theme,
			imagePath
		);
		const accountinfo = {
			LoggedIn: true,
			AccountID: accountID,
			Username: username,
			Visuals: {
				Theme: theme,
				AccountImage: imagePath
			},
			Earnings: {
				Poker: 0,
				Blackjack: 0,
				Roulette: 0
			}
		};
		req.session.AccountInfo = accountinfo;
		activeaccounts[username] = req.sessionID;
	} catch (error) {
		throw error;
	}
}

async function logInUser(req, SessionInfo, Username, Password, Stayloggedin) {
	if (await accountisactive(Username))
		throw Error("This account is currently online");
	const AccountID = await db.validateUsername(Username, Password);
	if (!(await db.validIP(AccountID, req.clientIP))) {
		await db.updateIPtable(AccountID, req.clientIP);
	}
	await db.updateSessionTable(AccountID, SessionInfo, Stayloggedin);
	const visualsandearnings = await db.getVisualsandEarnings(AccountID);

	const accountinfo = {
		LoggedIn: true,
		AccountID: AccountID,
		Username: Username,
		Visuals: {
			Theme: visualsandearnings.Theme,
			AccountImage: visualsandearnings.ImagePath
		},
		Earnings: {
			Poker: visualsandearnings.PokerEarnings,
			Blackjack: visualsandearnings.BlackjackEarnings,
			Roulette: visualsandearnings.RouletteEarnings
		}
	};
	req.session.AccountInfo = accountinfo;
	activeaccounts[Username] = req.sessionID;
}

async function logInAuto(req, res) {
	let SessionInfo = await cookies.validateSessionInfocookie(req, res);
	if (!SessionInfo[1][0]) {
		SessionInfo = SessionInfo[0];
		req.session.SessionInfo = SessionInfo;
		req.session.AccountInfo = { LoggedIn: false };
		return "Should not be logged in";
	} else {
		try {
			const AccountID = SessionInfo[1][1].AccountID;
			SessionInfo = SessionInfo[0];
			req.session.SessionInfo = SessionInfo;
			if (db.validIP(AccountID, req.clientIP)) {
				const Username = (await db.getUsername(AccountID)).Username;
				if (await accountisactive(Username))
					return "Should not be logged in";
				const visualsandearnings = await db.getVisualsandEarnings(
					AccountID
				);
				const accountinfo = {
					LoggedIn: true,
					AccountID: AccountID,
					Username: Username,
					Visuals: {
						Theme: visualsandearnings.Theme,
						AccountImage: visualsandearnings.ImagePath
					},
					Earnings: {
						Poker: visualsandearnings.PokerEarnings,
						Blackjack: visualsandearnings.BlackjackEarnings,
						Roulette: visualsandearnings.RouletteEarnings
					}
				};
				req.session.AccountInfo = accountinfo;
				activeaccounts[Username] = req.sessionID;
				return "logged_in";
			} else {
				req.session.AccountInfo = { LoggedIn: false };
				return "New IP, has to relog in";
			}
		} catch (err) {
			return "Error";
		}
	}
}

module.exports = {
	signUpUser,
	logInUser,
	logInAuto
};
