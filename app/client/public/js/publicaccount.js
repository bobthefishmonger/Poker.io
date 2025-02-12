window.onload = () => {
	setCSStheme("publicaccount");
	setHeaderIcons();
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
