import { Client } from "../models/Client.js";

export class BotAI {
    private _client: Client;

    constructor(aParams: {
        client: Client,

    }) {
        this._client = aParams.client;
    }

    private updateLaser(dt: number) {
        
    }

    update(dt: number) {
        this.updateLaser(dt);
    }

}