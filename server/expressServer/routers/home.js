const express = require("express");
const path = require("path");
const router = express.Router()
function sendhtml(res, file) {
    res.sendFile(path.join(__dirname, "..", "..", "..", "app", `${file}.html`));
};
router.get("/", async (req, res) =>{
    sendhtml(res, "home");
});
router.get("/home", async (req, res) =>{
    sendhtml(res, "home");
});
router.get("/leaderboard", async (req, res) =>{
    sendhtml(res, "leaderboard");
});
router.get("/404error", (req, res) =>{
    sendhtml(res, "404page");
})

module.exports = router