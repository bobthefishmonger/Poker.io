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

function genplayercards() {
	const container = document.querySelector(".cardscontainer");
}

socket.on("nextsetup", (callback) => {
	poker_socket = io("/poker");
	callback();

	poker_socket.on("connect", async () => {
		const data = { roomID: window.location.href.slice(-6) };
		let response = await fetch("/games/poker/joinroom", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data)
		});
		response = await response.json();
		document.getElementById("testmsg").innerHTML = response.message;
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
		document.getElementById("testmsg").innerHTML += " You are now the host";
		enablehost();
	});

	poker_socket.on("Removed: Kicked", () => {
		window.location.href = window.location.origin + "/games/poker";
	});

	poker_socket.on("Removed: Banned", () => {
		window.location.href = window.location.origin + "/games/poker";
	});

	poker_socket.on("gamestarting", () => {
		alert("game is starting");
		rungame();
	});
});

document.getElementById("startgamebtn").addEventListener("click", async () => {
	await startGame();
});

window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
	poker_socket.disconnect(true);
});

window.onload = () => {
	setCSStheme("pokergame");
};
