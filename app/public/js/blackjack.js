window.onload = ()=>{
    setCSStheme("blackjack");
}
window.addEventListener("beforeunload", ()=>{
    socket.disconnect(true);
    blackjack_socket.disconnect(true);
});