import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import { BattleServer } from './game/controllers/BattleServer.js';
import { LogMng } from './monax/LogMng.js';
import dotenv from 'dotenv';
import * as fs from 'fs/promises';
import { Config } from './game/data/Config.js';
import { DB } from './database/DB.js';
import { DuelCancelAction, DefaultWelcome } from './httpentry/index.js';

const configPath = './src/config.json';

LogMng.setMode(LogMng.MODE_DEBUG);

LogMng.debug(`env init...`);
if (process.env.NODE_ENV === 'development') {
    // LogMng.setMode(LogMng.MODE_DEBUG);
    dotenv.config({ path: '.env.development' });
}
else {
    // LogMng.setMode(LogMng.MODE_RELEASE);
    dotenv.config({ path: '.env.production' });
}

LogMng.system(`LogMng.mode = ${LogMng.mode}`);

// init DB

DB.init({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

// init connection

const portHTTP = process.env.HTTP_PORT || '8081';

const appHttp = express();
const app = express();

app.use(express.json());
appHttp.use(express.json());

app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

appHttp.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

app.use(bodyParser.json());
appHttp.use(bodyParser.json());
  
const serverHttpEntry = http.createServer(appHttp);

const PORT = process.env.WS_PORT ? process.env.WS_PORT : '3089';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

appHttp.get('/', DefaultWelcome)

appHttp.get('/api', (req, res) => {
    res.status(200).send("Api homepage")
})

appHttp.post('/api/duelcancel', DuelCancelAction)


try {
    // const rawData = await fs.readFile(configPath);
    // const config = JSON.parse(rawData.toString());
    // Config.fighterConfig = config.fighter;
    // Config.linkorConfig = config.linkor;
    // console.log(`Fighter config:`, Config.fighterConfig);
    // console.log(`Linkor config:`, Config.linkorConfig);
}
catch (error) {
    console.error('Error reading or parsing config file:', error.message);
}

let battleServer = new BattleServer(io);

server.listen(PORT, () => {
    console.log(`Vorpal Galaxy Battle Server listening at port ${PORT}`);
});

serverHttpEntry.listen(portHTTP, () => {
    console.log(`Http entry listening at port ${portHTTP}`);
});

// HttpEntrySetup();