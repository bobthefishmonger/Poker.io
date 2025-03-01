document.getElementById("loginform").addEventListener("submit", verify);
const Errortext = document.getElementById("errormsg");

async function verify(e) {
	e.preventDefault();
	const data = {
		username: document.getElementById("username_input").value,
		password: document.getElementById("password_input").value,
		key: window.location.pathname.slice(0, -1).split("/").pop()
	};
	try {
		let response = await fetch("/account/deleteaccount/verify/submit", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data)
		});
		response = await response.json();
		if (response.success) {
			window.location.href = "/home/";
		} else {
			Errortext.innerHTML = response.message;
		}
	} catch (err) {
		console.error(err.message);
		Errortext.innerHTML = "An Error was detected, please retry";
	}
}
