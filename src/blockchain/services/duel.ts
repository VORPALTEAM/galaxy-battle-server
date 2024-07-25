import { GetSignedAuthMessage } from "../functions";
import { fastServerUrl } from "../network";

export class DuelApiService {
  private constructor() {}
  private static instance: DuelApiService | null = null;

  public static getInstance(): DuelApiService {
    if (!DuelApiService.instance) {
      DuelApiService.instance = new DuelApiService();
    }
    return DuelApiService.instance;
  }

  public async createDuelByAdmin(
    firstPlayerId: string
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const signature: string = GetSignedAuthMessage();
      const url = fastServerUrl.concat("/api/admin/createduel");
      fetch(url, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature, firstUser: firstPlayerId }),
      })
        .then((res) => {
          if (res.status !== 200) {
            reject("Failed to create duel");
            return null;
          }
          return res.json();
        })
        .then((res: { duel: string }) => {
          resolve(res.duel);
          return res.duel;
        });
    });
  }

  public async addOpponentByAdmin(
    duelId: string,
    secondPlayerId: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const signature: string = GetSignedAuthMessage();
      const url = fastServerUrl.concat("/api/admin/acceptduel");
      fetch(url, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
          duel: duelId,
          secondUser: secondPlayerId,
        }),
      })
        .then((res) => {
          if (res.status !== 200) {
            reject("Failed to add opponent");
            return false;
          }
          return res.json();
        })
        .then((res: { result: boolean }) => {
          resolve(res.result);
          return res.result;
        });
    });
  }
}

export const duelApiService = DuelApiService.getInstance();
