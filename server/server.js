// Imports
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

// Var dec
const PORT = 8000;

//Socket
io.on("connection", (socket) =>{
    
});





//Server
app.use(express.static(path.join(__dirname, "..", "app", "public")));
function sendhtml(res, file) {
    res.sendFile(path.join(__dirname, "..", "app", `${file}.html`));
};
app.get("/", (req,res) =>{
    sendhtml(res, "home");
});
app.get("/home", (req,res) =>{
    sendhtml(res, "home");
});
app.get("/leaderboard", (req,res) => {
    sendhtml(res, "leaderboard");
});
app.get("/account", (req,res) => {
    sendhtml(res, "account");
});
app.get("/account/login", (req,res) => {
    sendhtml(res, "login");
});
app.get("/account/signup", (req,res) => {
    sendhtml(res, "signup");
});
app.get("/games", (req,res) =>{
    sendhtml(res, "gamelist");
});
app.get("/games/poker", (req,res) =>{
    sendhtml(res, "poker");
});
app.get("/games/blackjack", (req,res) =>{
    sendhtml(res, "blackjack");
});
app.get("/games/roulette", (req,res) =>{
    sendhtml(res, "roulette");
});
app.all("*", (req,res) => {
    sendhtml(res, "404page");
});
http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});