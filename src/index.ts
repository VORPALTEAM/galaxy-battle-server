import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { BattleServer } from './controllers/BattleServer.js';
import { LogMng } from './utils/LogMng.js';
import dotenv from 'dotenv';
import * as fs from 'fs/promises';
import { Config } from './data/Config.js';

const configPath = './src/config.json';

if (process.env.NODE_ENV === 'development') {
    LogMng.setMode(LogMng.MODE_DEBUG);
    dotenv.config({ path: '.env.development' });
}
else {
    LogMng.setMode(LogMng.MODE_RELEASE);
    dotenv.config({ path: '.env.production' });
}

LogMng.setMode(LogMng.MODE_DEBUG);
LogMng.system(`LogMng.mode = ${LogMng.mode}`);

const PORT = process.env.WS_PORT ? process.env.WS_PORT : '3089';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

// app.get('/', (req, res) => {
//     res.send('Vorpal Galaxy Battle Server is running!');
// });

try {
    const rawData = await fs.readFile(configPath);
    const config = JSON.parse(rawData.toString());
    Config.fighterParams = config.fighter;
    Config.linkorParams = config.linkor;
    console.log(`fighter params:`, Config.fighterParams);
    console.log(`linkor params:`, Config.linkorParams);

}
catch (error) {
    console.error('Error reading or parsing config file:', error.message);
}

let battleServer = new BattleServer(io);

server.listen(PORT, () => {
    console.log(`Vorpal Galaxy Battle Server listening at port ${PORT}`);
});