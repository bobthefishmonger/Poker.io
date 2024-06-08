const express = require("express");
const path = require("path");
const router = express.Router()
const poker_rooms = require("../games/poker/rooms.js");
function sendhtml(res, file) {
    res.sendFile(path.join(__dirname, "..", "..", "app", `${file}.html`));
};

router.get("/", async(req,res) =>{
    sendhtml(res, "gamelist");
});
router.get("/poker", async(req,res) =>{
    //should /poker be more like a menu, where you choose your room ect
    //we should add accept/decline notification for people to join a room
    //or
    //what is we have something like /poker for meu and /poker?game={{gameID}}
    if (!req.session.AccountInfo.LoggedIn){
        req.session.redirectNote = "You cannot access Poker whilst not logged in"
        res.redirect("/account/login    ?redirect=/games/poker");
    }else{
        req.session.redirect = req.query.redirect || "/";
        sendhtml(res, "poker");
    }
});

router.post("/poker/createroom", async (req, res) => {
    if (!req.session.AccountInfo.LoggedIn){
        res.json({"success": false, "errormessage": "You cannot access Poker whilst not logged in", "redirect":"/account/login?redirect=/games/poker"});
    }else{
        poker_rooms.createRoom(req, res);
    }
});

router.get("/poker/:roomID", (req, res) => {
    //Note: The ingame flag might have to be moved, depending on the implimentation of the actual game being played
    if (req.session.ingame){
        req.session.redirectNote = "You cannot access multiple games at once"
        res.redirect("/home");
    }else{
        if (!req.session.AccountInfo.LoggedIn){
            req.session.redirectNote = "You cannot access Poker whilst not logged in"
            res.redirect("/account/login?redirect=games/poker");
        }else{
            poker_rooms.checkroomID(req, res, req.params.roomID);
        }
    }
});

router.get("/blackjack", async(req,res) =>{
    if (!req.session.AccountInfo.LoggedIn){
        req.session.redirectNote = "You cannot access Blackjack whilst not logged in"
        res.redirect("/account/login?redirect=games/blackjack");
    }else{
        req.session.redirect = req.query.redirect || "/";
        sendhtml(res, "blackjack");
    }
});
router.get("/roulette", async(req,res) =>{
    if (!req.session.AccountInfo.LoggedIn){
        req.session.redirectNote = "You cannot access Roulette whilst not logged in"
        res.redirect("/account/login?redirect=games/roulette");
    }else{
        req.session.redirect = req.query.redirect || "/";
        sendhtml(res, "roulette");
    }
});
module.exports = router