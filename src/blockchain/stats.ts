import { GetSignedAuthMessage } from "./functions";
import { fastServerUrl } from "./network";
import { DuelPlayerStats, PlayerSummaryStats } from "./types";

export async function setStats( stats: DuelPlayerStats[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const signMessage = GetSignedAuthMessage();
        fetch(fastServerUrl.concat('/api/duel/stats/add'), {
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

export async function getStats (category: "duel" | "player", itemId: string): Promise<DuelPlayerStats[]> {
    const url = fastServerUrl.concat(`/api/duel/${category}/${itemId}`);
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

export async function getPlayerAggregateStats (itemId: string): Promise<PlayerSummaryStats | null> {
    const url = fastServerUrl.concat(`/api/duel/summary/${itemId}`);
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