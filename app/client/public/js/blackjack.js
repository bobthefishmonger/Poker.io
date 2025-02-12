let blackjack_socket;
socket.on("nextsetup", (callback) => {
	blackjack_socket = io("/blackjack", { reconnection: false });
	callback();
});

window.onload = () => {
	setCSStheme("blackjack");
	setHeaderIcons();
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
	if (blackjack_socket) {
		blackjack_socket.disconnect(true);
	}
});
