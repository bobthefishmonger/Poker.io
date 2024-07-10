function sethtml() {
	const content = document.getElementById("content");
	content.innerHTML = `<div><div><p>Test</p></div></div>`;
}

function addPokerSocketListeners(poker_socket) {}

function rungame(poker_socket) {
	sethtml();
	addPokerSocketListeners(poker_socket);
}
