import { Client } from "../Client.js";
import { GameClientData } from "./GameClientData.js";

export class ClientDataMng {
    private _data: Map<string, GameClientData>;

    constructor() {
        this._data = new Map();
    }

    addClient(aClient: Client): GameClientData {
        let cliData = new GameClientData();
        this._data.set(aClient.connectionId, cliData);
        return cliData;
    }

    getClientData(aClient: Client): GameClientData {
        let cliData = this._data.get(aClient.connectionId);
        return cliData;
    }

}