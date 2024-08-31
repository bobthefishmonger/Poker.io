window.onload = () => {
	setCSStheme("missingPA");
	setHeaderIcons();
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
