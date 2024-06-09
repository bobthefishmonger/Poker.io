window.onload = ()=>{
    setCSStheme("leaderboard");
}
window.addEventListener("beforeunload", ()=>{
    socket.disconnect(true);
});