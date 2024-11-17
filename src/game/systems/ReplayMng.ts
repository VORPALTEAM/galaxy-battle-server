import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { Game } from "../controllers/Game.js";
import { Client } from "../models/Client.js";

type ClientRecord = {
  isClicked: boolean
}

export class ReplayMng implements ILogger {
  private _className = 'ReplayMng';
  private _game: Game;
  private _records: Map<Client, ClientRecord>;
  
  constructor(params: {
    game: Game
  }) {
    this._game = params.game;
    this._records = new Map();
  }

  logDebug(aMsg: string, aData?: any): void {
    LogMng.debug(`${this._className}: ${aMsg}`, aData);
  }
  logWarn(aMsg: string, aData?: any): void {
    LogMng.warn(`${this._className}: ${aMsg}`, aData);
  }
  logError(aMsg: string, aData?: any): void {
    LogMng.error(`${this._className}: ${aMsg}`, aData);
  }

  
  get isAllAgree(): boolean {
    // TODO:
    return false;
  }
  

  private getClientRecord(client: Client) {
    let rec = this._records.get(client);
    if (!rec) {
      rec = {
        isClicked: false
      }
      this._records.set(client, rec);
    }
    return rec;
  }

  clientClick(aClient: Client) {
    let rec = this.getClientRecord(aClient);
    rec.isClicked = !rec.isClicked;
  }

}