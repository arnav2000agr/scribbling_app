const words = require("./words");

class Game {
  constructor() {
    this.playersList = [];
    this.drawer = "";
    this.time = 60;
    this.draw = []
    this.totalTime = 60;
    this.currentWord = "";
    this.drawerWidth = 0;
    this.drawerHeight = 0;
    this.totalRounds = 3;
    this.currentRound = 1;
    this.isStarted = false;
    this.isHintSent = false;
  }
  addPlayer(player) {
    this.playersList.push(player);
  }
  getDrawer() {
    return this.playersList.find(player=> player.isDrawing === true);
  }
  getPlayers() {
    return this.playersList;
  }
  removePlayer(playerToRemove) {
    this.playersList = this.playersList.filter(
      (player) => player.id !== playerToRemove
    );
  }
  checkLastRound(){
    return this.currentRound === this.totalRounds;
  }
  getTime(){
    return this.time;
  }
  oneSecondPassed(){
    this.time--;
  }
  startGame() {
    this.isStarted = true;
  }
  chooseNextPlayer() {
    const remainingPlayers = this.getRemainingPlayers();
    if (!remainingPlayers.length) {
      this.startNewRound();
      this.chooseNextPlayer();
    }
    else {
      const chosenPlayer =
        remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      chosenPlayer.isDone = true;
      chosenPlayer.isChoosing = true;
      chosenPlayer.hasGuessed = true;
      this.drawer = chosenPlayer.username;
    }
  }
  getRemainingPlayers() {
    return this.playersList.filter((player) => !player.isDone);
  }
  chooseThreeWords() {
    const shuffledWords = words.sort(() => Math.random() - 0.5);
    return shuffledWords.slice(0, 3);
  }
  startNextTurn() {
    this.playersList.map((player) => (player.hasGuessed = false));
    this.currentWord = "";
    this.isHintSent = false;
  }
  startNewRound() {
    this.currentRound++;
    this.playersList.map((player) => (player.isDone = false));
  }
  getHint() {
    const hint = [];
    const indexesDone = [];
    for (let i = 0; i < Math.floor(this.currentWord.length / 2); i++) {
      const randomIndex = Math.floor(Math.random() * this.currentWord.length);
      if (indexesDone.find((index) => index === randomIndex)) {
        i--;
        continue;
      }
      indexesDone.push(randomIndex);
      const correspondingLetter = this.currentWord[randomIndex];
      hint.push({ randomIndex, correspondingLetter });
    }
    return hint;
  }
  getWordToGuess() {
    let wordToGuess = [];
    for (let i = 0; i < this.currentWord.length; i++) {
      const letter = this.currentWord[i];
      if (letter === " ") {
        wordToGuess.push(letter);
      } else {
        wordToGuess.push("_");
      }
    }
    return wordToGuess;
  }
  reset() {
    this.drawer = "";
    this.time = this.totalTime;
    this.currentWord = "";
    this.totalRounds = 3;
    this.currentRound = 1;
    this.isStarted = false;
    this.isHintSent = false;
    this.playersList.map((player) => {
      player.hasGuessed = false;
      player.isChoosing = false;
      player.isDone = false;
      player.isDrawing = false;
      player.resetScore();
    });
  }
  getGuessedUsers() {
    return this.playersList.filter((player) => player.hasGuessed);
  }
  resetTimer() {
    this.time = this.totalTime;
  }
  resetPlayerState() {
    this.playersList.map((player) => {
      player.resetState()
    });
  }
  hasEveryoneGuessed() {
    if (this.getGuessedUsers().length === this.playersList.length) {
      return true;
    } else {
      return false;
    }
  }
}

module.exports = Game;
