import { PackTitle } from "../data/Packages.js";
import { Client } from "../models/Client.js";
import { Web3Service } from "../services/Web3Service.js";

export class SignMng {
    private _clients: Map<string, Client>;

    constructor() {
        this._clients = new Map();
    }

    private onSignRecv(aClient: Client, aSignature: string) {
        const publicKey = Web3Service.getInstance().getPublicKey(aSignature);
        const socket = aClient.socket;

        // check the player in connections
        this._clients.forEach((client) => {
            if (client.publicKey === publicKey) {
                socket.emit(PackTitle.sign, {
                    success: false,
                    message: 'Sign failed, client with this key is already online'
                });
                return;
            }
        });

        // update client
        aClient.sign(publicKey);

        socket.emit(PackTitle.sign, {
            success: true,
            playerId: publicKey
        });

    }

    addClient(aClient: Client) {
        this._clients.set(aClient.id, aClient);

        const socket = aClient.socket;

        socket.on(PackTitle.sign, (aSignature: string) => {
            this.onSignRecv(aClient, aSignature);
        });
        
    }

    removeClient(aClientId: string) {
        this._clients.delete(aClientId);
    }


}