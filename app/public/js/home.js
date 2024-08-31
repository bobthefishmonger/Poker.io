window.onload = () => {
	setCSStheme("home");
	setHeaderIcons();
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
