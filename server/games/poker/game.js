const rooms = require("./rooms.js");
const rounds = require("./rounds.js");

let PokerIO
function setPokerIO(IO){
    PokerIO = IO;
    rooms.setPokerIO(IO);
    rounds.setPokerIO(IO);
};

async function game(room){

}

function startgame(req, res) {
    const room = rooms.activerooms.get(req.session.PokerData?.roomID)
    if (!req.session.AccountInfo.Username || req.session.AccountInfo.Username !== room.host.username || room.round !== 0){
        res.json({success: false, message: "Invalid Credentials"});
    }else if (room.nplayers !== room.maxplayers){
        res.json({success: false, message: "The room is not full"});      
    }else{
        res.json({success: true});
        PokerIO.to(room.roomID).emit("gamestarting");
        setTimeout(async ()=>{
            await game(room);
        }, 1000);
    }
}

module.exports = {
    setPokerIO,
    startgame
}