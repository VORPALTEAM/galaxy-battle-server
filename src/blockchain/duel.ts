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

export async function GetUserLastDuel(login: string): Promise<BC_DuelInfo | null> {
  return new Promise(async (resolve, reject) => {
    const url = fastServerUrl.concat(`api/dueldatabylogin/${login}`);
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

export async function GetOpponent(login: string): Promise<string | null> {
  return new Promise(async (resolve, reject) => {
    const url = fastServerUrl.concat(`api/getopponent/${login}`);
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
      if (res.status !== 200) {
        reject(`Failed to execute, ${res.text()}`);
      }
      resolve(true);
      return res.json();
    });
  });
}

export function DuelPairRewardCondition (part1: string, part2: string): Promise<Boolean> {
  return new Promise(async (resolve, reject) => {
    const url = fastServerUrl.concat(`api/duelrewardcondition`);
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
      if (res.status !== 200) {
        reject(`Failed to execute, ${res.text()}`);
      }
      return res.json();
    }).then((res: { reward: Boolean}) => {
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

