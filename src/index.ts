import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { BattleServer } from './controllers/BattleServer.js';
import { LogMng } from './utils/LogMng.js';
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'development') {
    LogMng.setMode(LogMng.MODE_DEBUG);
    dotenv.config({ path: '.env.development' });
}
else {
    LogMng.setMode(LogMng.MODE_RELEASE);
    dotenv.config({ path: '.env.production' });
}

LogMng.system(`LogMng.mode = ${LogMng.mode}`);

const PORT = process.env.WS_PORT ? process.env.WS_PORT : '3078';

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

server.listen(PORT, () => {
    console.log(`Vorpal Galaxy Battle Server listening at port ${PORT}`);
});