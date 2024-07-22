let roulette_socket;
socket.on("nextsetup", (callback) => {
	roulette_socket = io("/roulette", { reconnection: false });
	callback();
});

window.onload = () => {
	setCSStheme("roulette");
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
	if (roulette_socket) {
		roulette_socket.disconnect(true);
	}
});
