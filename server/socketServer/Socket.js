const socketutils = require("./socketutils.js");
const poker_rooms = require("../games/poker/rooms.js");
//Socket
const RedisClient = require("../expressServer/redis.js");

async function poker_socket_setup(poker_socket){
    const reqsessionID = poker_socket.request.sessionID;
};
async function blackjack_socket_setup(blackjack_socket){
    const reqsessionID = blackjack_socket.request.sessionID;
};
async function roulette_socket_setup(roulette_socket){
    const reqsessionID = roulette_socket.request.sessionID;
};
async function socket_setup(socket){
    const reqsessionID = socket.request.sessionID; // this should be moved into an anysocketsetup function
};

function socketsetup(io){
    const PokerIO = io.of("/poker");
    const BlackjackIO = io.of("/Blackjack");
    const RouletteIO = io.of("/Roulette");

    PokerIO.on("connection", (poker_socket) => {
        poker_socket_setup(poker_socket);
    });

    BlackjackIO.on("connection", (blackjack_socket) => {
        blackjack_socket_setup(blackjack_socket);
    });

    RouletteIO.on("connection", (roulette_socket) => {
        roulette_socket_setup(roulette_socket);
    });

    io.on("connection", async (socket) => {
        socket_setup(socket);
    });
}
module.exports ={
    socketsetup
}