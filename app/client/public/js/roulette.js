let roulette_socket;
const betform = document.getElementById("bet-input");
const bettogglebtn = document.getElementById("toggle-betting");
const overlay = document.getElementById("board-overlay");

socket.on("nextsetup", (cb) => {
	roulette_socket = io("/roulette", { reconnection: false });
	cb();
	let degrees_spun = 0;

	function spin() {
		const deg = 1000; //! change this
		roulette_socket.emit("spinwheel", (deg) => {
			degrees_spun += deg;
			document.getElementById(
				"roulette-spinner"
			).style.transform = `rotate(${degrees_spun}deg)`;
		});
	}

	const spinbtn = document.getElementById("spinbtn");

	spinbtn.addEventListener("click", spin);
});

window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
	if (roulette_socket) {
		roulette_socket.disconnect(true);
	}
});

window.onload = () => {
	setCSStheme("roulette");
	setHeaderIcons();
	setOverlayPoints();
	setRouletteGroups(); // !redo for the square highlights/ well add a bit more
};

function setRouletteGroups() {
	function sethighlighted(listener, outcome) {
		document.querySelector(listener).addEventListener("mouseenter", () => {
			document.querySelectorAll(outcome).forEach((e) => {
				e.classList.add("highlighted");
			});
		});
		document.querySelector(listener).addEventListener("mouseleave", () => {
			document.querySelectorAll(outcome).forEach((e) => {
				e.classList.remove("highlighted");
			});
		});
	}
	for (let i = 1; i < 4; i++) {
		sethighlighted(`.row-bet-${i}`, `.row${i}`);
		sethighlighted(`.dozen-bet-${i}`, `.dozen-${i}`);
	}
	sethighlighted(".red-choice", ".red");
	sethighlighted(".black-choice", ".black");
	sethighlighted(".low-bet", ".eighteen-1");
	sethighlighted(".high-bet", ".eighteen-2");
	sethighlighted(".odd-bet", ".odd");
	sethighlighted(".even-bet", ".even");
}

function setOverlayPoints() {
	// main
	for (let i = 0; i < 3; i++) {
		//corner bets
		for (let j = 0; j < 11; j++) {
			overlay.innerHTML += `<div class="gridpos"
			style="top: calc(var(--top-centering-margin) + ${i}* var(--square-offset));
			left: calc(var(--square-offset) * ${j + 2});
			" type="${i === 0 ? "line" : "cornerBet"}" index="${
				Math.max(0, 11 * (i - 1)) + j
			}"></div>`;
		}
		//verticle bets
		for (let j = 0; j < 12; j++) {
			overlay.innerHTML += `<div class="gridpos"
			style="top: calc(var(--top-centering-margin) + ${i}* var(--square-offset));
			left: calc(var(--square-offset) * ${j + 1} + var(--square-offset) / 2);
			" type="${i === 0 ? "street" : "split"}" index="${
				Math.max(0, 12 * (i - 1)) + j
			}"></div>`;
		}
		//horizontal bets
		for (let j = 0; j < 11; j++) {
			overlay.innerHTML += `<div class="gridpos"
			style="top: calc(var(--top-centering-margin) + ${i}* var(--square-offset) + var(--square-offset) / 2);
			left: calc(var(--square-offset) * ${j + 2});
			" type="split" index="${24 + 11 * i + j}"></div>`;
		}
		//center bets
		for (let j = 0; j < 12; j++) {
			overlay.innerHTML += `<div class="gridpos"
			style="top: calc(var(--top-centering-margin) + ${i}* var(--square-offset) + var(--square-offset) / 2);
			left: calc(var(--square-offset) * ${j + 1} + var(--square-offset) / 2);
			" type="straightUp" index="${12 * i + j}"></div>`;
		}
	}
	//zero
	overlay.innerHTML += `<div class="gridpos" 
	style="top: calc(var(--top-centering-margin) + var(--zero-square-height) / 2 + var(--square-border-size));
	left: calc(var(--square-offset) / 2);" 
	type="straightUp" index="36"></div>`;

	// special - right;
	for (let i = 0; i < 3; i++) {
		overlay.innerHTML += `<div class="gridpos"
			style="top: calc(var(--top-centering-margin) + ${i}* var(--square-offset) + var(--square-offset) / 2);
			left: calc(var(--square-offset) * 13 + var(--square-offset) / 2);
		" type="column" index="${i}"></div>`;
	}
	// special-down
	for (let i = 0; i < 3; i++) {
		overlay.innerHTML += `<div class="gridpos" 
		style="top: calc(var(--top-centering-margin) + 3 * var(--square-offset) + var(--square-offset) / 2);
		left: calc(var(--square-offset) * ${4 * i + 3});
		" type="dozen" index="${i}"></div>`;
	}
	for (let i = 0; i < 6; i++) {
		overlay.innerHTML += `<div class="gridpos" 
		style="top: calc(var(--top-centering-margin) + 4 * var(--square-offset) + var(--square-offset) / 2);
		left: calc(var(--square-offset) * ${2 * i + 2});
		" type="evenMoney" index="${i}"></div>`;
	}
}

function offbetclick(e) {
	const square = e.target;
	square.classList.remove("chosen");
	square.removeEventListener("click", offbetclick);
	square.addEventListener("click", handlebetclick);
}

function handlebetclick(e) {
	const square = e.target;
	console.log(square.getAttribute("type"));
	console.log(square.getAttribute("index"));
	square.classList.add("chosen");
	console.log(
		squares[square.getAttribute("type")][
			Number(square.getAttribute("index"))
		]
	);

	square.removeEventListener("click", handlebetclick);
	square.addEventListener("click", offbetclick);
	betform.style.visibility = "visible";
	betform.addEventListener("submit", (e) => {
		e.preventDefault();
		endSetBets();
	});
}

function setBets() {
	bettogglebtn.innerHTML = "Cancel";
	overlay.style.pointerEvents = "auto";
	document.querySelectorAll(".gridpos:not(.chosen)").forEach((pos) => {
		pos.style.visibility = "visible";
		pos.addEventListener("click", handlebetclick);
	});
	bettogglebtn.removeEventListener("click", setBets);
	bettogglebtn.addEventListener("click", endSetBets);
}

function endSetBets() {
	betform.style.visibility = "hidden";
	bettogglebtn.innerHTML = "PLACE BET";
	overlay.style.pointerEvents = "none";
	document.querySelectorAll(".gridpos:not(.chosen)").forEach((pos) => {
		pos.style.visibility = "hidden";
		pos.removeEventListener("click", handlebetclick);
	});
	bettogglebtn.removeEventListener("click", endSetBets);
	bettogglebtn.addEventListener("click", setBets);
}

bettogglebtn.addEventListener("click", setBets);
