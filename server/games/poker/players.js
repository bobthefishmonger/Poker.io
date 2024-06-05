const activePlayers = new Map();

class Player{
    constructor(username, stacksize){
        this.username = username;
        this.cards = [];
        this.stack = stacksize;
        activePlayers.set(this.username, this);
    }
}


module.exports = {
    activePlayers,
    Player
}