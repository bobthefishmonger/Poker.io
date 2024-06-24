const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
require("dotenv").config();

const expressapp = require("./expressServer/expressSetup.js");
const sockets = require("./socketServer/Socket.js"); 

const sessionmiddleware = expressapp.expressSetup(express, app);
io.engine.use(sessionmiddleware);
sockets.socketsetup(io);
http.listen(process.env.PORT, () => {
    console.log(`Listening`);
});

//when setting the sockets, we need to lock them when ingame, so that the emits go to the right place
//add locks for it all tbf
//oh oh oh
//we need to stop multiple log in from different sessions, or else they can access 2+ games

// Session {
//     cookie: { path: '/', _expires: null, originalMaxAge: null, httpOnly: true },
//     SessionInfo: {
//       DBsessionID: String ["UID"],
//       Expirery: String ["Date.toString()"];
//     },
//     AccountInfo: {
//       LoggedIn: Boolean, ["if logged in then below is set"]
//       AccountID: Number ["PK for DB"]
//       Username: String,
//       Visuals: { Theme: String, AccountImage: String ["accountID.png/.jpg"] },
//       Earnings: { Poker: Number, Blackjack: Number, Roulette: Number }
//     },
//     ingame: Boolean,
//     socketids: {
//         poker_socket: null | String ["socket.id"]
//         blackjack_socket: null | String ["socket.id"]
//         roulette_socket: null | String ["socket.id"]
//         socket: null | String ["socket.id"]
//     },
//     rediret: String ["Path"]
//     redirectNote: String
//     PokerData: { //or null;
//         roomID: Number,
//         maxplayers: Number ,
//         gameactive: Boolean
//     }
// }