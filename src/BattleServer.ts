import { Server, Socket } from "socket.io";
import { Client } from "./Client.js";
import { PackTitle } from "./data/Packages.js";
import Web3 from 'web3';

export class BattleServer {
    private _web3: any;
    private _server: Server;
    private _clients: Map<string, Client>;

    constructor(aServerIO: Server) {
        this._web3 = new Web3(Web3.givenProvider);
        this._server = aServerIO;
        this._clients = new Map();
        this.initSocketEvents();
    }

    private AuthMsg(): string {
        const dt = new Date().getTime();
        return 'auth_' + String(dt - (dt % 600000));
    }

    private initSocketEvents() {
        this._server.on('connection', (socket: Socket) => {
            const clientId = socket.id;
            const client = new Client(socket);
            this._clients.set(clientId, client);

            console.log(`Client connected: ${clientId}`);

            socket.on(PackTitle.auth, (aSignature: string) => {
                const recoverMsg = this.AuthMsg();
                const publicKey = this._web3.eth.accounts
                    .recover(recoverMsg, aSignature)
                    .toLowerCase();
            });

            socket.on('disconnect', () => {
                this._clients.delete(clientId);
                console.log(`Client disconnected: ${clientId}`);
            });

            // other hadling here (f.e. 'message', 'customEvent', etc)
            // socket.on('message', (data) => { /* logic */ });
            // socket.on('customEvent', (data) => { /* logic */ });
        });
    }

    

}