let AdminIO;
function setAdminIO(io) {
	AdminIO = io.of("/admin");
	setupIO();
}
function setupIO() {}
module.exports = {
	setAdminIO
};
