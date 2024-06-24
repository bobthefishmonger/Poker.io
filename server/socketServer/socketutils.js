const RedisClient = require("../expressServer/redis.js");

const poker_sockets = new Map();
const blackjack_sockets = new Map();
const roulette_sockets = new Map();
const globalsockets = new Map();

const sockets = [poker_sockets, blackjack_sockets, roulette_sockets, globalsockets];
const types = ["poker_socket", "blackjack_socket", "roulette_socket", "socket"]

function getpath(socket){
    return socket.request.headers.referer.split(socket.request.headers.host)[1]
}

async function anysocketconnect(socket, type){
    try{
        sockets[type].set(socket.id, socket);
        await RedisClient.setSession(socket.request.sessionID, `socketids.${types[type]}`, socket.id);
    }
    catch{
        console.warn("Already open whilst loading?");
        socket.emit("refresh");
    }
    return socket.request.sessionID;
}

async function anysocketdisconnect(socket, type){
    try{
        await RedisClient.setSession(socket.request.sessionID, `socketids.${types[type]}`, null)
        sockets[type].delete(socket.id);
    }
    catch (err){
        console.warn("Disconnect: Already open whilst loading");
    }
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


function getpokersocket(socketID){
    return poker_sockets.get(socketID);
}

module.exports = {
    getpath,
    nextsetup,
    anysocketconnect,
    anysocketdisconnect,
    getpokersocket
}