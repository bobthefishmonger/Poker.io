const express = require("express");
const path = require("path");
const router = express.Router()

router.get("/profileimage/:image", async (req, res) =>{
    res.sendFile(path.join(__dirname,"..", "database", "uploads",`${req.params.image}`))
});

module.exports = router