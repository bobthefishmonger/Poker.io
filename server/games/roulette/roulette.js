const RedisClient = require("redisjson-express-session-store");
const lookup = require("./indexlookup.js");
const { updateRouletteEarnings } = require("../../management/dbmanager.js");
let RouletteIO;

const maxbet = 5000; // ! Do we want this to change
const minbet = 50;
const degreespersquare = 360 / 37;

const payment = {
	line: 5,
	cornerBet: 8,
	street: 11,
	split: 17,
	straightUp: 35,
	column: 2,
	dozen: 2,
	evenMoney: 1
};

function setRouletteIO(IO) {
	RouletteIO = IO;
}

function validbets(bets, betsquares) {
	try {
		if (!betsquares) return false;
		bets = Object.values(bets).map((bet) => Number(bet));

		if (
			!bets.every((bet) => {
				if (isNaN(bet) || bet < minbet) {
					return false;
				}
				return true;
			})
		) {
			return false;
		}
		const totalBet = bets.reduce((a, bet) => a + bet, 0);
		if (totalBet > maxbet) {
			return false;
		}
		return betsquares.every((square) => {
			if (isNaN(square[1])) return false;
			if (!lookup.maxIndex[square[0]]) return false;
			square[1] = Number(square[1]);
			return !(square[1] > lookup.maxIndex[square[0]] || square[1] < 0);
		});
	} catch (e) {
		console.warn(e);
		return false;
	}
}

function spindegrees(min = 1080, max = 3600) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
function getsquare(degrees) {
	const rotations = Math.floor(degrees / 360);
	const finalrotation = degrees - rotations * 360;
	const squarespassed = Math.round(finalrotation / degreespersquare);
	const square = lookup.squares[squarespassed];
	return square;
}
function evalwinnings(betsquares, bets, square) {
	const acceptedbets = {
		line: {},
		cornerBet: {},
		street: {},
		split: {},
		straightUp: {},
		column: {},
		dozen: {},
		evenMoney: {}
	};
	const lostbets = [];
	betsquares.forEach((betsquare) => {
		if (lookup.indexes[betsquare[0]][betsquare[1]].includes(square)) {
			acceptedbets[betsquare[0]][betsquare[1]] =
				bets[`${betsquare[0]}:${betsquare[1]}`];
		} else {
			lostbets.push(`${betsquare[0]}:${betsquare[1]}`);
		}
	});
	const lost = lostbets.reduce((a, b) => {
		return a + Number(bets[b]);
	}, 0);
	let winnings = Object.keys(acceptedbets).reduce((total, key) => {
		return (
			total +
			Object.values(acceptedbets[key]).reduce((a, b) => a + b, 0) *
				payment[key]
		);
	}, 0);
	winnings -= lost;
	return [acceptedbets, winnings];
}
async function handlespin(req, res, bets) {
	if (req.get("referer").slice(-9) !== "roulette/") {
		res.json({ success: false, errormessage: "Not on the page" });
		return;
	}
	let betsquares;
	// todo: check that not bet too much
	try {
		betsquares = Object.keys(bets);
		if (!betsquares[0]) {
			res.json({ success: false, errormessage: "Empty bets" });
			return;
		}
	} catch {
		res.json({ success: false, errormessage: "Incorrect format" });
		return;
	}
	if (!betsquares) {
		res.json({ success: false, errormessage: "Empty bets" });
		return;
	}
	betsquares = betsquares.map((square) => square.split(":"));
	if (!validbets(bets, betsquares)) {
		res.json({ success: false, errormessage: "Invalid Bets" });
		return;
	}
	const degree = spindegrees();
	const square = getsquare(degree);
	const winnings = evalwinnings(betsquares, bets, square);
	const session = await RedisClient.getSession(req.sessionID);
	await RedisClient.setSession(
		req.sessionID,
		"AccountInfo.Earnings.Roulette",
		session.AccountInfo.Earnings.Roulette + winnings[1]
	);
	updateRouletteEarnings(
		session.AccountInfo.AccountID,
		session.AccountInfo.Earnings.Roulette + winnings[1]
	);
	// !Edit DB
	res.json({
		success: true,
		degree: degree,
		square: square,
		winnings: winnings
	});
	return;
}

module.exports = {
	setRouletteIO,
	handlespin
};
