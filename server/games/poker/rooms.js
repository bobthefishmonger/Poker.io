const activerooms = new Map();
const players = require("./players.js");

class Poker_Room{
    constructor(maxplayers, stacksize, visibility){
        this.players = new Map();  // username, class 
        this.usernames = [] //usernames
        this.nplayers = 0;
        this.maxplayers = maxplayers;
        this.host = null; //set as the first player to join, they can add remove ect
        this.pot = 0;
        this.stacksize = stacksize;
        this.round = 0 //0 is people joining (pre-rounds)
        this.visibility = visibility
        this.deletetimer = null; // we could change this to x amount of delete room, if no one has joined
                                //depends if the host will be auto redirected or not
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
    let {visibility, maxplayers, stacksize} = req.body;
    if (visibility !== "public" && visibility !== "private"){
        res.json({"success": false, "errormessage": "Invalid visibility choice", "redirect":"/games/poker"});
    }
    else if (isNaN(maxplayers) || Number(maxplayers) < 2 || Number(maxplayers) > 12){
        res.json({"success": false, "errormessage": "Invalid number of max players", "redirect":"/games/poker"});
    }
    else if (isNaN(stacksize) || (stacksize !== "2500" && stacksize !== "5000" && stacksize !== "10000")){
        res.json({"success": false, "errormessage": "Invalid stack size choice", "redirect":"/games/poker"});
    }else{
        const room = new Poker_Room(maxplayers, stacksize, visibility);
        res.json({
            "success": true,
            "message": `Created a ${room.visibility} room with ${maxplayers} players \n with a roomID 
            <a href="/games/poker/${room.roomID}">${room.roomID}</a> \n and with a stack of ${room.stacksize}`
        });
    }
}

function joinroom(req, res, roomID, room){
    req.session.PokerData = {
        roomID: room.roomID,
        maxplayers: room.maxplayers,
        gameactive: false
    }
    room.nplayers += 1;
    room.players.set(req.session.AccountInfo.Username, new players.Player(req.session.AccountInfo.Username, room.stacksize, room.nplayers === 1));
    room.usernames.push(req.session.AccountInfo.Username);
    if (room.nplayers === 1){
        room.host = room.players.get(req.session.AccountInfo.Username);
    }
    req.session.ingame = true;
    res.json({success: true, message: `${roomID} \n This room has ${room.nplayers} players in out of ${room.maxplayers}
     You are host: ${room.players.get(req.session.AccountInfo.Username).host} (note this does not refresh, 
     but changing host works [if the user disconnects])
    <script src="/socket.io/socket.io.js"></script>
    <script>
    const socket = io();
    const poker_socket = io("/poker");
    window.addEventListener("beforeunload", ()=>{
        poker_socket.disconnect(true)
    });
    </script>`});
}


function checkroomID(req, res, roomID){
    if (!roomID || isNaN(roomID) || !(roomID.toString().length === 6)){
        res.json({success: false, message:"Invalid roomID"});
    }else{
        roomID = Number(roomID);
        if (!activerooms.has(roomID)){
            res.json("Not an active room");
        }else{
            const room = activerooms.get(roomID);
            clearTimeout(room.deletetimer);
            room.deletetimer = null;
            if (!room.round){
                if (room.nplayers < room.maxplayers){
                    joinroom(req, res, roomID, room);
                }else{
                    res.json({success: false, message:`${room.roomID} is already full. Please join another room, or contact the host`});
                }
            }else{
                res.json({success: false, messsage:`This game has already begun. Please join another room, or contact the host`});
            }
        }
    }
};

function showpublicrooms(req, res){
    const publicRooms = Array.from(activerooms.values())
                         .filter(room => room.visibility === "public" && room.round === 0)
                         .map(room => ({
                            "RoomID": room.roomID,
                            "nplayers": room.nplayers,
                            "maxplayers": room.maxplayers,
                            "stacksize": room.stacksize
                        }));
    res.json({"rooms": JSON.stringify(publicRooms)});
};


async function pokerDisconnect(session, path){
    if (session.PokerData && activerooms.get(Number(path.slice(-6)))){
        if (session.PokerData.gameactive){
            activeDisconnect(session);
        }
        else{
            waitingDisconnect(session);
        }
        session.ingame = false;
        session.save();
    }
}

function waitingDisconnect(session) {
    const room = activerooms.get(session.PokerData.roomID);
    room.nplayers -= 1;
    room.players.delete(players.activePlayers.get(session.AccountInfo.Username)); //not deleting right
    room.usernames = room.usernames.filter(username=> username !== session.AccountInfo.Username);
    console.log(room.host)
    if (room.usernames[0]){
        room.players.get(room.usernames[0]).host = true;
        room.host = room.players.get(room.usernames[0]);
        console.log(room.host)
    }else{
        room.deletetimer = setTimeout(()=>{room.deletethis();console.log("deleted")},5*60*1000);
    }
    delete session.PokerData;
}

function activeDisconnect(session){
    //to be added
}

module.exports = {
    checkroomID,
    createRoom,
    pokerDisconnect,
    showpublicrooms
}