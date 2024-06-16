let poker_socket;
socket.on("nextsetup", (callback)=>{
    poker_socket = io("/poker");
    callback();

    poker_socket.on("connect", async ()=>{
        const data = {roomID: window.location.href.slice(-6)}
        let response = await fetch("/games/poker/joinroom",{
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        response = await response.json();
        document.getElementById("testmsg").innerHTML = response.message;
    });
    poker_socket.on("updatehost", ()=>{document.getElementById("testmsg").innerHTMl += "now you are host"})
});

window.addEventListener("beforeunload", ()=>{
    socket.disconnect(true);
    poker_socket.disconnect(true);
});

window.onload = ()=>{
    setCSStheme("pokergame");
}