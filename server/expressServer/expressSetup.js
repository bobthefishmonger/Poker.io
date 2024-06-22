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

const RedisClient = require("./redis.js");

const crypto = require("crypto");
const path = require("path");

const sessionmiddleware = session(
    {
    store: RedisClient.store,
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: true
    }
)
const setsessioninfo = async (req, res, next)=>{
    if (!req.session.AccountInfo){
        await accounts.logInAuto(req, res);
    }
    next();
}
const setDisplayInformation = async (req, res, next)=>{
    cookies.createDisplayInformationCookie(req, res);
    next();
}
function expressSetup(express, app){
    app.use(nocache())
    app.use(express.static(path.join(__dirname,"..", "..", "app", "public")));
    app.use("/uploads", uploadrouter);
    app.use(sessionmiddleware);
    app.use(cookieParser());
    app.use(setsessioninfo);
    app.use(setDisplayInformation);
    app.use(bodyparser.json());
    app.use("/", homerouter);
    app.use("/games", gamesrouter);
    app.use("/account", accountrouter);
    app.all("*", (req,res) => {
        res.redirect("/404error");
    });
    return sessionmiddleware;
}

module.exports = {
    expressSetup
}