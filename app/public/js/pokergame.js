function sethtml(players) {
	const content = document.getElementById("content");
	content.innerHTML += `
	<div class="community-cards-container">
        <div class="card community-cards community-cards-flop"></div>
        <div class="card community-cards community-cards-flop"></div>
        <div class="card community-cards community-cards-flop"></div>
        <div class="card community-cards community-cards-turn"></div>
        <div class="card community-cards community-cards-river"></div>
    </div>`;
	let rowHTML = `<div class="all-player-cards-container">`;
	for (let i = 1; i <= players.length; i++) {
		rowHTML += `
		<div class="player-cards-container player-${i}-card-container">
			<p class="player-cards-username">${players[i - 1]}</p>
			<div class="card player-cards player-cards-${i}"></div>
			<div class="card player-cards player-cards-${i}"></div>
		</div>
	`;
	}
	rowHTML += "</div>";
	content.insertAdjacentHTML("beforeend", rowHTML);
}

function addPokerSocketListeners(poker_socket) {}

function rungame(poker_socket, players) {
	sethtml(players);
	addPokerSocketListeners(poker_socket);
}
