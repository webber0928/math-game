const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 靜態檔案路徑
app.use(express.static('public'));

// 房間歷史訊息儲存
const rooms = {};
const users = [];

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 預設用戶名稱與房間
    socket.username = null;
    let currentRoom = null;

    // 設定用戶名稱
    socket.on('set username', (username) => {
        if (username) {
            socket.username = username;
            console.log(`User ${socket.id} set username to ${username}`);
            socket.emit('username set', username);
        }
    });

    // 加入房間
    socket.on('join room', (room) => {
        if (!socket.username) {
            socket.emit('error', 'Please set a username first.');
            return;
        }

        if (currentRoom) {
            socket.leave(currentRoom);
            io.to(currentRoom).emit('chat message', `${socket.username} left the room.`);
        }

        currentRoom = room;
        socket.join(room);

        // 初始化房間歷史訊息
        if (!rooms[room]) {
            rooms[room] = [];
        }

        // 傳送歷史訊息並廣播加入訊息
        socket.emit('history', rooms[room]);
        io.to(room).emit('chat message', `${socket.username} joined the room.`);
        console.log(`${socket.username} joined room: ${room}`);

        // 通知房間內的使用者名單更新
        if (users.indexOf(socket.username) < 0) {
            users.push(socket.username)
        }
        io.to(room).emit('room users', users);
    });

    // 接收聊天訊息
    socket.on('chat message', (msg) => {
        if (!currentRoom) {
            socket.emit('error', 'You must join a room first.');
            return;
        }

        const message = `${socket.username}: ${msg}`;
        rooms[currentRoom].push(message); // 儲存歷史訊息
        io.to(currentRoom).emit('chat message', message);
        console.log(`[${currentRoom}] ${message}`);
    });

    // 用戶斷線
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (currentRoom) {
            io.to(currentRoom).emit('chat message', `${socket.username} left the room.`);
        }
    });
});

// 啟動伺服器
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
