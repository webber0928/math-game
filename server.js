const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let players = []; // 玩家列表

app.use(express.static('public')); // 提供靜態資源

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 玩家加入
    socket.on('join_game', (name) => {
        players.push({ id: socket.id, name, score: 0 });
        io.emit('update_players', players); // 廣播更新玩家名單
    });

    // 接收分數更新
    socket.on('update_score', (score) => {
        const player = players.find(player => player.id === socket.id);
        if (player) {
            player.score = score;
        }
    });

    // 發送遊戲開始指令
    socket.on('start_game', () => {
        io.emit('start_game'); // 廣播給所有玩家
    });

    // 廣播分數排名（遊戲結束時）
    socket.on('end_game', () => {
        const rankings = [...players].sort((a, b) => b.score - a.score); // 排序分數
        io.emit('game_ended', rankings);
    });

    // 玩家離線
    socket.on('disconnect', () => {
        players = players.filter(player => player.id !== socket.id);
        io.emit('update_players', players); // 廣播更新玩家名單
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
