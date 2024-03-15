class Player{
    constructor(id, username, avatar){
        this.username = username;
        this.id = id;
        this.avatar = avatar;
        this.isDrawing = false;
        this.score = 0;       
        this.isDone = false; 
        this.hasGuessed = false;
        this.isChoosing = false;
    }
    resetScore(){
        this.score = 0;
    }
    resetState(){
        this.isChoosing = false;
        this.hasGuessed = false;
        this.isDrawing = false;
    }
}

module.exports = Player;