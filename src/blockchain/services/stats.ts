import { GetSignedAuthMessage } from "../functions.js";
import { fastServerUrl } from "../network.js";
import { DuelPlayerStats, PlayerSummaryStats } from "../types";

export class StatService {

    private constructor() {}
    private static instance:  StatService | null = null;

    public static getInstance():  StatService {
        if (! StatService.instance) {
            StatService.instance = new StatService ();
        }
        return StatService.instance;
      }

    public async setStats( stats: DuelPlayerStats[]): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const signMessage = GetSignedAuthMessage();
            fetch(fastServerUrl.concat('api/duel/stats/add'), {
                method: 'post',
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    signature: signMessage,
                    stats
                })
            }).then((res) => {
                if (res.status !== 200) {
                    reject("Failed to save stats");
                    return;
                }
                return res.json();
            }).then(() => {
                resolve(true);
                return;
            })
        })
    }
    
    public async getStats (category: "duel" | "player", itemId: string): Promise<DuelPlayerStats[]> {
        const url = fastServerUrl.concat(`api/duel/${category}/${itemId}`);
        return new Promise((resolve, reject) => {
            fetch(url).then((res) => {
                if (res.status !== 200) {
                    reject("Failed to get data");
                    return;
                }
                return res.json();
            }).then((res: { stats: DuelPlayerStats[]}) => {
                resolve(res.stats);
                return;
            })
        })
    }
    
    public async getPlayerAggregateStats (itemId: string): Promise<PlayerSummaryStats | null> {
        const url = fastServerUrl.concat(`api/duel/summary/${itemId}`);
        return new Promise((resolve, reject) => {
            fetch(url).then((res) => {
                if (res.status !== 200) {
                    reject("Failed to get data");
                    return;
                }
                return res.json();
            }).then((res: { stats: PlayerSummaryStats | null}) => {
               resolve(res.stats);
               return;
            })
        })
    }

    public async loadPlayWithBotStats (telegramInitData: string): Promise<any> {
        const url = fastServerUrl.concat(`api/playwithbot/set`);
        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "post",
                headers: {
                  "Content-Type": "application/json"
                },
            body: JSON.stringify({
                telegramInitData
            })
            }).then((res) => {
                if (res.status !== 200) {
                    resolve(null);
                    return;
                }
                return res.json();
            }).then(() => {
               resolve(true);
               return;
            })
        })
    }
}

export const statService = StatService.getInstance();