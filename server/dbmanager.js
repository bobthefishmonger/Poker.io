const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const argon2 = require("argon2");
const { JSONCookie } = require("cookie-parser");
//Utils
function dbconnection(){
    return new sqlite3.Database(path.join(__dirname, "database", "accounts.db"), (err) =>{
        if (err){
            return console.error(err.message);
        }
    });
}

function dbclose(db){
    db.close((err) => {
        if (err){
            return console.error(err.message);
        }
    });
}

//SignUp
async function usernameinuse(username){
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.get(`SELECT AccountID FROM tblAccounts WHERE Username = ?`, [username], (err, row) => {
            if (err){
                console.error(err.message);
                reject(err.message);
            }
            if (!row){
                resolve(false);
            }
            else{
                resolve(true);
            }
            dbclose(db);
        })    
    })
}

async function createAccountData(db, Username, Password) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO tblAccounts(Username, Password) VALUES(?,?)`, [Username, Password], function (err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

async function createEarningsData(db, lastID) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO tblEarnings(AccountID, PokerEarnings, BlackjackEarnings, RouletteEarnings) VALUES(?,?,?,?)`, [lastID, 0, 0, 0], function (err) {
            if (err) {
                reject(err.message);
            } else {
                resolve();
            }
        });
    });
}

async function createPreferencesData(db, lastID, Theme, ImagePath) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO tblPreferences(AccountID, Theme, ImagePath) VALUES(?,?,?)`, [lastID, Theme, ImagePath], function (err) {
            if (err) {
                reject(err.message);
            } else {
                resolve();
            }
        });
    });
}

async function createSessionData(db, SessionInfo, lastID, Stayloggedin) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO tblSession(SessionID, AccountID, Stayloggedin, ExpireryDate) VALUES(?,?,?,?)`, [SessionInfo.SessionID, lastID, Stayloggedin, SessionInfo.Expirery], function (err) {
            if (err) {
                reject(err.message);
            } else {
                resolve();
            }
        });
    });
}

async function createUsedIPsData(db, lastID, IP) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO tblUsedIPs(AccountID, IP) VALUES(?,?)`, [lastID, IP], function (err) {
            if (err) {
                reject(err.message);
            } else {
                resolve();
            }
        });
    });
}

async function createAccount(Username, Password, IP, SessionInfo, Stayloggedin, Theme, ImagePath) {
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
    }
    catch (error) {
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

async function validateUsername(Username, Password){
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.get(
        `SELECT AccountID, Password
        FROM tblAccounts
        WHERE Username = ?`, [Username],
        async (err, row) => {
            if (err){
                reject(err.message);
            }else{
                if (!row){
                    reject("Invalid Username");
                }else{
                    if (await argon2.verify(row.Password, Password)){
                        resolve(row.AccountID);
                    }
                    else{
                        reject("Invalid Password")
                    }
                }
            }
            dbclose(db);
        })
    })
}

async function updateIPtable(AccountID, IP) {
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.run(
            `INSERT INTO tblUsedIPs (AccountID, IP)
             VALUES (?, ?)`, [AccountID, IP],
            (err) =>{
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

async function updateSessionTable(AccountID, SessionInfo, Stayloggedin){
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.run(
            `UPDATE tblSession
            SET SessionID=?, ExpireryDate=?, Stayloggedin=?
            WHERE AccountID=?`, [SessionInfo.SessionID, SessionInfo.Expirery, Stayloggedin, AccountID], (err) => {
                if (err){
                    reject(err.message);
                }else{
                    resolve("Sessiontable changed");
                }
            }
        )
    })
}

async function getVisualsandEarnings(AccountID){
    return new Promise((resolve, reject) => {
        const db = dbconnection()
        db.get(
            `SELECT tblEarnings.PokerEarnings, tblEarnings.BlackjackEarnings,
            tblEarnings.RouletteEarnings, tblPreferences.Theme, tblPreferences.ImagePath
            FROM tblEarnings
            INNER JOIN tblPreferences ON tblPreferences.AccountID = tblEarnings.AccountID
            WHERE tblEarnings.AccountID = ?`, (AccountID), (err, row)=>{
                if (err){
                    reject(err.message);
                }else{
                    resolve(row);
                }
                dbclose(db);
            }
        )
    })
}

//Auto Login Only

async function checkSessionInfo(SessionInfo){
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.get(
            `SELECT AccountID
            FROM tblSession
            WHERE SessionID = ? AND ExpireryDate = ? AND Stayloggedin = 1`, [SessionInfo.SessionID, SessionInfo.Expirery],
            (err, row) =>{
        if (err){
            console.error(err.message); reject(err.message);
        }else{
            resolve(row);
        }
        dbclose(db);
        })
    })
}

async function updateSessionInfo(oldSessionID, SessionInfo) {
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.run(
            `UPDATE tblSession
            SET SessionID=?, ExpireryDate=?
            WHERE SessionID=?`,
            [SessionInfo.SessionID,SessionInfo.Expirery, oldSessionID],
            (err) => {
                if (err) {
                    reject(err.message);
                } else {
                    resolve(true);
                }
                dbclose(db);
            }
        )
    })
}

async function getUsername(AccountID){
    return new Promise((resolve, reject) => {
        const db = dbconnection()
        db.get(
            `SELECT Username
            FROM tblAccounts
            WHERE AccountID = ?`, [ AccountID], (err, row) =>{
                if (err){
                    reject(err.message);
                }
                else{
                    resolve(row);
                }
                dbclose(db);
            }
        )
    })
}

async function validIP(AccountID, IP){
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.get(
            `SELECT IPID
            FROM tblUsedIPs
            WHERE AccountID=? AND IP=?`, [AccountID, IP]
            , async (err, row) => {
                if (err){
                    reject(err.message);
                }else{
                    if (row){
                        resolve(true);
                    }else{
                        resolve(false);
                    }                 
                }
                dbclose(db);
            }
        )
    })
}

//preferences

function updatePreference(AccountID, theme, file){
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.run(
            `UPDATE tblPreferences
            SET Theme=?,ImagePath=?
            WHERE AccountID=?`, [theme, file, AccountID], (err) =>{
                if (err){
                reject(err.message); 
                }else{
                    resolve(true);
                }
                dbclose(db);
            }
        )
    })
}
//Public accounts
function getPublicInfo(AccountID){
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.get(
            `SELECT tblAccounts.Username, tblEarnings.PokerEarnings, tblEarnings.BlackjackEarnings,
            tblEarnings.RouletteEarnings, tblPreferences.ImagePath
            FROM tblAccounts
            INNER JOIN tblEarnings ON tblEarnings.AccountID = tblAccounts.AccountID
            INNER JOIN tblPreferences ON tblPreferences.AccountID = tblAccounts.AccountID
            WHERE tblAccounts.AccountID = ?
            `, [AccountID], (err, row) => {
                if (err){
                    reject(err.message);
                }else{
                    if (!row){
                        reject("No Account Found");
                    }
                    else{
                        resolve(row);
                    }
                }
                dbclose(db);
            }
        )
    })
}

//game winnnings
function updatewinnings(AccountID,poker, roulette, blackjack){
    return new Promise((resolve, reject) => {
        const db = dbconnection();
        db.run(`
            UPDATE tblEarnings
            SET PokerEarnings=?, BlacjackEarnings=?, RouletteEarnings=?
            WHERE AccountID=`, [poker, roulette, blackjack, AccountID]
        , (err) => {
            if (err){
                reject(err.message);
            }else{
                resolve("updated");
            }
        })
    })
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
    updatewinnings
}