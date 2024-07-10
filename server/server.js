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
	console.log(`Listening on port: ${process.env.PORT}`);
});

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
//     ingame: undefined | Boolean,
//     socketids: null | {
//         poker_socket: null | String ["socket.id"]
//         blackjack_socket: null | String ["socket.id"]
//         roulette_socket: null | String ["socket.id"]
//         socket: null | String ["socket.id"]
//     },
//     rediret: undefineds | String ["Path"]
//     redirectNote: undefined | String
//     PokerData: undefined | null | {
//         roomID: Number,
//         maxplayers: Number ,
//         gameactive: Boolean
//     }
//     bannedPokerRooms: undefined | Map [Number [RoomID]: String [reason]]
// }
