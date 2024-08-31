window.onload = () => {
	setCSStheme("404page");
	setHeaderIcons();
};

window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
