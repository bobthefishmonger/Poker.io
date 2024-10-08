const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const argon2 = require("argon2");
//Utils
function dbconnection() {
	return new sqlite3.Database(
		path.join(__dirname, "..", "database", "accounts.db"),
		(err) => {
			if (err) {
				return console.error(err.message);
			}
		}
	);
}

function dbclose(db) {
	db.close((err) => {
		if (err) {
			return console.error(err.message);
		}
	});
}

//SignUp
async function usernameinuse(username) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.get(
			`SELECT AccountID FROM tblAccounts WHERE Username = ?`,
			[username],
			(err, row) => {
				if (err) {
					console.error(err.message);
					reject(err.message);
				}
				if (!row) {
					resolve(false);
				} else {
					resolve(true);
				}
				dbclose(db);
			}
		);
	});
}

async function createAccountData(db, Username, Password) {
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO tblAccounts(Username, Password) VALUES(?,?)`,
			[Username, Password],
			function (err) {
				if (err) {
					reject(err.message);
				} else {
					resolve(this.lastID);
				}
			}
		);
	});
}

async function createEarningsData(db, lastID) {
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO tblEarnings(AccountID, PokerEarnings, BlackjackEarnings, RouletteEarnings) VALUES(?,?,?,?)`,
			[lastID, 0, 0, 0],
			function (err) {
				if (err) {
					reject(err.message);
				} else {
					resolve();
				}
			}
		);
	});
}

async function createPreferencesData(db, lastID, Theme, ImagePath) {
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO tblPreferences(AccountID, Theme, ImagePath) VALUES(?,?,?)`,
			[lastID, Theme, ImagePath],
			function (err) {
				if (err) {
					reject(err.message);
				} else {
					resolve();
				}
			}
		);
	});
}

async function createSessionData(db, SessionInfo, lastID, Stayloggedin) {
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO tblSession(sessionID, AccountID, Stayloggedin, ExpireryDate) VALUES(?,?,?,?)`,
			[
				SessionInfo.DBsessionID,
				lastID,
				Stayloggedin,
				SessionInfo.Expirery
			],
			function (err) {
				if (err) {
					reject(err.message);
				} else {
					resolve();
				}
			}
		);
	});
}

async function createUsedIPsData(db, lastID, IP) {
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO tblUsedIPs(AccountID, IP) VALUES(?,?)`,
			[lastID, IP],
			function (err) {
				if (err) {
					reject(err.message);
				} else {
					resolve();
				}
			}
		);
	});
}

async function createAccount(
	Username,
	Password,
	IP,
	SessionInfo,
	Stayloggedin,
	Theme,
	ImagePath
) {
	const db = dbconnection();
	try {
		await new Promise((resolve, reject) => {
			db.run("BEGIN TRANSACTION", (err) => {
				if (err) reject(err);
				else resolve();
			});
		});
		const lastID = await createAccountData(db, Username, Password);
		await createEarningsData(db, lastID);
		await createPreferencesData(db, lastID, Theme, ImagePath);
		await createSessionData(db, SessionInfo, lastID, Stayloggedin);
		await createUsedIPsData(db, lastID, IP);

		await new Promise((resolve, reject) => {
			db.run("COMMIT", (err) => {
				if (err) reject(err);
				else resolve();
			});
		});

		dbclose(db);
		return lastID;
	} catch (error) {
		await new Promise((resolve, reject) => {
			db.run("ROLLBACK", (err) => {
				if (err) reject(err);
				else resolve();
			});
		});
		dbclose(db);
		throw error;
	}
}

//Login

async function validateUsername(Username, Password) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.get(
			`SELECT AccountID, Password
        FROM tblAccounts
        WHERE Username = ?`,
			[Username],
			async (err, row) => {
				if (err) {
					reject(err.message);
				} else {
					if (!row) {
						reject("Invalid Username");
					} else {
						if (await argon2.verify(row.Password, Password)) {
							resolve(row.AccountID);
						} else {
							reject("Invalid Password");
						}
					}
				}
				dbclose(db);
			}
		);
	});
}

async function updateIPtable(AccountID, IP) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.run(
			`INSERT INTO tblUsedIPs (AccountID, IP)
             VALUES (?, ?)`,
			[AccountID, IP],
			(err) => {
				if (err) {
					reject(err.message);
				} else {
					resolve("IP changed");
				}
				dbclose(db);
			}
		);
	});
}

async function updateSessionTable(AccountID, SessionInfo, Stayloggedin) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.run(
			`UPDATE tblSession
            SET sessionID=?, ExpireryDate=?, Stayloggedin=?
            WHERE AccountID=?`,
			[
				SessionInfo.DBsessionID,
				SessionInfo.Expirery,
				Stayloggedin,
				AccountID
			],
			(err) => {
				if (err) {
					reject(err.message);
				} else {
					resolve("Sessiontable changed");
				}
			}
		);
	});
}

async function getVisualsandEarnings(AccountID) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.get(
			`SELECT tblEarnings.PokerEarnings, tblEarnings.BlackjackEarnings,
            tblEarnings.RouletteEarnings, tblPreferences.Theme, tblPreferences.ImagePath
            FROM tblEarnings
            INNER JOIN tblPreferences ON tblPreferences.AccountID = tblEarnings.AccountID
            WHERE tblEarnings.AccountID = ?`,
			AccountID,
			(err, row) => {
				if (err) {
					reject(err.message);
				} else {
					resolve(row);
				}
				dbclose(db);
			}
		);
	});
}

//Auto Login Only

async function checkSessionInfo(SessionInfo) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.get(
			`SELECT AccountID
            FROM tblSession
            WHERE sessionID = ? AND ExpireryDate = ? AND Stayloggedin = 1`,
			[SessionInfo.DBsessionID, SessionInfo.Expirery],
			(err, row) => {
				if (err) {
					console.error(err.message);
					reject(err.message);
				} else {
					resolve(row);
				}
				dbclose(db);
			}
		);
	});
}

async function updateSessionInfo(oldDBsessionID, SessionInfo) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.run(
			`UPDATE tblSession
            SET sessionID=?, ExpireryDate=?
            WHERE sessionID=?`,
			[SessionInfo.DBsessionID, SessionInfo.Expirery, oldDBsessionID],
			(err) => {
				if (err) {
					reject(err.message);
				} else {
					resolve(true);
				}
				dbclose(db);
			}
		);
	});
}

async function getUsername(AccountID) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.get(
			`SELECT Username
            FROM tblAccounts
            WHERE AccountID = ?`,
			[AccountID],
			(err, row) => {
				if (err) {
					reject(err.message);
				} else {
					resolve(row);
				}
				dbclose(db);
			}
		);
	});
}

async function validIP(AccountID, IP) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.get(
			`SELECT IPID
            FROM tblUsedIPs
            WHERE AccountID=? AND IP=?`,
			[AccountID, IP],
			async (err, row) => {
				if (err) {
					reject(err.message);
				} else {
					if (row) {
						resolve(true);
					} else {
						resolve(false);
					}
				}
				dbclose(db);
			}
		);
	});
}

//preferences

function updatePreference(AccountID, theme, file) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.run(
			`UPDATE tblPreferences
            SET Theme=?,ImagePath=?
            WHERE AccountID=?`,
			[theme, file, AccountID],
			(err) => {
				if (err) {
					reject(err.message);
				} else {
					resolve(true);
				}
				dbclose(db);
			}
		);
	});
}
//Public accounts
function getPublicInfo(AccountID) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.get(
			`SELECT tblAccounts.Username, tblEarnings.PokerEarnings, tblEarnings.BlackjackEarnings,
            tblEarnings.RouletteEarnings, tblPreferences.ImagePath
            FROM tblAccounts
            INNER JOIN tblEarnings ON tblEarnings.AccountID = tblAccounts.AccountID
            INNER JOIN tblPreferences ON tblPreferences.AccountID = tblAccounts.AccountID
            WHERE tblAccounts.AccountID = ?
            `,
			[AccountID],
			(err, row) => {
				if (err) {
					reject(err.message);
				} else {
					if (!row) {
						reject("No Account Found");
					} else {
						resolve(row);
					}
				}
				dbclose(db);
			}
		);
	});
}

//game winnnings
function updatePokerEarnings(AccountID, poker) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.run(
			`
            UPDATE tblEarnings
            SET PokerEarnings=?
            WHERE AccountID=?`,
			[poker, AccountID],
			(err) => {
				if (err) {
					reject(err.message);
				} else {
					resolve("updated");
				}
			}
		);
	});
}

async function addfriendship(AccountID1, AccountID2) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.run(
			`
			INSERT INTO tblFriends (AccountID1, AccountID2)
			VALUES (?, ?)
		`,
			[AccountID1, AccountID2],
			(err) => {
				if (err) {
					reject(err.message);
				} else {
					resolve("added");
				}
			}
		);
		dbclose(db);
	});
}
async function getFriendsID(AccountID) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.all(
			`
			SELECT AccountID2 as FriendID
			FROM tblFriends
			WHERE AccountID1 = ?
			UNION
			SELECT AccountID1 as FriendID
			FROM tblFriends
			WHERE AccountID2 = ?
		`,
			[AccountID, AccountID],
			(err, rows) => {
				if (err) {
					reject(err.message);
				} else {
					const friendsIDs = rows.map((row) => row.FriendID);
					resolve(friendsIDs);
				}
			}
		);
		dbclose(db);
	});
}

async function delFriendship(AccountID1, AccountID2) {
	return new Promise((resolve, reject) => {
		const db = dbconnection();
		db.run(
			`
			DELETE FROM tblFriends
			WHERE (AccountID1 = ? AND AccountID2 = ?) OR (AccountID1 = ? AND AccountID2 = ?)
		`,
			[AccountID1, AccountID2, AccountID2, AccountID1],
			(err) => {
				if (err) {
					reject(err.message);
				} else {
					resolve("Deleted");
				}
			}
		);
		dbclose(db);
	});
}
module.exports = {
	checkSessionInfo,
	updateSessionInfo,
	usernameinuse,
	createAccount,
	validateUsername,
	updateIPtable,
	updateSessionTable,
	getVisualsandEarnings,
	getUsername,
	validIP,
	updatePreference,
	getPublicInfo,
	updatePokerEarnings,
	addfriendship,
	getFriendsID,
	delFriendship
};
