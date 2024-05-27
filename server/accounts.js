const db = require("./dbmanager.js");
const argon2 = require("argon2");
const cookies = require("./cookies.js");
const { CONSTRAINT } = require("sqlite3");

async function writeSignUp(SessionInfo, Username, Password, IP, Stayloggedin, Theme = "Dark", ImagePath = "/database/uploads/default.png"){
    return new Promise(async (resolve, reject) => {
        try{
            if (await db.usernameinuse(Username)){
                reject("Username in use");
            }
            else{
                Password = await argon2.hash(Password);
                const PK = await db.createAccount(Username, Password, IP, SessionInfo, Stayloggedin, Theme, ImagePath);
                resolve(PK);
            }
        }
        catch (err){
            reject(err);
        }
    })
}

async function signUpUser(req,sessionInfo, username, password, ip, stayLoggedIn, theme, imagePath) {
    try {
        const accountID = await writeSignUp(sessionInfo, username, password, ip, stayLoggedIn, theme, imagePath);
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
        }
        req.session.AccountInfo = accountinfo;
    } catch (error) {
        console.error("Error during sign up:", error);
        throw error;
    }
}

async function logInUser(req, SessionInfo, Username, Password, Stayloggedin){
    const AccountID = await db.validateUsername(Username, Password);
    if (!await db.validIP(AccountID, req.ip)){
        await db.updateIPtable(AccountID, req.ip);
    }
    await db.updateSessionTable(AccountID, SessionInfo, Stayloggedin)
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
}

async function logInAuto(req, res){
    let SessionInfo = await cookies.validateSessionInfocookie(req, res);
    if (!SessionInfo[1][0]){
        SessionInfo = SessionInfo[0]
        req.session.SessionInfo = SessionInfo;
        req.session.AccountInfo = {LoggedIn: false};
        return "Should not be logged in";
    }else{
        try{
            const AccountID = SessionInfo[1][1].AccountID;
            SessionInfo = SessionInfo[0];
            req.session.SessionInfo = SessionInfo;
            if (db.validIP(AccountID, req.ip)){
                const Username = (await db.getUsername(AccountID)).Username;
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
                return "logged_in";
            }else{
                req.session.AccountInfo = {LoggedIn: false};
                return "New IP, has to relog in"
            }
        }
        catch (err){
            return "Error";
        }
    }
}

module.exports = {
    signUpUser,
    logInUser,
    logInAuto
}