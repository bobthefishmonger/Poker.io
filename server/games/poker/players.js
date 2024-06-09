const activePlayers = new Map();

class Player{
    constructor(username, stacksize, host){
        this.username = username;
        this.cards = [];
        this.stack = stacksize;
        this.host = host
        activePlayers.set(this.username, this);
    }
}


module.exports = {
    activePlayers,
    Player
}