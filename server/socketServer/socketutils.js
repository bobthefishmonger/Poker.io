const poker_sockets = new Map();
const blackjack_sockets = new Map();
const roulette_sockets = new Map();
const globalsockets = new Map();

const sockets = [poker_sockets, blackjack_sockets, roulette_sockets, globalsockets];
const types = ["poker_socket", "blackjack_socket", "roulette_socket", "socket"]

function getpath(socket){
    return socket.handshake.headers.referer.split(socket.handshake.headers.host)[1]
}

async function emitnextsetup(socket){
    return new Promise((resolve, reject) => {
        try{
            const x = setTimeout(()=> {reject(`timed out ${socket.id}`)}, 2000);
            socket.emit("nextsetup", ()=>{
                clearTimeout(x);
                resolve();
            });
        }catch (err){
            console.error(err.message);
            reject(err.message);
        }
    })
}

async function nextsetup(socket){
    const path = getpath(socket);
    if (path.slice(0,6) === "/games" && path !== "/games/" && path !== "/games"){
        try{
            await emitnextsetup(socket);
        }catch{
            socket.emit("refresh");
        }
    }
}


module.exports = {
    getpath,
    nextsetup
}