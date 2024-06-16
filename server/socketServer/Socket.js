const socketutils = require("./socketutils.js");
const poker_rooms = require("../games/poker/rooms.js");

//Socket
function socketsetup(io, middleware){
    io.engine.use(middleware);
    const PokerIO = io.of("/poker");
    const BlackjackIO = io.of("/Blackjack");
    const RouletteIO = io.of("/Roulette");


    PokerIO.on("connection", (poker_socket) => {});

    BlackjackIO.on("connection", (blackjack_socket) => {});

    RouletteIO.on("connection", (roulette_socket) => {});

    io.on("connection", async (socket) => {
        await socketutils.nextsetup(socket);
    });
}
module.exports = {
    socketsetup
}