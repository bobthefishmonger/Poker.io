socket.on("nextsetup", (callback) => {
	blackjack_socket = io("/blackjack");
	callback();
});

window.onload = () => {
	setCSStheme("blackjack");
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
	if (blackjack_socket) {
		blackjack_socket.disconnect(true);
	}
});
