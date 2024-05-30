const express = require("express");
const path = require("path");
const router = express.Router()
function sendhtml(res, file) {
    res.sendFile(path.join(__dirname, "..", "..", "app", `${file}.html`));
};
router.get("/", async(req,res) =>{
    sendhtml(res, "gamelist");
});
router.get("/poker", async(req,res) =>{
    if (!req.session.AccountInfo.LoggedIn){
        req.session.redirectNote = "You cannot access Poker whilst not logged in"
        res.redirect("/account/login");
    }else{
        req.session.redirect = req.query.redirect || "/";
        sendhtml(res, "poker");
    }
});
router.get("/blackjack", async(req,res) =>{
    if (!req.session.AccountInfo.LoggedIn){
        req.session.redirectNote = "You cannot access Blackjack whilst not logged in"
        res.redirect("/account/login");
    }else{
        req.session.redirect = req.query.redirect || "/";
        sendhtml(res, "blackjack");
    }
});
router.get("/roulette", async(req,res) =>{
    if (!req.session.AccountInfo.LoggedIn){
        req.session.redirectNote = "You cannot access Roulette whilst not logged in"
        res.redirect("/account/login");
    }else{
        req.session.redirect = req.query.redirect || "/";
        sendhtml(res, "roulette");
    }
});
module.exports = router