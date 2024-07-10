document.getElementById("loginform").addEventListener("submit", submitsignup);
const Errortext = document.getElementById("errormsg");
async function submitsignup(event) {
	event.preventDefault();
	const data = {
		username: document.getElementById("username_input").value,
		password: document.getElementById("password_input").value,
		stayLoggedIn: document.getElementById("stayloggedin_input").checked
	};
	try {
		let response = await fetch("/account/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data)
		});
		response = await response.json();
		if (response.success) {
			window.location.href = window.location.origin + response.redirect;
		} else {
			Errortext.innerHTML = response.message;
		}
	} catch (err) {
		console.error(err.message);
		Errortext.innerHTML = "An Error was detected, please retry";
	}
}

window.onload = () => {
	setCSStheme("login");
};
window.addEventListener("beforeunload", () => {
	socket.disconnect(true);
});
