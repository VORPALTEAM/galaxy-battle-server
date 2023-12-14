import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { BattleServer } from './BattleServer.js';
import { LogMng } from './utils/LogMng.js';
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'development') {
    LogMng.setMode(LogMng.MODE_DEBUG);
    dotenv.config({ path: '.env.development' });
} else if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
} else {
    dotenv.config();
}

LogMng.system(`LogMng Mode = ${LogMng.mode}`);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.get('/', (req, res) => {
    res.send('Vorpal Galaxy Battle Server is running!');
});

let battleServer = new BattleServer(io);

const PORT = process.env.WS_PORT ? process.env.WS_PORT : '3078';

server.listen(PORT, () => {
    console.log(`Vorpal Galaxy Battle Server listening at port ${PORT}`);
});