let poker_socket;

socket.on("nextsetup", (callback) => {
	poker_socket = io("/poker", { reconnection: false });
	callback();
});

async function joinprivroom(e) {
	e.preventDefault();
	window.location.pathname = `/games/poker/${
		document.getElementById("privroomIDinput").value
	}/`;
}

async function getpublicrooms() {
	let response = await fetch("/games/poker/publicrooms", { method: "POST" });
	response = await response.json();
	const rooms = JSON.parse(response.rooms);
	const table = document.getElementById("publicrooms");
	table.innerHTML = `<tr>
        <th>RoomID |</th>
        <th>players | </th>
        <th>maxplayers |</th>
        <th>stacksize</th>
    </tr>`;
	rooms.forEach((room) => {
		table.innerHTML += `<tr>
            <td><a href="/games/poker/${room.RoomID}">${room.RoomID}</td>
            <td>${room.nplayers}</td>
            <td>${room.maxplayers}</td>
            <td>${room.stacksize}</td>
        </tr>
        `;
	});
}

async function createRoom(event) {
	event.preventDefault();
	let data = {
		visibility: document.getElementById("visibility").value,
		maxplayers: document.getElementById("nplayers").value,
		stacksize: document.getElementById("stacksize").value
	};
	data = JSON.stringify(data);
	let response = await fetch("/games/poker/createroom", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: data
	});
	response = await response.json();
	if (response.success) {
		window.location.pathname = response.redirect;
	} else {
		document.getElementById("errormsg").innerHTML = response.errormessage;
	}
}

document.getElementById("createroombtn").onclick = async (event) => {
	await createRoom(event);
};

document.getElementById("showroomsbtn").onclick = async (event) => {
	await getpublicrooms();
};

window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
	poker_socket.disconnect(true);
});

window.onload = async () => {
	setCSStheme("poker");
	setHeaderIcons();
	await getpublicrooms();
};

function toggleMenu(e) {
	e.preventDefault();
	document.querySelector("drop-down-options").classList.toggle("show");
}
