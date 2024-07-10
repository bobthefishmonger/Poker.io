window.onload = () => {
	setCSStheme("gamelist");
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
