const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const Game = require("./config/game");
const Player = require("./config/player");

const game = new Game();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  const updatePlayersState = () => {
    io.sockets.emit("update_players_state", game.getPlayers());
  };

  const endTurn = () => {
    const guessedUsers = game.getGuessedUsers();
    game.isHintSent = false;
    const drawer = game.getDrawer();
    drawer.score += guessedUsers.length * 10;
    updatePlayersState();
    clearInterval(timer);
    game.resetPlayerState();
    game.resetTimer();

    if (game.getRemainingPlayers().length === 0 && game.checkLastRound()) {
      io.sockets.emit("game_over", game.getPlayers());
      game.reset();
      timer = setTimeout(()=>{
        game.isStarted = true;
        startNextTurn()
      }, 10000);
    } else {
      io.sockets.emit("turn_over", game.currentWord);
      timer = setTimeout(startNextTurn, 3000);
    }
  };

  const startNextTurn = () => {
    io.sockets.emit("clear_canvas");
    io.sockets.emit("results_done");
    game.chooseNextPlayer();
    updatePlayersState();
  };

  const startTimer = () => {
    timer = setInterval(() => {
      if (game.getPlayers() < 2) {
        clearInterval(timer);
      }
      io.sockets.emit("time", game.getTime());

      if (game.getTime() <= game.totalTime / 2 && !game.isHintSent) {
        const hint = game.getHint();
        let wordToGuess = game.getWordToGuess();
        hint.map((h) => (wordToGuess[h.randomIndex] = h.correspondingLetter));
        io.sockets.emit("hint", wordToGuess);
        game.isHintSent = true;
      }

      if (game.getTime() === 0) {
        endTurn();
      }

      game.oneSecondPassed();
    }, 1000);
  };

  console.log(`a new user has connected: ${socket.id}`);

  socket.on("send_message", (data) => {
    if (data.message.toLowerCase() === game.currentWord.toLowerCase()) {
      const guessedUser = game.getPlayers().find(
        (player) => player.id === socket.id
      );
      const noGuessPlayers = game.getPlayers().filter(
        (player) => !player.hasGuessed
      );
      if (!guessedUser.hasGuessed) {
        guessedUser.score += noGuessPlayers.length * 10 + 10;
        io.sockets.emit("receive_message", {
          username: "server",
          message: `${guessedUser.username} has guessed the word`,
          color: "green",
        });
      }
      guessedUser.hasGuessed = true;
      updatePlayersState();
      if (game.hasEveryoneGuessed()) {
        endTurn();
      }
    } else {
      socket.broadcast.emit("receive_message", data);
    }
  });

  socket.on("start_drawing", (data) => {
    socket.broadcast.emit("client_start_drawing", data);
  });

  socket.on("draw", (data) => {
    socket.broadcast.emit("client_draw", data);
  });

  socket.on("finish_drawing", () => {
    socket.broadcast.emit("client_finish_drawing");
  });

  socket.on("clear_canvas", () => {
    socket.broadcast.emit("clear_canvas");
  });

  socket.on("join_game", (data) => {
    const { username, avatar } = data;
    if(game.playersList.find(p=>p.id == socket.id)){
      return
    }
    const newPlayer = new Player(socket.id, username, avatar);
    game.addPlayer(newPlayer);
    socket.emit("game_joined");
    io.sockets.emit("receive_message", {
      username: "server",
      message: `${data.username} has joined the game`,
      color: "#2bab2b",
    });
  });

  socket.on("game_joined", () => {
    io.sockets.emit("new_player", game.getPlayers());
    if (!game.isStarted && game.getPlayers().length >= 2) {
      game.startGame();
      startNextTurn();
    }
  });

  socket.on("give_words", () => {
    const threeWords = game.chooseThreeWords();
    socket.emit("receive_words", threeWords);
  });

  socket.on("send_choice", ({choice, screenWidth, screenHeight}) => {
    const drawer = game.getPlayers().find((player) => player.id === socket.id);
    drawer.isDrawing = true;
    drawer.isChoosing = false;
    game.drawer = drawer.username;
    game.currentWord = choice;
    game.drawerWidth = screenWidth;
    game.drawerHeight = screenHeight;
    updatePlayersState();
    const wordToGuess = game.getWordToGuess();
    io.sockets.emit("start_turn", {
      time: game.time,
      wordToGuess,
      round: game.currentRound,
      drawerWidth: game.drawerWidth,
      drawerHeight: game.drawerHeight,
    });
    startTimer();
  });

  socket.on("disconnect", () => {
    console.log(`a user has disconnected: ${socket.id}`);
    const disconnectedPlayer = game.getPlayers().find(
      (player) => player.id === socket.id
    ).username;
    if (disconnectedPlayer) {
      socket.broadcast.emit("receive_message", {
        username: "server",
        message: `${disconnectedPlayer} has left the game`,
        color: "red",
      });
    }
    game.removePlayer(socket.id);
    socket.broadcast.emit("remove_player", game.playersList);
    if (game.playersList.length < 2 && game.isStarted) {
      game.reset();
      clearInterval(timer);
    }
  });
});

server.listen(8000, "0.0.0.0", () => {
  console.log(`Listening at port ${process.env.PORT || "8000"}`);
});
