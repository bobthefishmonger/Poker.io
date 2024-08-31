let poker_socket;
let ishost = false;

function enablehost() {
	ishost = true;
	const startbtn = document.getElementById("startgamebtn");
	startbtn.disabled = false;
	startbtn.style.visibility = "visible";
}

async function startGame() {
	let response = await fetch("/games/poker/startgame", {
		method: "POST"
	});
	response = await response.json();
	if (!response.success) {
		alert(response.message);
	}
}

async function kickPlayer(username) {
	const data = {
		Username: username
	};
	let response = await fetch("/games/poker/kickplayer", {
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(data)
	});
	response = await response.json();
	if (!response.success) {
		alert("An error occured");
	}
}

async function banPlayer(username) {
	const data = {
		Username: username
	};
	let response = await fetch("/games/poker/banplayer", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(data)
	});
	response = await response.json();
	if (!response.success) {
		alert("An error occured");
	}
}

function setplayertable(players) {
	const table = document.getElementById("roomplayers");
	if (ishost) {
		table.innerHTML = `
        <tr>
            <th>Icon |</th>
            <th>Username |</th>
            <th>Earnings |</th>
            <th>Host |</th>
            <th>Kick |</th>
            <th>Ban  |</th>
        </tr>`;
	} else {
		table.innerHTML = `
        <tr>
            <th>Icon |</th>
            <th>Username |</th>
            <th>Earnings |</th>
            <th>Host</th>
        </tr>`;
	}

	players.forEach((player) => {
		let rowHTML = `
            <tr>
                <td><img class="playerlisticon" src="../../../uploads/profileimage/${player.icon}"></td>
                <td>${player.username}</td>
                <td>${player.earnings}</td>
                <td>${player.host}</td>`;

		if (ishost) {
			if (players[0] === player) {
				rowHTML += `<td>N/A</td><td>N/A</td></tr>`;
			} else {
				rowHTML += `<td><button id="kickbtn${player.username}">Kick</button></td>
                <td><button id="banbtn${player.username}">Ban</button></td></tr>`;
			}
		} else {
			rowHTML += `</tr>`;
		}

		table.insertAdjacentHTML("beforeend", rowHTML);
	});

	if (ishost) {
		players.forEach((player) => {
			if (players[0] !== player) {
				document
					.getElementById(`kickbtn${player.username}`)
					.addEventListener("click", async () => {
						await kickPlayer(player.username);
					});
				document
					.getElementById(`banbtn${player.username}`)
					.addEventListener("click", async () => {
						await banPlayer(player.username);
					});
			}
		});
	}
}

socket.on("nextsetup", (callback) => {
	poker_socket = io("/poker", { reconnection: false });
	callback();
	poker_socket.on("connect", async () => {
		const data = { roomID: window.location.href.slice(0, -1).slice(-6) };
		let response = await fetch("/games/poker/joinroom", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data)
		});
		response = await response.json();
		if (!response.success) {
			alert(response.message);
			window.location.pathname = "/games/poker";
		}
	});

	poker_socket.on("playerjoin", (players) => {
		setplayertable(players);
		//notifications
	});
	poker_socket.on("playerwaitingleave", (players) => {
		setplayertable(players);
		//notifications
	});
	poker_socket.on("updatehost", () => {
		enablehost();
	});

	poker_socket.on("Removed: Kicked", () => {
		window.location.pathname = "/games/poker";
	});

	poker_socket.on("Removed: Banned", () => {
		window.location.pathname = "/games/poker";
	});

	poker_socket.on("gamestarting", (players) => {
		alert("game is starting");
		rungame(poker_socket, players);
	});

	poker_socket.on("reconnect-setup", (players) => {
		console.log("running game");
		rungame(poker_socket, players);
	});

	// chat
	poker_socket.on("chatmsg", (player, msg) => {
		const chatHistory = document.getElementById("chat-history");
		chatHistory.innerText += `${player}:${msg} \n
		`;
		chatHistory.scrollTop = chatHistory.scrollHeight;
	});
});
document.getElementById("chat-clear-btn").addEventListener("click", () => {
	document.getElementById("chat-history").innerText = null;
});
document.getElementById("startgamebtn").addEventListener("click", async () => {
	await startGame();
});

document.getElementById("chat-submit-btn").addEventListener("click", () => {
	const msg = document.getElementById("chat-input").value;
	if (!msg) return;
	poker_socket.emit("sendmsg", msg);
	document.getElementById("chat-input").value = null;
});

window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
	if (poker_socket) {
		poker_socket.disconnect(true);
	}
});

window.onload = () => {
	setCSStheme("pokergame");
	setHeaderIcons();
};
