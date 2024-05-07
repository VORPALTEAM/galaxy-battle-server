import { Socket } from "socket.io";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { ClaimRewardData, DebugTestData, AcceptScreenData, PackTitle, PlanetLaserSkin,
    RewardType, SkillRequest, SearchGameData, ChallengeInfo,
    SignData,
    PlayerData,
} from "../data/Types.js";
import { Signal } from "../utils/events/Signal.js";
import { RecordWinnerWithChoose } from "../blockchain/boxes/boxes.js";
import { WINSTREAKS } from "../database/DB.js";
import { MyMath } from "../utils/MyMath.js";
import { GameClientData } from "./clientData/GameClientData.js";

export class Client implements ILogger {
    protected _className: string;
    protected _socket: Socket;
    protected _connectionId: string;
    protected _walletId: string;

    // player data
    private _gameData: GameClientData;
    
    // data
    private _laserSkin: PlanetLaserSkin;

    // flags
    protected _isSigned = false;
    protected _isSignPending = false;
    protected _isDisconnected = false;
    private _isWithBot = false;
    protected _isBot = false;
    protected _isFreeConnection = false;
    private _isChallengeMode = false;
    private _challengeNumber = -1;
    private _isChallengeCreator = false;

    onSignRecv = new Signal();
    onStartSearchGame = new Signal();
    // onCreateChallengeGame = new Signal();
    // onConnectChallengeGame = new Signal();
    onStopSearchGame = new Signal();
    /**
     * Battle Scene loaded on client
     */
    onSceneLoaded = new Signal();
    onSkillRequest = new Signal();
    onExitGame = new Signal();
    onDisconnect = new Signal();
    onDebugTest = new Signal();

    onAcceptScreenPack = new Signal();

    constructor(aSocket: Socket) {
        this._className = "Client";
        this._socket = aSocket;
        this._laserSkin = "blue";
        this._gameData = new GameClientData();
        this.setIdBySocket();
        this.initListeners();
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

    protected setIdBySocket() {
        this._connectionId = this._socket.id;
    }

    protected initListeners() {
        this._socket.on(PackTitle.startSearchGame, (aData?: SearchGameData) => {
            this._isWithBot = aData?.withBot;
            this._isChallengeMode = aData?.isChallenge;
            this._isFreeConnection = aData?.isFreeConnect;
            if (this._isFreeConnection) {
                this._walletId = "0x0";
            }
            if (this._isWithBot) {
                this.logDebug(`search game with bot request...`);
            } else {
                this.logDebug(`search game request...`);
            }

            if (this._isChallengeMode) {
                switch (aData.challengeCmd) {
                    case "create":
                        this.logDebug(`challenge create game request...`);
                        // this.onCreateChallengeGame.dispatch(this);
                        this._isChallengeCreator = true;
                        this._challengeNumber = MyMath.randomIntInRange(
                            1,
                            Number.MAX_SAFE_INTEGER
                        );
                        // send code to client
                        this.sendChallengeNumber(this._challengeNumber);
                        break;
                    case "connect":
                        this.logDebug(`challenge connect game request...`);
                        this._challengeNumber = aData.challengeNumber;
                        // this.onConnectChallengeGame.dispatch(this);
                        break;
                }
            }

            this.onStartSearchGame.dispatch(this);
        });

        this._socket.on(PackTitle.stopSearchGame, () => {
            this.logDebug(`stop game searching request...`);
            this.onStopSearchGame.dispatch(this);
        });

        this._socket.on(PackTitle.battleSceneLoaded, () => {
            this.logDebug(`game scene loaded...`);
            this.onSceneLoaded.dispatch(this);
        });

        this._socket.on(PackTitle.skill, (aData: SkillRequest) => {
            this.onSkillRequest.dispatch(this, aData);
        });

        this._socket.on(PackTitle.exitGame, () => {
            // client click exit
            this.onExitGame.dispatch(this);
        });

        this._socket.on(PackTitle.debugTest, (aData: DebugTestData) => {
            this.onDebugTest.dispatch(this, aData);
        });

        this._socket.on(PackTitle.claimReward, (aData: ClaimRewardData) => {
            this.logDebug(`onSocket claimReward: ${aData}`);

            if (this._isSigned) {
                this.handleClaimRewardRequest(aData);
            } else {
                this.onSignRecv.addOnce(() => {
                    this.handleClaimRewardRequest(aData);
                }, this);
                this.sendSignRequest();
            }
        });

        this._socket.on(PackTitle.battleConfirmation, (aData: AcceptScreenData) => {
            this.logDebug(`onSocket initScreen: ${aData}`);
            this.onAcceptScreenPack.dispatch(this, aData);
        });

        this._socket.on("disconnect", () => {
            // this.onDisconnect(clientId);
            this._isDisconnected = true;
            this.onDisconnect.dispatch(this);
        });
    }

    private handleClaimRewardRequest(aData: ClaimRewardData) {
        switch (aData.type) {
            case "reward":
                // client claim reward click
                this.logDebug(
                    `Claim Reward: RecordWinnerWithChoose call with (${this._walletId}, false)`
                );
                RecordWinnerWithChoose(this._walletId, false).then(
                    () => {
                        // resolve
                        this.logDebug(`RecordWinnerWithChoose resolved`);
                        this.sendClaimRewardAccept();
                    },
                    (aReasone: any) => {
                        // rejected
                        this.logDebug(`RecordWinnerWithChoose rejected`);
                        this.logError(`RecordWinnerWithChoose: ${aReasone}`);
                        this.sendClaimRewardReject(aData.type, aReasone);
                    }
                );
                break;

            case "box":
                // client claim reward click
                this.logDebug(
                    `Open Box: RecordWinnerWithChoose call with (${this._walletId}, true)`
                );
                RecordWinnerWithChoose(this._walletId, true).then(
                    () => {
                        // resolve
                        this.logDebug(`RecordWinnerWithChoose resolved`);
                        this.sendClaimBoxAccept();
                    },
                    (aReasone: any) => {
                        // rejected
                        this.logDebug(`RecordWinnerWithChoose rejected`);
                        this.logError(`RecordWinnerWithChoose: ${aReasone}`);
                        this.sendClaimRewardReject(aData.type, aReasone);
                    }
                );
                break;

            default:
                this.logWarn(
                    `handleClaimRewardRequest: unknown aData.type = ${aData.type}`
                );
                break;
        }
    }

    get socket(): Socket {
        return this._socket;
    }

    get connectionId(): string {
        return this._connectionId;
    }

    get isSigned() {
        return this._isSigned;
    }

    get isSignPending() {
        return this._isSignPending;
    }

    set isSignPending(value) {
        this._isSignPending = value;
    }

    get walletId(): string {
        return this._walletId;
    }

    get gameData(): GameClientData {
        return this._gameData;
    }

    protected get starName(): string {
        return this._gameData.starName;
    }

    get isDisconnected() {
        return this._isDisconnected;
    }

    get isChallengeMode() {
        return this._isChallengeMode;
    }

    get challengeNumber() {
        return this._challengeNumber;
    }

    get isChallengeCreator() {
        return this._isChallengeCreator;
    }

    get isWithBot() {
        return this._isWithBot;
    }

    get isFreeConnection() {
        return this._isFreeConnection;
    }

    get isBot() {
        return this._isBot;
    }

    get laserSkin(): PlanetLaserSkin {
        return this._laserSkin;
    }
    set laserSkin(value: PlanetLaserSkin) {
        this._laserSkin = value;
    }

    sign(aPublicKey: string, aDisplayName = "") {
        this._walletId = aPublicKey;
        this._gameData.displayName = aDisplayName;
        this._isSigned = true;
        this.logDebug(`signed...`);
    }

    sendPack(aPackTitle: PackTitle, aData: any) {
        if (this._isDisconnected) return;
        this._socket.emit(aPackTitle, aData);
    }

    async sendSignRequest() {
        let data: SignData = {
            fromServer: 'request'
        }
        this.sendPack(PackTitle.sign, data);
    }

    onSignSuccess(aWalletId: string) {
        let data: SignData = {
            fromServer: 'success',
            walletId: aWalletId
        }
        this.sendPack(PackTitle.sign, data);
        this.onSignRecv.dispatch({
            status: 'success'
        });
    }

    onSignReject(aMsg?: string) {
        let data: SignData = {
            fromServer: 'reject',
            message: aMsg
        }
        this.sendPack(PackTitle.sign, data);
        this.onSignRecv.dispatch({
            status: "reject",
        });
    }

    sendStartGameSearch() {
        this.sendPack(PackTitle.gameSearching, {
            cmd: "start",
        });
    }

    sendStopGameSearch() {
        this.sendPack(PackTitle.gameSearching, {
            cmd: "stop",
        });
    }

    sendClaimRewardAccept() {
        let data: ClaimRewardData = {
            type: "reward",
            action: "accept",
        };
        this.sendPack(PackTitle.claimReward, data);
    }

    sendClaimBoxAccept() {
        let data: ClaimRewardData = {
            type: "box",
            action: "accept",
        };
        this.sendPack(PackTitle.claimReward, data);
    }

    sendClaimRewardReject(aRewardType: RewardType, aReasone: any) {
        let data: ClaimRewardData = {
            type: aRewardType,
            action: "reject",
            reasone: aReasone,
        };
        this.sendPack(PackTitle.claimReward, data);
    }

    sendAcceptScreenStart(aTimer: number) {
        let data: AcceptScreenData = {
            action: "start",
            timer: aTimer
        };
        this.sendPack(PackTitle.battleConfirmation, data);
    }

    sendAcceptScreenLoading() {
        let data: AcceptScreenData = {
            action: 'loading'
        }
        this.sendPack(PackTitle.battleConfirmation, data);
    }

    sendChallengeNumber(aNum: number) {
        let data: ChallengeInfo = {
            cmd: "number",
            challengeNumber: aNum,
        };
        this.sendPack(PackTitle.challengeInfo, data);
    }

    sendChallengeNotFound() {
        let data: ChallengeInfo = {
            cmd: "notFound",
        };
        this.sendPack(PackTitle.challengeInfo, data);
    }

    setPlayerData(aData: {
        starName?: string
    }) {
        if (aData.starName) this._gameData.starName = aData.starName;
    }

    getPlayerData(): PlayerData {
        return {
            name: this._gameData.displayName.length > 0 ? this._gameData.displayName : this.walletId,
            isNick: this._gameData.displayName.length > 0,
            starName: this.starName,
            race: this._gameData.race
        }
    }

}
