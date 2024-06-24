socket.on("nextsetup", (callback)=>{
    roulette_socket = io("/roulette");
    callback();
});

window.onload = ()=>{
    setCSStheme("roulette");
}
window.addEventListener("beforeunload", ()=>{
    socket.disconnect(true);
    roulette_socket.disconnect(true);
});