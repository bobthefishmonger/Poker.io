window.onload = ()=>{
    setCSStheme("missingPA");
}
window.addEventListener("beforeunload", ()=>{
    socket.disconnect(true);
});