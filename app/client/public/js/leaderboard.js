window.onload = () => {
	setCSStheme("leaderboard");
	setHeaderIcons();
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
