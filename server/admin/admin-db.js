const sqlite3 = require("sqlite3");
const path = require("path");
const argon2 = require("argon2");
require("dotenv").config();

const TABLES = [
	"tblAccounts",
	"tblEarnings",
	"tblFriends",
	"tblPreferences",
	"tblSession",
	"tblUsedIPs"
];

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

function adminDBconnection() {
	return new sqlite3.Database("/admin.db", (err) => {
		if (err) {
			return console.error(err.message);
		}
	});
}

function dbclose(db) {
	db.close((err) => {
		if (err) {
			return console.error(err.message);
		}
	});
}

//reinits
async function reinitAccounts(db) {
	return new Promise((resolve, reject) => {
		db.run(`DROP TABLE tblAccounts`, (err) => {
			if (err) reject(err);
			else {
				db.run(
					`
					CREATE  TABLE "tblAccounts" (
        			"AccountID"	INTEGER,
        			"Username"	TEXT,
        			"Password"	TEXT,
        			PRIMARY KEY("AccountID")
    				);`,
					(err) => {
						if (err) reject(err);
						else resolve();
					}
				);
			}
		});
	});
}
async function reinitEarnings(db) {
	return new Promise((resolve, reject) => {
		db.run(`DROP TABLE tblEarnings`, (err) => {
			if (err) reject(err);
			else {
				db.run(
					`CREATE TABLE "tblEarnings" (
        			"EarningsID" INTEGER,
        			"AccountID"	INTEGER,
        			"PokerEarnings"	INTEGER,
        			"BlackjackEarnings"	INTEGER,
        			"RouletteEarnings"	INTEGER,
        			FOREIGN KEY("AccountID") REFERENCES "tblAccounts"("AccountID"),
        			PRIMARY KEY("EarningsID")
    				);`,
					(err) => {
						if (err) reject(err);
						else resolve();
					}
				);
			}
		});
	});
}
async function reinitFriends(db) {
	return new Promise((resolve, reject) => {
		db.run(`DROP TABLE tblFriends`, (err) => {
			if (err) reject(err);
			else {
				db.run(
					`
					CREATE TABLE "tblFriends" (
					"FriendsID"	INTEGER,
					"AccountID1"	INTEGER,
					"AccountID2"	INTEGER,
					FOREIGN KEY("AccountID2") REFERENCES "tblAccounts"("AccountID"),
					FOREIGN KEY("AccountID1") REFERENCES "tblAccounts"("AccountID"),
					PRIMARY KEY("FRIENDSID")
					);`,
					(err) => {
						if (err) reject(err);
						else resolve();
					}
				);
			}
		});
	});
}
async function reinitPreferences(db) {
	return new Promise((resolve, reject) => {
		db.run(`DROP TABLE tblPreferences`, (err) => {
			if (err) reject(err);
			else {
				db.run(
					`
					CREATE TABLE "tblPreferences" (
    				"PreferenceID"	INTEGER,
   				 	"AccountID"	INTEGER,
   				 	"Theme"	TEXT,
   				 	"ImagePath"	TEXT,
   				 	FOREIGN KEY("AccountID") REFERENCES "tblAccounts"("AccountID"),
   				 	PRIMARY KEY("PreferenceID")
    				);`,
					(err) => {
						if (err) reject(err);
						else resolve();
					}
				);
			}
		});
	});
}
async function reinitSession(db) {
	return new Promise((resolve, reject) => {
		db.run(`DROP TABLE tblSession`, (err) => {
			if (err) reject(err);
			else {
				db.run(
					`
					CREATE TABLE "tblSession" (
					"PKSessionID"	INTEGER,
					"SessionID"	INTEGER,
					"AccountID"	INTEGER,
					"Stayloggedin"	INTEGER CHECK("Stayloggedin" IN (0, 1)),
					"ExpireryDate"	TEXT,
					FOREIGN KEY("AccountID") REFERENCES "tblAccounts"("AccountID"),
					PRIMARY KEY("PKSessionID")
				    );`,
					(err) => {
						if (err) reject(err);
						else resolve();
					}
				);
			}
		});
	});
}
async function reinitUsedIPs(db) {
	return new Promise((resolve, reject) => {
		db.run(`DROP TABLE tblUsedIPs`, (err) => {
			if (err) reject(err);
			else {
				db.run(
					`
					CREATE TABLE "tblUsedIPs" (
    				"IPID"	INTEGER,
    				"AccountID"	INTEGER,
    				"IP"	TEXT,
    				UNIQUE("AccountID","IP"),
    				PRIMARY KEY("IPID"),
    				FOREIGN KEY("AccountID") REFERENCES "tblAccounts"("AccountID")
    				);`,
					(err) => {
						if (err) reject(err);
						else resolve();
					}
				);
			}
		});
	});
}

async function REINITALL() {
	console.warn("TABLES BEING RESET");
	const db = dbconnection();
	await new Promise((resolve, reject) => {
		db.run("BEGIN TRANSACTION", (err) => {
			if (err) reject(err);
			else resolve;
		});
	});
	try {
		await reinitAccounts(db);
		await reinitEarnings(db);
		await reinitFriends(db);
		await reinitPreferences(db);
		await reinitSession(db);
		await reinitUsedIPs(db);
		await new Promise((resolve, reject) => {
			db.run("COMMIT", (err) => {
				if (err) reject(err);
				else resolve();
			});
		});

		dbclose(db);
	} catch (execption) {
		await new Promise((resolve, reject) => {
			db.run("ROLLBACK", (err) => {
				if (err) reject(err);
				else resolve();
			});
			dbclose(db);
			throw execption;
		});
	}
}

async function REINITTABLE(table) {
	console.warn(`TABLE: ${table} IS BEING RESET`);
	// use a transaction
}

async function REINITADMINS() {
	// use a transaction
	console.warm("ADMINS BEING RESET");
	const db = adminDBconnection();
}

module.exports = {
	REINITALL,
	REINITTABLE
};
