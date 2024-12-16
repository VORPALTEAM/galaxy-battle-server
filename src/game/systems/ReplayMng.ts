import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { Game } from "../controllers/Game.js";
import { ReplayData, ReplayPlayerCheck } from "../data/Types.js";
import { Client } from "../models/Client.js";

type ClientRecord = {
  isClicked: boolean
}

export class ReplayMng implements ILogger {
  private _className = 'ReplayMng';
  private _game: Game;
  private _records: Map<Client, ClientRecord>;
  
  constructor(params: {
    game: Game,
    clients: Client[]
  }) {
    this._game = params.game;
    this._records = new Map();
    params.clients.forEach(client => this.initClientRecord(client));
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

  private initClientRecord(client: Client) {
    let rec = {
      isClicked: false
    }
    this._records.set(client, rec);
  }

  private getClientRecord(client: Client): ClientRecord {
    let rec = this._records.get(client);
    if (!rec) {
      rec = {
        isClicked: false
      }
      this._records.set(client, rec);
    }
    return rec;
  }
  
  get isAllAgree(): boolean {
    let res = true;
    this._records.forEach(rec => {
      if (!rec.isClicked) res = false;
    });
    return res;
  }

  clientClick(aClient: Client) {
    let rec = this.getClientRecord(aClient);
    rec.isClicked = !rec.isClicked;
  }

  getReplayPackData(aClients: Client[]): ReplayData {
    let recs: ReplayPlayerCheck[] = [];
    let id = 0;
    aClients.forEach(client => {
      let rec = this.getClientRecord(client);
      recs.push({
        playerId: client.gameData.id,
        playerName: client.getPlayerData().displayNick,
        isReady: rec.isClicked
      });
    });
    return {
      action: 'update',
      serverData: {
        playerChecks: recs
      }
    }
  }

}