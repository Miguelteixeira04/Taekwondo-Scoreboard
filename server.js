const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let gameState = {
    blueName: "HONG",
    redName: "CHUNG",
    blueScore: 0,
    redScore: 0,
    bluePenalty: 0,
    redPenalty: 0,
    round: 1,
    time: 120,
    roundTimeConfig: 120,
    restTimeConfig: 60,
    isRunning: false,
    mode: 'round' 
};

io.on('connection', (socket) => {
    socket.emit('updateState', gameState);

    socket.on('updateSettings', (data) => {
        gameState.blueName = data.blueName;
        gameState.redName = data.redName;
        gameState.roundTimeConfig = parseInt(data.roundTime);
        gameState.restTimeConfig = parseInt(data.restTime);
        gameState.time = gameState.roundTimeConfig;
        gameState.blueScore = 0;
        gameState.redScore = 0;
        gameState.bluePenalty = 0;
        gameState.redPenalty = 0;
        gameState.round = 1;
        gameState.isRunning = false;
        io.emit('updateState', gameState);
    });

    socket.on('action', (data) => {
        if (data.type === 'score') {
            if (data.color === 'blue') gameState.blueScore += data.points;
            if (data.color === 'red') gameState.redScore += data.points;
        } else if (data.type === 'penalty') {
            if (data.color === 'blue') {
                gameState.bluePenalty += 1;
                gameState.redScore += 1; 
            }
            if (data.color === 'red') {
                gameState.redPenalty += 1;
                gameState.blueScore += 1; 
            }
        } else if (data.type === 'timer') {
            gameState.isRunning = !gameState.isRunning;
        } else if (data.type === 'reset') {
            gameState.time = gameState.roundTimeConfig;
            gameState.blueScore = 0;
            gameState.redScore = 0;
            gameState.bluePenalty = 0;
            gameState.redPenalty = 0;
            gameState.isRunning = false;
        }
        io.emit('updateState', gameState);
    });
});

setInterval(() => {
    if (gameState.isRunning && gameState.time > 0) {
        gameState.time--;
        io.emit('updateTimer', gameState.time);
    } else if (gameState.time === 0 && gameState.isRunning) {
        gameState.isRunning = false;
        io.emit('updateState', gameState);
    }
}, 1000);

server.listen(3000, () => {
    console.log('Server running on port 3000');
});