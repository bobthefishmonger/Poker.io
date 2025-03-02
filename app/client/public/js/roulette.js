let roulette_socket;
const spinbtn = document.getElementById("spinbtn");
const betform = document.getElementById("bet-input");
const bettogglebtn = document.getElementById("toggle-betting");
const betsubmitbtn = document.getElementById("submit-btn");
const betAmountSlider = document.getElementById("bet-amount-input");
const overlay = document.getElementById("board-overlay");
const betDisplay = document.getElementById("bet-display");
const stackDisplay = document.getElementById("stack-display");
const winningsDisplay = document.getElementById("winnings-display");
const spinner = document.getElementById("roulette-spinner");
const maxstack = 5000;
const resetOverlay = document.getElementById("roulette-reset-overlay");
const resetbutton = document.getElementById("resetbtn");
let bets = {};
let canspin = true;
let winnings = getDisplayInformation().Earnings.Roulette;
let stack = maxstack;
socket.on("nextsetup", (cb) => {
	roulette_socket = io("/roulette", { reconnection: false });
	cb();
});

async function spin_request() {
	return new Promise(async (resolve, reject) => {
		const data = JSON.stringify({ bets: bets });
		let response = await fetch("/games/roulette/spin", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: data
		});
		response = await response.json();
		if (!response.success) {
			reject(response.errormessage);
		} else {
			resolve(response);
		}
	});
}
async function spin() {
	if (!canspin) return;
	if (!Object.keys(bets)[0]) {
		alert("Please place a bet");
		return;
	}
	try {
		canspin = false;
		const spin_data = await spin_request();
		spinner.style.transform = `rotate(${spin_data.degree}deg)`;
		setTimeout(() => {
			// alert(`Landed on ${spin_data.square}`);
			winnings += spin_data.winnings[1];
			winningsDisplay.innerText = `Winnings: £${winnings}`;
			Object.entries(spin_data.winnings[0]).forEach(([type, obj]) => {
				Object.entries(obj).forEach(([index]) => {
					const elements = document.querySelectorAll(
						`.gridpos[type="${type}"][index="${index}"]`
					);
					elements.forEach((element) => {
						element.classList.add("winning-bet");
					});
				});
			});
			resetOverlay.classList.add("show-overlay");
			resetbutton.addEventListener("click", reset);
		}, 2100);
	} catch (e) {
		console.warn(e);
	}
}
function reset() {
	spinner.style.transform = ``;
	document.querySelectorAll(".winning-bet").forEach((e) => {
		e.classList.remove("winning-bet");
	});
	document.querySelectorAll(".chosen").forEach((e) => {
		e.style.visibility = "hidden";
		e.classList.remove("chosen");
	});
	bets = {};
	stack = maxstack;
	stackDisplay.innerText = `Stack: £${stack}`;
	betAmountSlider.max = stack;
	canspin = true;
	resetOverlay.classList.add("show-overlay");
	setTimeout(() => {
		resetbutton.removeEventListener("click", reset);
	}, 1000);
}

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
	square.classList.remove("selected");
	square.removeEventListener("click", offbetclick);
	square.addEventListener("click", handlebetclick);
}

function handlebetclick(e) {
	const square = e.target;
	if (square.classList.contains("selected")) {
		square.classList.remove("selected");
		square.removeEventListener("click", offbetclick);
		square.addEventListener("click", handlebetclick);
	} else {
		document
			.getElementsByClassName("selected")[0]
			?.classList.remove("selected");
		square.classList.add("selected");
		square.removeEventListener("click", handlebetclick);
		square.addEventListener("click", offbetclick);
		betform.style.visibility = "visible";
		betform.addEventListener("submit", (e) => {
			e.preventDefault();
			endSetBets();
		});
	}
}

function setBets() {
	if (stack < 50) {
		alert("You do not have enough in a stack to bet");
		return;
	}
	betform.style.visibility = "visible";
	betform.classList.add("active-betting");
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
	betform.classList.remove("active-betting");
	bettogglebtn.innerHTML = "BET";
	overlay.style.pointerEvents = "none";
	document.querySelectorAll(".gridpos:not(.chosen)").forEach((pos) => {
		pos.style.visibility = "hidden";
		pos.removeEventListener("click", handlebetclick);
	});
	document.querySelectorAll(".selected").forEach((e) => {
		e.classList.remove("selected");
	});
	bettogglebtn.removeEventListener("click", endSetBets);
	bettogglebtn.addEventListener("click", setBets);
}

function saveBets(e) {
	e.preventDefault();
	try {
		const bet = document.getElementsByClassName("selected")[0];
		const betamount = betAmountSlider.value;
		bet.classList.add("chosen");
		bet.classList.remove("selected");
		bets[`${bet.getAttribute("type")}:${bet.getAttribute("index")}`] =
			betamount;
		stack -= betamount;
		betAmountSlider.max = stack;
		stackDisplay.innerText = `Stack: £${stack}`;
		endSetBets();
	} catch (e) {
		console.error(e);
		console.warn("No bet placed");
		alert("Please place a bet");
	}
}

function betAmountInput(e) {
	e.preventDefault();
	betDisplay.innerText = `£${betAmountSlider.value}`;
}
betAmountSlider.value = betAmountSlider.min;
betDisplay.innerText = `£${betAmountSlider.value}`;
betAmountSlider.addEventListener("input", betAmountInput);
betsubmitbtn.addEventListener("click", saveBets);
bettogglebtn.addEventListener("click", setBets);
spinbtn.addEventListener("click", spin);
stackDisplay.innerText = `Stack: £${maxstack}`;
winningsDisplay.innerText = `Winnings: £${winnings}`;
resetbutton.addEventListener("click", reset);

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
	setRouletteGroups();
};
