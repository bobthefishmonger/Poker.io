socket.on("Redirect Note", (message) => {
	alert(message);
	//Could replace with a much nicer notification system?
	//function alert(){
	// const notification = document.getElementByID("notification");
	//  notification.visibility = visilble;
	//  notification.innerHTML = `${message}`;
	//  setTimeOut(notificaiton.visibility = hidden;, 3);
	// }
});
socket.on("refresh", () => {
	location.reload();
});

function setCSStheme(name) {
	const theme = getDisplayInformation()?.theme || "Default";
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
	}
}
