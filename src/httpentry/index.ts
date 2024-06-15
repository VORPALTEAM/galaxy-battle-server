import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import dotEnv from "dotenv";
import Web3 from "web3";
import { Web3Service } from "../game/services/Web3Service.js";
import { DuelService } from "../game/services/DuelService.js";

export const DuelCancelAction = async (req: Request, res: Response) => {
    const { signature, login, duelId }= req.body;
    const adminWallet = process.env.ADMIN_ADDRESS?.toLowerCase() || "";
    if (!signature || !login || !duelId) {
        res.status(400).send({ error: "Invalid entry"});
    }
    const wallet = Web3Service.getInstance().getWalletId(signature).toLowerCase();
    if (wallet !== adminWallet) {
        res.status(403).send({ error: "Invalid signature"});
    }

    // Call duel cancel function
    DuelService.getInstance().cancelDuel(login, duelId);

    res.status(200).send({ success: true })
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