function sethtml(players) {
	const content = document.getElementById("content");
	content.innerHTML = `
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
	rowHTML += `
		</div>
		<div class="playerstack">
			<p id="playerstack"></p>
		</div>
		<div class="player-options-container" id="player-options-container" style="display: none;"></div>
		<div class="rematchbtn-container">
			<button id="rematchbtnyes" style="display: none;">Rematch</button>
			<button id="rematchbtnno" style="display: none;">No Rematch</button>
		</div>
	`;
	content.insertAdjacentHTML("beforeend", rowHTML);
}

function setoptionshtml() {
	const container = document.getElementById("player-options-container");
	container.innerHTML = `<p>Your Turn</p>
			<div class="options">
				<p id="callAmount">To Call:</p> 
				<div id="player-optionsbtn-container">
					<button id="Foldbtn" style="display: none;" >Fold</button>
					<button id="Checkbtn" style="display: none;" >Check</button>
					<button id="Callbtn" style="display: none;" >Call</button>
					<button id="Raisebtn" style="display: none;" >Raise</button>
					<button id="All-inbtn" style="display: none;" >All-In</button>
				</div>
				<div id="raisecontainer" style="display: none;">
				<input id="RaiseAmountSlider" type="range">
					<p id="raiseAmount">£0</p>
					<button id="RaiseCancelbtn">Cancel</button>
					<button id="RaiseSubmitbtn">Submit</button>
				</div>
			</div>`;
}

function dealcardListeners(poker_socket) {
	poker_socket.on("Player Cards", (cards, i) => {
		document.querySelectorAll(`.player-cards-${i}`).forEach((card, j) => {
			card.style.backgroundImage = `url(../../../assets/Deck/${cards[j][1]}/card${cards[j][1]}_${cards[j][0]}.png)`;
		});
	});
	poker_socket.on("Flop cards", (cards) => {
		document
			.querySelectorAll(".community-cards-flop")
			.forEach((card, i) => {
				card.style.backgroundImage = `url(../../../assets/Deck/${cards[i][1]}/card${cards[i][1]}_${cards[i][0]}.png)`;
			});
	});
	poker_socket.on("Turn card", (card) => {
		document.querySelector(
			".community-cards-turn"
		).style.backgroundImage = `url(../../../assets/Deck/${card[1]}/card${card[1]}_${card[0]}.png)`;
	});
	poker_socket.on("River card", (card) => {
		document.querySelector(
			".community-cards-river"
		).style.backgroundImage = `url(../../../assets/Deck/${card[1]}/card${card[1]}_${card[0]}.png)`;
	});
}

function addPokerSocketListeners(poker_socket) {
	let blindplayer;
	poker_socket.emit("emittest");
	poker_socket.on("smallblind", (amount) => {
		alert(`you are small blind for £${amount}`);
		blindplayer = true;
	});
	poker_socket.on("bigblind", (amount) => {
		alert(`you are big blind for £${amount}`);
		blindplayer = true;
	});
	poker_socket.on("blinds", (players) => {
		if (!blindplayer) {
			alert(`${players[0]} is small blind, ${players[1]} is big blind`);
		}
	});
	poker_socket.on("stack", (stacksize) => {
		document.getElementById(
			"playerstack"
		).innerHTML = `Stack: £${stacksize}`;
	});
	poker_socket.on("Players Turn", getPlayerDecision);
	poker_socket.on("Stack change", (stack) => {
		document.getElementById("playerstack").innerHTML = `Stack: £${stack}`;
	});
	poker_socket.on("error", (msg) => {
		if (err === "timed out") {
			alert("You timed out");
			document.getElementById("player-options-container").style.display =
				"none";
		} else {
			alert(msg);
		}
	});
	poker_socket.on("Player Go", (uname, choice, firstbettingplayer) => {
		if (choice[0] === "Raise") {
			if (firstbettingplayer) {
				alert(`${uname} bet: £${choice[1]}`);
			} else {
				alert(`${uname} raised to £${choice[1]}`);
			}
		} else {
			alert(`${uname} played: ${choice[0]}`);
		}
	});
	poker_socket.on("finished go", (err) => {
		const container = document.getElementById("player-options-container");
		if (err) {
			alert(err);
		}
		container.style.display = "none";
	});

	poker_socket.on("winners", (winners, indexs, cards) => {
		alert(winners);
		winners.forEach((winner, i) => {
			document
				.querySelectorAll(`.player-cards-${indexs[i]}`)
				.forEach((card, j) => {
					card.style.backgroundImage = `url(../../../assets/Deck/${cards[i][j][1]}/card${cards[i][j][1]}_${cards[i][j][0]}.png)`;
				});
		});
	});
	let joinedrematch = false;
	poker_socket.on("rematch", (cb) => {
		const yesbtn = document.getElementById("rematchbtnyes");
		const nobtn = document.getElementById("rematchbtnno");
		yesbtn.style.display = "inline";
		yesbtn.innerHTML = "Create a rematch";
		yesbtn.addEventListener("click", () => {
			joinedrematch = true;
			cb(true);
		});
		nobtn.style.display = "inline";
		nobtn.innerHTML = "No rematch";
		nobtn.addEventListener("click", () => {
			cb(false);
		});
	});

	poker_socket.on("New Room", (id) => {
		if (joinedrematch) window.location.pathname = `/games/poker/${id}`;
		const yesbtn = document.getElementById("rematchbtnyes");
		const nobtn = document.getElementById("rematchbtnno");
		yesbtn.style.display = "inline";
		yesbtn.innerHTML = "Join the rematch";
		yesbtn.addEventListener("click", () => {
			window.location.pathname = `/games/poker/${id}`;
		});
		nobtn.style.display = "inline";
		nobtn.innerHTML = "Go to poker home";
		nobtn.addEventListener("click", () => {
			window.location.pathname = `/games/poker`;
		});
	});
	poker_socket.on("homebtn", () => {
		document.getElementById("rematchbtnyes").style.display = "none";
		const nobtn = document.getElementById("rematchbtnno");
		nobtn.style.display = "inline";
		nobtn.innerHTML = "Go to poker home";
		nobtn.addEventListener("click", () => {
			window.location.pathname = `/games/poker`;
		});
	});
	dealcardListeners(poker_socket);
}

function getPlayerDecision(
	options,
	firstbettingplayer,
	callAmount,
	stacksize,
	cb
) {
	const container = document.getElementById("player-options-container");
	container.style.display = "inline";
	setoptionshtml();
	if (firstbettingplayer) {
		document.getElementById("Raisebtn").innerHTML = "Bet";
		document.getElementById(
			"callAmount"
		).innerHTML = `Min bet: £${callAmount}`;
	} else {
		document.getElementById(
			"callAmount"
		).innerHTML = `To Call: £${callAmount}`;
	}
	options.forEach((option) => {
		setoptionlisteners(
			option,
			stacksize,
			firstbettingplayer,
			callAmount,
			cb
		);
	});
}

function setoptionlisteners(
	option,
	stacksize,
	firstbettingplayer,
	callAmount,
	cb
) {
	const btn = document.getElementById(`${option}btn`);
	btn.style.display = "inline";
	if (option === "Raise") {
		const input = document.getElementById("RaiseAmountSlider");
		btn.addEventListener("click", () => {
			document.getElementById("raisecontainer").style.display = "inline";
			document.getElementById(
				"player-optionsbtn-container"
			).style.display = "none";
			input.max = stacksize - 5;
			input.step = 5;
			if (firstbettingplayer) {
				input.value = callAmount;
				input.min = callAmount;
				document.getElementById(
					"raiseAmount"
				).innerHTML = `£${input.value}`;
			} else {
				input.value = callAmount + 5;
				input.min = callAmount + 5;
				document.getElementById("raiseAmount").innerHTML = `£${
					input.value
				} (+${input.value - callAmount})`;
			}
		});
		document
			.getElementById("RaiseCancelbtn")
			.addEventListener("click", () => {
				document.getElementById("raisecontainer").style.display =
					"none";
				document.getElementById(
					"player-optionsbtn-container"
				).style.display = "inline";
			});
		input.addEventListener("input", () => {
			let inputValue = Number(input.value);

			if (firstbettingplayer) {
				document.getElementById(
					"raiseAmount"
				).innerHTML = `£${inputValue}`;
			} else {
				document.getElementById(
					"raiseAmount"
				).innerHTML = `£${inputValue} (+${inputValue - callAmount})`;
			}
		});
		document
			.getElementById("RaiseSubmitbtn")
			.addEventListener("click", () => {
				const val = input.value;
				cb(["Raise", val]);
			});
	} else {
		btn.addEventListener("click", () => {
			cb([option]);
		});
	}
}

function rungame(poker_socket, players) {
	sethtml(players);
	addPokerSocketListeners(poker_socket);
}
