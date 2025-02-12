window.onload = () => {
	setCSStheme("gamelist");
	setHeaderIcons();
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
