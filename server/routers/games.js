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
    sendhtml(res, "poker");
});
router.get("/blackjack", async(req,res) =>{
    sendhtml(res, "blackjack");
});
router.get("/roulette", async(req,res) =>{
    sendhtml(res, "roulette");
});
module.exports = router