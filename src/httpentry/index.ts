import express, { Request, Response, NextFunction } from "express";
import { Web3Service } from "../game/services/Web3Service.js";
import { DuelService } from "../game/services/DuelService.js";

export const DuelCancelAction = async (req: Request, res: Response) => {
  console.log("DuelCancelAction Request: ", req.headers, req.body)
  try {
    if (!req.body) {
      console.log("Request body is not defined")
      res.status(400).send({ error: "Invalid entry" });
      return;
    }
    const signature = req.body?.signature;
    const login = req.body?.login;
    const duelId = req.body?.duelId;
    const adminWallet = process.env.ADMIN_ADDRESS?.toLowerCase() || "";
    if (!signature || !login || !duelId) {
      console.log("Invalid entry")
      res.status(400).send({ error: "Invalid entry" });
      return;
    }
    const wallet = Web3Service.getInstance().getWalletId(signature).toLowerCase();
    if (wallet !== adminWallet.toLowerCase()) {
      console.log("Invalid signature")
      res.status(403).send({ error: "Invalid signature" });
      return;
    }
    console.log("Duel service calling")
    // Call duel cancel function
    DuelService.getInstance().cancelDuel(login, duelId);

    res.status(200).send({ success: true })
  } catch (e: any) {
    console.log(`Error:`, e.message);
    res.status(500).send({ error: "Server error" })
  }
}

export const DefaultWelcome = (req: Request, res: Response) => {
  res.status(200).send("Entry homepage")
}

export function SetupHeadersGlobal(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
}
