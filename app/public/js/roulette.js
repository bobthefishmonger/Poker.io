let roulette_socket;
let stack_size = 5000;
let betnum = 0;
let bets = {};
socket.on("nextsetup", (callback) => {
	roulette_socket = io("/roulette", { reconnection: false });
	callback();
	document.getElementById("play-round-btn").addEventListener("click", () => {
		const spinner = document.getElementById("roulette-spinner");
		roulette_socket.emit("spin", "betstuff goes here", (angle) => {
			//! betstuff ^^
			spinner.style.transform = `rotate(${angle}deg)`;
		});
	});
});
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

const clickedElements = {};
function squareOnClick(e) {
	const element = e.srcElement;
	element.classList.add("bet-on");
	let attr;
	try {
		attr = JSON.parse(element.getAttribute("betnums"));
	} catch {
		attr = null;
	}
	if (attr) {
		attr.add(betnum);
		element.setAttribute("betnums", JSON.stringify(attr));
	} else {
		element.setAttribute("betnums", JSON.stringify(new Set().add(betnum)));
	}
	if (clickedElements[betnum]) clickedElements[betnum].push([element.id]);
	else clickedElements[betnum] = [element.id];
	element.removeEventListener("click", squareOnClick);
	element.addEventListener("click", squareOffClick);
}

function squareOffClick(e) {
	const element = e.srcElement;
	element.classList.remove("bet-on");
	let attr = JSON.parse(element.getAttribute("betnums"));
	console.log(attr);
	attr.delete(betnum);
	element.setAttribute("betnums", JSON.stringify(attr));
	clickedElements[betnum].splice(
		clickedElements[betnum].indexOf(element.id),
		1
	);

	element.removeEventListener("click", squareOffClick);
	element.addEventListener("click", squareOnClick);
}

document.getElementById("new-bet-btn").addEventListener("click", () => {
	betnum += 1;
	document.getElementById("bet-container").style.display = "block";
	document.getElementById("new-bet-btn").style.display = "none";
	document.querySelectorAll(".square").forEach((e) => {
		e.addEventListener("click", squareOnClick);
	});
});

document.getElementById("cancel-bet-btn").addEventListener("click", () => {
	betnum -= 1;
	document.getElementById("bet-container").style.display = "none";
	document.getElementById("new-bet-btn").style.display = "block";
	document.querySelectorAll(".square").forEach((e) => {
		e.removeEventListener("click", squareOnClick);
		e.removeEventListener("click", squareOffClick);
	});
	// ! remove attributes
});

window.onload = () => {
	setCSStheme("roulette");
	setHeaderIcons();
	setRouletteGroups();
};

window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
	if (roulette_socket) {
		roulette_socket.disconnect(true);
	}
});
