window.onload = ()=>{
    setCSStheme("roulette");
}
window.addEventListener("beforeunload", ()=>{
    socket.disconnect(true);
    roulette_socket.disconnect(true);
});