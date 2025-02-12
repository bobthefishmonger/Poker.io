socket.on("Redirect Note", (message) => {
	alert(message);
});
socket.on("refresh", () => {
	location.reload();
});

function setCSStheme(name) {
	let theme;
	try {
		theme = getDisplayInformation().theme;
	} catch {
		theme = "Default";
	}
	if (theme === "Default") {
		return;
	}
	document
		.getElementById("appcsslink")
		.setAttribute("href", `../../../css/${theme}/app.css`);
	document
		.getElementById(`${name}csslink`)
		.setAttribute("href", `../../../css/${theme}/${name}.css`);
}

function getDisplayInformation() {
	let cookieValue = document.cookie
		.split("; ")
		.find((row) => row.startsWith("DisplayInformation"))
		?.split("=")[1];
	if (cookieValue) {
		cookieValue = JSON.parse(
			decodeURIComponent(cookieValue).split("j:")[1]
		);
		return cookieValue;
	} else {
		throw Error("Not logged in");
	}
}

//header
function setHeaderIcons() {
	try {
		const styleContent = `
   	 	.nav-bar-account-link::after {
			opacity: 1;
        	background-image: url("../../../uploads/profileimage/${
				getDisplayInformation().profileIcon
			}");
    	}
	`;
		const styleElement = document.createElement("style");
		styleElement.textContent = styleContent;
		document.head.appendChild(styleElement);
		document
			.getElementById("nav-bar-m-account-image")
			.setAttribute(
				"src",
				`../../../uploads/profileimage/${
					getDisplayInformation().profileIcon
				}`
			);
	} catch {}
}

// function alert(msg) {
// 	document.getElementById("noti").innerText = msg;
// 	document.classList.toggle("noti-visible");
// 	setTimeout(document.classList.toggle("noti-visible"), 750);
// }

//mobile
document.getElementById("toggle-menu-button").addEventListener("click", () => {
	document
		.querySelectorAll(".nav-bar-item:not(.nav-bar-title-container")
		.forEach((item) => {
			item.classList.toggle("m_hidden");
		});
});

async function friendreq(requests) {
	for (let i = 0; i < requests.length; i++) {
		const req = requests[i];
		const friend = document.getElementById("friendreq");
		friend.style.visibility = "visible";
		friend.addEventListener(
			"click",
			(e) => {
				if (e.target.id === "friendreq") return;
				if (e.target.id === "friendreqaccept") {
					//todo: POST accept
				} else {
					//todo: POST decline
				}
				friend.style.visibility = "hidden";
			},
			{ once: true }
		);
	}
}
