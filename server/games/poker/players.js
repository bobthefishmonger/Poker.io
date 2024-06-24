const activePlayers = new Map();

class Player{
    constructor(sessionID, poker_socket, username, stacksize, host, icon, earnings){
        this.sessionID = sessionID;
        this.poker_socket = poker_socket;
        this.username = username;
        this.cards = [];
        this.stack = stacksize;
        this.host = host;
        this.icon = icon;
        this.earnings = earnings;
        this.kicked = false;
        activePlayers.set(this.username, this);
    }
}


module.exports = {
    activePlayers,
    Player
}