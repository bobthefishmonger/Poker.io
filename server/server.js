// Imports
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
require("dotenv").config();

const redis = require("./expressServer/redis.js");
const expressapp = require("./expressServer/expressSetup.js")(redis);
const sockets = require("./socketServer/Socket.js")(redis); 

expressapp.expressSetup(express, app);
sockets.socketsetup(io, expressapp.sessionmiddleware);

http.listen(process.env.PORT, () => {
    console.log(`Listening`);
});
//when settingg the sockets, we need to lock them when ingame, so that the emits go to the right place
//add locks for it all tbf
//oh oh oh
//we need to stop multiple log in from different sessions, or else they can access 2+ games