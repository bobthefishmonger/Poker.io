window.onload = () => {
	setCSStheme("publicaccount");
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
