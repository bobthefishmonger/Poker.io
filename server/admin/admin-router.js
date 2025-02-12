const express = require("express");
const router = express.Router();
const path = require("path");

const RedisClient = require("redisjson-express-session-store");

async function authUser(req, res, next) {
	// check this admin session is valid
	next();
}
async function userlogger(req, res, next) {
	// write to db all user activities
	// include body (if post), type, url <- link to user
	next();
}
function sendhtml(res, file) {
	res.sendFile(
		path.join(__dirname, "..", "..", "app", "admin", `${file}.html`)
	);
}

router.get("/", (req, res) => {
	res.redirect(`/admin/auth`);
});

router.get("/auth", async (req, res) => {
	sendhtml(res, "login");
});

router.use(authUser);
router.use(userlogger);
router.get("/dashboard", async (req, res) => {
	sendhtml(res, "dashboard");
});
router.post("/actions/banAccount", async (req, res) => {});
router.post("/actions/suspendAccount", async (req, res) => {});
router.post("/actions/viewTables:table  ", async (req, res) => {});
router.post("/actions/editField:Field", async (req, res) => {}); //:Field -> tblName.Field

//a higher level admin
async function manager(req, res, next) {
	//have a different set of credentials for this
	next();
}

router.use(manager);
router.get("/manager/dashboard", async (req, res) => {
	sendhtml(res, "manager");
});
router.post("/manager/actions/reinitDB", async (req, res) => {});
router.post("/manager/actions/reinitTable", async (req, res) => {});
router.post("/manager/actions/editAdmins", async (req, res) => {});
router.post("/manager/actions/reinitAdmins", async (req, res) => {}); //use a username and password stored in .env

//! I want to change the client side structutre to be /app/admin, /app/client  so changes needed to code paths
module.exports = router;
