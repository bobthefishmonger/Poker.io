// Imports
    //Server
const express = require("express");
const app = express();
const session = require("express-session");
const http = require("http").Server(app);
const bodyparser = require("body-parser");

    //Express routers
const homerouter = require("./routers/home.js");
const gamesrouter = require("./routers/games.js");
const accountrouter = require("./routers/accounts.js");
const uploadrouter = require("./routers/uploads.js");
    //Socket
const io = require("socket.io")(http);
//Utils
require("dotenv").config();
const path = require("path");
const crypto = require("crypto");   
    //Accounts
const accounts = require("./accounts.js");
    //DB
const db = require("./dbmanager.js");
    //cookies
const cookieparser = require("cookie-parser");
const cookies = require("./cookies.js");
//games
    //poker
const poker_rooms = require("./games/poker/rooms.js");

// Var dec
const PORT = 8000;
    //middleware
const sessionmiddleware = session(
    {
    secret: crypto.randomBytes(32).toString("hex"),
    resave: true,
    saveUninitialized: true
    }
)
const setsessioninfo = async (req, res, next)=>{
    if (!req.session.AccountInfo){
        await accounts.logInAuto(req, res);
        req.session.IP = req.IP;
    }
    next();
}
const setDisplayInformation = async (req, res, next)=>{
    cookies.createDisplayInformationCookie(req, res);
    next();
}
//Socket
io.engine.use(sessionmiddleware);
const PokerIO = io.of("/poker");
const BlackjackIO = io.of("/Blackjack");
const RouletteIO = io.of("/Roulette");


PokerIO.on("connection", (poker_socket) => {
    const session = poker_socket.request.session;
    poker_socket.on("disconnecting", ()=> {
        poker_rooms.pokerDisconnect(session);
    });
});

BlackjackIO.on("connection", (blackjack_socket) => {
    const session = blackjack_socket.request.session;
});

RouletteIO.on("connection", (roulette_socket) => {
    const session = roulette_socket.request.session;
});

io.on("connection", (socket) => {
    const session = socket.request.session;
    if (session.redirectNote){
        socket.emit("Redirect Note", session.redirectNote);
        session.redirectNote = "";
        session.save((err)=>{
            if (err){
                console.error(err.message);
            }
        })
    }
});



//Express
app.use(express.static(path.join(__dirname, "..", "app", "public")));
app.use("/uploads", uploadrouter);
app.use(sessionmiddleware);
app.use(cookieparser());
app.use(setsessioninfo);
app.use(setDisplayInformation);
app.use(bodyparser.json());
app.use("/", homerouter);
app.use("/games", gamesrouter);
app.use("/account", accountrouter);
app.all("*", (req,res) => {
    res.redirect("/404error");
});
http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});