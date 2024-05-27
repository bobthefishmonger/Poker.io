const express = require("express");
const path = require("path");
const router = express.Router();
const accounts = require("../accounts.js");
function sendhtml(res, file) {
    res.sendFile(path.join(__dirname, "..", "..", "app", `${file}.html`));    
};
router.get("/", (req, res) => {
    sendhtml(res, "account");
});
router.get("/login", (req,res) => {
    if (req.session.AccountInfo.LoggedIn){
        res.redirect("/");
    }else{
        req.session.redirect = req.query.redirect || "/";
        sendhtml(res, "login");
    }
});
router.post("/login", async (req, res) => {
    let { username, password, stayLoggedIn} = req.body;
    const sessionInfo = req.session.SessionInfo;
    if (stayLoggedIn){
        stayLoggedIn = 1
    }else{
        stayLoggedIn = 0
    }
    try {
        await accounts.logInUser(req, sessionInfo, username, password, stayLoggedIn);
        res.json({ success: true, redirect: req.session.redirect });
    } catch (error) {
        res.json({ success: false, message: error });
    }
});

router.get("/signup", (req, res) => {
    if (req.session.AccountInfo.LoggedIn){
        res.redirect("/");
    }else{
        req.session.redirect = req.query.redirect || "/";
        sendhtml(res, "signup");
    }
});

router.post("/signup", async (req, res) => {
    let { username, password, stayLoggedIn, theme, imagePath } = req.body;
    const ip = req.ip;
    const sessionInfo = req.session.SessionInfo;
    if (stayLoggedIn){
        stayLoggedIn = 1
    }else{
        stayLoggedIn = 0
    }
    try {
        await accounts.signUpUser(req, sessionInfo, username, password, ip, stayLoggedIn, theme, imagePath);
        res.json({ success: true, redirect: req.session.redirect });
    } catch (error) {
        res.json({ success: false, message: error });
    }
});

router.get("/:accountName", (req,res) => {
    sendhtml(res, "publicaccount");
});
module.exports = router