window.onload = ()=>{
    setCSStheme("404page");
}

window.addEventListener("beforeunload", ()=>{
    socket.disconnect(true);
});