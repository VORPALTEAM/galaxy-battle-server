import Web3 from "web3";
import fetch from "node-fetch";
import crypto from "crypto";
import { ERC20ABI, JournalABI } from "./ABI.js";
import {
  admin,
  decimals,
  fastServerUrl,
  journal,
  networkParams,
  token,
} from "./network.js";
import {
  ComplexAutData,
  BC_DuelInfo,
  DuelInfoResponce,
  OpponentResponce,
  TelegramAuthData,
} from "./types.js";
import { GetSignedAuthMessage } from "./functions.js";

const web3 = new Web3(networkParams.rpcUrl);
const journalContract = new web3.eth.Contract(JournalABI, journal);
const tokenContract = new web3.eth.Contract(ERC20ABI, token);

export async function GetDuelData(duelId: string): Promise<BC_DuelInfo | null> {
  return new Promise(async (resolve, reject) => {
    const url = fastServerUrl.concat(`api/dueldata/${duelId}`);
    fetch(url)
      .then((res) => {
        if (res.status !== 200)
          reject(`Server responce is invalid, code ${res.status}`);
        return res.json();
      })
      .then((res: DuelInfoResponce) => {
        resolve(res.data);
      });
  });
}

export async function GetUserLastDuel(id: string): Promise<BC_DuelInfo | null> {
  return new Promise(async (resolve, reject) => {
    const url = fastServerUrl.concat(`api/dueldatabylogin/${id}`);
    fetch(url)
      .then((res) => {
        if (res.status !== 200)
          reject(`Server responce is invalid, code ${res.status}`);
        return res.json();
      })
      .then((res: DuelInfoResponce) => {
        resolve(res.data);
      });
  });
}

export async function GetOpponent(id: string): Promise<string | null> {
  return new Promise(async (resolve, reject) => {
    const url = fastServerUrl.concat(`api/getopponent/${id}`);
    fetch(url)
      .then((res) => {
        if (res.status !== 200)
          reject(`Server responce is invalid, code ${res.status}`);
        return res.json();
      })
      .then((res: OpponentResponce) => {
        resolve(res.opponent);
      });
  });
}

export async function FinishDuel(duelId: string, winner: string = "") {
  return new Promise(async (resolve, reject) => {
    const url = fastServerUrl.concat(`api/finishduel`);
    console.log("Finish duel called, url: ", url);
    fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signature: GetSignedAuthMessage(),
        duelId,
        winner,
      }),
    }).then((res) => {
      console.log("Server responce: ", res)
      if (res.status !== 200) {
        reject(`Failed to execute, ${res.text()}`);
      }
      resolve(true);
      return res.json();
    });
  });
}

export function DuelPairRewardCondition (part1: string, part2: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    const url = fastServerUrl.concat(`api/duelrewardcondition`);
    console.log("Pair: ", {
      id1: part1,
      id2: part2
    })

    if (!part1) {
      reject(`Failed to execute: login1 == null`);
      return;
    }
    if (!part2) {
      reject(`Failed to execute: login2 == null`);
      return;
    }

    console.log(`continue DuelPairRewardCondition...`);

    fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login1: part1,
        login2: part2
      }),
    }).then((res) => {
      console.log("Condition responce status: ", res.status)
      if (!res || res.status !== 200) {
        reject(`Failed to execute, ${res.text()}`);
      }
      try {
        return res.json();
      } catch (error) {
        reject(`Failed to execute, ${error}`);
      }
    }).then((res: { reward: boolean}) => {
      resolve(res.reward);
      return;
    });
  })
}

export async function GetOnlineCount (): Promise<number> {
  const url = fastServerUrl.concat(`/api/onlinecount`);
  return new Promise(async (resolve, reject) => {
    fetch(url).then(res => {
      if (res.status !== 200) reject("Invalid responce");
      return res.json()
    }).then((res: {count: number}) => {
      resolve(res.count);
      return;
    })
  })
}

export async function SetOnlineCount (count: Number): Promise<Boolean> {
  const url = fastServerUrl.concat(`/api/updateonlinecount`);
  return new Promise(async (resolve, reject) => {
    fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signature: GetSignedAuthMessage(),
        count
      }),
    }).then((res) => {
      if (res.status !== 200) {
        reject(`Failed to execute, ${res.text()}`);
      }
      resolve(true);
      return res.json();
    });
  })

}

