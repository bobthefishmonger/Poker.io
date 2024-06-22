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