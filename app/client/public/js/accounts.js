async function logout(event) {
	event.preventDefault();
	let response = await fetch("/account/logout", { method: "POST" });
	response = await response.json();
	if (response.success) {
		window.location.pathname = response.redirect;
	} else {
		document.getElementById("errormsg").innerHTML = "An Error occured";
	}
}

async function deleteaccount(event) {
	event.preventDefault();
	let response = await fetch("/account/deleteaccount", { method: "POST" });
	response = await response.json();
	if (response.success) {
		window.location.pathname = response.redirect;
	} else {
		if (response.message) {
			alert(response.message);
		} else {
			document.getElementById("errormsg").innerHTML = "An Error occured";
		}
	}
}

async function addprofileicon() {
	let data = new FormData();
	data.append("file", document.getElementById("profilepicinput").files[0]);
	let response = await fetch("/account/uploadimage", {
		method: "POST",
		body: data
	});
	response = await response.json();
	if (response.success) {
		try {
			document.getElementById("successmessage").innerHTML =
				"Successfully uploaded";
			document
				.getElementById("profileicon")
				.setAttribute(
					"src",
					`../../uploads/profileimage/${
						getDisplayInformation().profileIcon
					}`
				);
		} catch {
			document.getElementById("successmessage").innerHTML =
				"An error occured, please retry";
			document.getElementById("successmessage").classList.add("Errors");
		}
	} else {
		document.getElementById("successmessage").innerHTML =
			"An error occured, please retry";
		document.getElementById("successmessage").classList.add("Errors");
	}
}

async function updatetheme() {
	let response = await fetch("/account/updatetheme", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			theme: document.getElementById("themechoices").value
		})
	});
	response = await response.json();
	if (response.success) {
		try {
			document.getElementById("successmessage").innerHTML =
				"Successfully uploaded";
			document
				.getElementById("profileicon")
				.setAttribute(
					"src",
					`../../uploads/profileimage/${
						getDisplayInformation().profileIcon
					}`
				);
		} catch {
			document.getElementById("successmessage").innerHTML =
				"An error occured, please retry";
			document.getElementById("successmessage").classList.add("Errors");
		}
	} else {
		document.getElementById("successmessage").innerHTML =
			"An error occured, please retry";
		document.getElementById("successmessage").classList.add("Errors");
	}
}

document.getElementById("themesubmitbtn").onclick = async () => {
	await updatetheme();
	setCSStheme("accounts");
};

document.getElementById("iconsubmitbtn").onclick = async () => {
	await addprofileicon();
};

document.getElementById("logoutbtn").onclick = logout;
document.getElementById("deleteaccountbtn").onclick = deleteaccount;
window.onload = () => {
	try {
		document
			.getElementById("profileicon")
			.setAttribute(
				"src",
				`../../uploads/profileimage/${
					getDisplayInformation().profileIcon
				}`
			);
		setCSStheme("accounts");
		setEarningstable();
	} catch {
		window.location.reload();
	}
	setHeaderIcons();
};
function setEarningstable() {
	const info = getDisplayInformation();
	const earnings = info.Earnings;
	document.getElementById("profile-name").innerHTML = info.name;
	document.getElementById("pokerEarnings").innerHTML = `£${earnings.Poker}`;
	document.getElementById(
		"blackjackEarnings"
	).innerHTML = `£${earnings.Blackjack}`;
	document.getElementById(
		"rouletteEarnings"
	).innerHTML = `£${earnings.Roulette}`;
}

window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
