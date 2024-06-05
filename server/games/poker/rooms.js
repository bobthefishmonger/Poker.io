const activerooms = new Map();

const players = require("./players.js");

class Poker_Room{
    constructor(maxplayers, stacksize){
        this.nplayers = 0; //the host would be redirected so they would add + 1
        this.players = new Map();  // username, class 
        this.maxplayers = maxplayers;
        this.host = null; //set as the first player to join, they can add remove ect
        this.pot = 0;
        this.stacksize = stacksize;
        this.round = 0 //0 is people joining (pre-rounds)
        // this.public = public      // add this flag later, when we add actual implimentation for the menu
        do{
            this.roomID = Math.trunc(100000 + Math.random() * 900000);
        } while (activerooms.has(this.roomID))
        activerooms.set(this.roomID, this);
    }
    deletethis(){
        activerooms.delete(this.roomID);
    };
}

function createRoom(req, res){
    const maxplayers = req.query.maxplayers;
    const stacksize = req.query.stacksize;
    if (isNaN(maxplayers) || Number(maxplayers) < 2 || Number(maxplayers) > 9){
        req.session.redirectNote = "Invalid Number of Players";
        res.redirect("/games/poker");
    }
    else if (isNaN(stacksize) || (stacksize !== "2500" && stacksize !== "5000" && stacksize !== "10000")){
        req.session.redirectNote = "Invalid Stacksize";
        res.redirect("/games/poker");
    }else{
        const room = new Poker_Room(maxplayers, stacksize);
        res.send(`Created a room with ${maxplayers} players \n with a roomID <a href="/games/poker/${room.roomID}">${room.roomID}</a> \n and with a stack of ${room.stacksize}`);
    }
}


function checkroomID(req, res, roomID){
    if (!roomID || isNaN(roomID) || !(roomID.toString().length === 6)){
        res.send("There is an error");
    }else{
        roomID = Number(roomID);
        if (!activerooms.has(roomID)){
            res.send("Not an active room");
        }else{
            const room = activerooms.get(roomID);
            if (!room.round){
                if (room.nplayers < room.maxplayers){
                    room.nplayers += 1; 
                    req.session.PokerData = {
                        roomID: room.roomID,
                        nplayers: room.nplayers,
                        maxplayers: room.maxplayers,
                        gameactive: false
                    }
                    new players.Player(req.session.AccountInfo.Username, room.stacksize);
                    req.session.ingame = true;
                    res.send(`${roomID} \n This room has ${room.nplayers} players in out of ${room.maxplayers} <script src="/socket.io/socket.io.js"></script>
                    <script>
                    const socket = io();
                    const poker_socket = io("/poker");
                    window.addEventListener("beforeunload", ()=>{
                        poker_socket.disconnect(true)
                    });
                    </script>`);
                }else{
                    res.send(`${room.roomID} is already full. Please join another room, or contact the host`);
                }
            }else{
                res.send(`This game has already begun. Please join another room, or contact the host`);
            }
        }
    }
};

async function pokerDisconnect(session){
    if (session.PokerData){
        if (session.PokerData.gameactive){
            activeDisconnect(session);
        }
        else{
            waitingDisconnect(session);
        }
    }
    session.ingame = false;
    session.save();
}

function waitingDisconnect(session) {
    const room = activerooms.get(session.PokerData.roomID);
    room.nplayers -= 1;
    room.players.delete(players.activePlayers.get(session.AccountInfo.Username));
    delete session.PokerData;
}

function activeDisconnect(session){
}

module.exports = {
    checkroomID,
    createRoom,
    pokerDisconnect
}