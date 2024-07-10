window.onload = () => {
	setCSStheme("home");
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
