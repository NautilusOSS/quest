const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const https = require("https");
const fs = require("fs");
const algosdk = require("algosdk");
const { Database } = require("./database.js");
require("dotenv").config();

const {
  MN,
  RECAPTCHA_SITE_KEY,
  RECAPTCHA_SECRET_KEY,
  ALGO_SERVER,
  ALGO_INDEXER_SERVER,
  DB_PATH,
  PORT,
} = process.env;

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || "",
  process.env.ALGOD_SERVER || ALGO_SERVER,
  process.env.ALGOD_PORT || ""
);

const getLastRound = async () => {
  const status = await algodClient.status().do();
  return status["last-round"] || 0;
};

const indexerClient = new algosdk.Indexer(
  process.env.INDEXER_TOKEN || "",
  process.env.INDEXER_SERVER || ALGO_INDEXER_SERVER,
  process.env.INDEXER_PORT || ""
);

const dbPath = DB_PATH || "./db.sqlite";

const db = new Database(dbPath);

const app = express();
const port = PORT || "3001";

app.use(cors());
//app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

// cors

const corsOptions = {
  origin: "https://nautilus.sh", // Allow nautilus
  methods: "GET,POST",
  allowedHeaders: "Content-Type,Authorization",
  optionsSuccessStatus: 200,
};

// middleware

const ADDRESS_REGEX = /[A-Z0-9]{58}/;

// Address validation middleware
const validateKey = (req, res, next) => {
  const address = req.query.key;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  // Define your regex pattern for validating the address
  const addressRegex = ADDRESS_REGEX;

  if (!addressRegex.test(address)) {
    return res.status(400).json({ error: "Invalid address format" });
  }

  // If validation passes, proceed to the next middleware or route handler
  next();
};

const validateAction = (req, res, next) => {
  const { action, data } = req.body;
  if (!action || !data) {
    return res.status(400).json({ error: "Action and data are required" });
  }
  switch (action) {
    case "hmbl_token_create": {
      const { tokenId } = data;
      if (isNaN(Number(tokenId))) {
        return res.status(400).json({ message: "Invalid token id" });
      }
      break;
    }
    case "hmbl_pool_create":
    case "hmbl_pool_add":
    case "hmbl_pool_swap":
    case "hmbl_pool_swap_daily":
      const { poolId } = data;
      if (isNaN(Number(poolId))) {
        return res.status(400).json({ message: "Invalid pool id" });
      }
    case "connect_wallet":
    case "sale_list_once":
    case "sale_buy_once":
    case "sale_list_once":
    case "timed_sale_list_1minute":
    case "timed_sale_list_1hour":
    case "timed_sale_list_15minutes":
    case "swap_execute_once":
    case "faucet_drip_once":
    case "swap_list_once": 
    case "swap_list_once":
    case "swap_execute_once":
    case "timed_sale_list_1minute":
    case "timed_sale_list_15minutes":
    case "timed_sale_list_1hour":
    case "hmbl_token_create":
    case "hmbl_pool_create":
    case "hmbl_pool_add":
    case "hmbl_farm_stake":
    case "hmbl_farm_claim":
    case "hmbl_farm_create":
    case "not-a-quest": {
      // check address validitiy
      const ADDRESS_REGEX = /[A-Z0-9]{58}/;
      const [{ address }] = data.wallets;
      if (!ADDRESS_REGEX.test(address)) {
        return res.status(400).json({ message: "Invalid address" });
      }
      break;
    }
    default:
      return res
        .status(400)
        .json({ message: `Unsupported action '${action}'` });
  }
  next();
};

// routes

app.get("/quest", validateKey, async (req, res) => {
  const key = req.query.key;
  // validate key
  const results = await db.searchInfo(key);
  return res.status(200).json({ message: "ok", results });
});

const minRound = 6534432; // 1 May
const ctcInfoMp212 = 40433943;
const ctcInfoStakr = 36898212;
const ctcInfoMp = 29117863;

app.post("/quest", cors(corsOptions), validateAction, async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Response-Type", "application/json");
  const { action, data } = req.body;
  try {
    const { wallets, contractId, tokenId, poolId } = data;
    const [{ address }] = wallets;
    const key = `${action}:${address}`;
    console.log(key);
    const info = await db.getInfo(key);
    switch (action) {
      case "connect_wallet": {
        if (!info) await db.setInfo(key, Date.now());
        break;
      }
      case "sale_list_once": {
        const propertyName = "listings";
        if (!info) {
          const { data } = await axios.get(
            `https://arc72-idx.nftnavigator.xyz/nft-indexer/v1/mp/listings?seller=${address}&min-round=${minRound}`
          );
          if (data[propertyName].length > 0) await db.setInfo(key, Date.now());
        }
        break;
      }
      case "sale_buy_once": {
        const propertyName = "sales";
        if (!info) {
          const { data } = await axios.get(
            `https://arc72-idx.nftnavigator.xyz/nft-indexer/v1/mp/sales?buyer=${address}&min-round=${minRound}`
          );
          if (data[propertyName].length > 0) await db.setInfo(key, Date.now());
        }
        break;
      }
      case "timed_sale_list_1minute": {
        if (!info) {

          const status = await algodClient.status().do();
          const { mp, arc72 } = await import("ulujs");

          const ci = new mp(ctcInfoMp, algodClient, indexerClient);
          const evts = await ci.ListEvent({
            minRound: Math.max(0, (status["last-round"] || 0) - 1000),
            address,
            sender: address,
          });
          const fEvts = evts.filter((evt) => {
            const addr = evt[6];
            return addr === address;
          });
          if (fEvts.length < 1) break;
          const fEvt = fEvts.pop();
          const listTimestamp = fEvt[2];

          const ciARC72 = new arc72(
            data.contractId,
            algodClient,
            indexerClient
          );
          const evts2 = await ciARC72.arc72_Transfer({
            minRound: Math.max(0, (status["last-round"] || 0) - 1000),
          });
          const fEvts2 = evts2.filter((evt) => {
            const addrFrom = evt[3];
            const addrTo = evt[4];
            return (
              addrFrom ===
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ" &&
              addrTo === address
            );
          });
          if (fEvts2.length < 1) break;
          const fEvt2 = fEvts2.pop();
          const mintTimestamp = fEvt2[2];

          const threshold = 60; // !!
          const elapsedTime = Math.abs(listTimestamp - mintTimestamp);
          if (elapsedTime <= threshold) {
            await db.setInfo(key, Date.now());
          }
        }
        break;
      }
      case "timed_sale_list_15minutes": {
        if (!info) {
          const status = await algodClient.status().do();
          const { mp, arc72 } = await import("ulujs");

          const ci = new mp(ctcInfoMp, algodClient, indexerClient);
          const evts = await ci.ListEvent({
            minRound: Math.max(0, (status["last-round"] || 0) - 1000),
            address,
            sender: address,
          });
          const fEvts = evts.filter((evt) => {
            const addr = evt[6];
            return addr === address;
          });
          if (fEvts.length < 1) break;
          const fEvt = fEvts.pop();
          const listTimestamp = fEvt[2];

          const ciARC72 = new arc72(
            data.contractId,
            algodClient,
            indexerClient
          );
          const evts2 = await ciARC72.arc72_Transfer({
            minRound: Math.max(0, (status["last-round"] || 0) - 1000),
          });
          const fEvts2 = evts2.filter((evt) => {
            const addrFrom = evt[3];
            const addrTo = evt[4];
            return (
              addrFrom ===
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ" &&
              addrTo === address
            );
          });
          if (fEvts2.length < 1) break;
          const fEvt2 = fEvts2.pop();
          const mintTimestamp = fEvt2[2];

          const threshold = 60 * 15; // !!
          const elapsedTime = Math.abs(listTimestamp - mintTimestamp);
          if (elapsedTime <= threshold) {
            await db.setInfo(key, Date.now());
          }
        }
        break;
      }
      case "timed_sale_list_1hour": {
        if (!info) {
          const status = await algodClient.status().do();
          const { mp, arc72 } = await import("ulujs");

          const ci = new mp(ctcInfoMp, algodClient, indexerClient);
          const evts = await ci.ListEvent({
            minRound: Math.max(0, (status["last-round"] || 0) - 1000),
            address,
            sender: address,
          });
          const fEvts = evts.filter((evt) => {
            const addr = evt[6];
            return addr === address;
          });
          if (fEvts.length < 1) break;
          const fEvt = fEvts.pop();
          const listTimestamp = fEvt[2];

          const ciARC72 = new arc72(
            data.contractId,
            algodClient,
            indexerClient
          );
          const evts2 = await ciARC72.arc72_Transfer({
            minRound: Math.max(0, (status["last-round"] || 0) - 1000),
          });
          const fEvts2 = evts2.filter((evt) => {
            const addrFrom = evt[3];
            const addrTo = evt[4];
            return (
              addrFrom ===
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ" &&
              addrTo === address
            );
          });
          if (fEvts2.length < 1) break;
          const fEvt2 = fEvts2.pop();
          const mintTimestamp = fEvt2[2];

          const threshold = 60 * 60; // !!
          const elapsedTime = Math.abs(listTimestamp - mintTimestamp);
          if (elapsedTime <= threshold) {
            await db.setInfo(key, Date.now());
          }
        }
        break;
      }
      case "swap_list_once": {
        const spec = {
          name: "",
          desc: "",
          methods: [],
          events: [
            {
              name: "e_swap_ListEvent",
              args: [
                {
                  type: "uint256",
                  name: "listingId",
                },
                {
                  type: "uint64",
                  name: "contractId",
                },
                {
                  type: "uint256",
                  name: "tokenId",
                },
                {
                  type: "uint64",
                  name: "contractId2",
                },
                {
                  type: "uint256",
                  name: "tokenId2",
                },
                {
                  type: "uint64",
                  name: "endTime",
                },
              ],
            },
          ],
        };
        const { CONTRACT } = await import("ulujs");
        const ci = new CONTRACT(ctcInfoMp212, algodClient, indexerClient, spec);
        const evts = await ci.getEvents({ minRound, address, sender: address });
        const listEvents =
          evts.find((el) => el.name === "e_swap_ListEvent")?.events || [];
        if (listEvents.length > 0) await db.setInfo(key, Date.now());
      }        
      case "swap_execute_once": {
        const spec = {
          name: "",
          desc: "",
          methods: [],
          events: [
            {
              name: "e_swap_SwapEvent",
              args: [
                {
                  type: "uint256",
                  name: "listingId",
                },
                {
                  type: "address",
                  name: "holder1",
                },
                {
                  type: "address",
                  name: "holder2",
                },
              ],
            },
          ],
        };
        const { CONTRACT } = await import("ulujs");
        const ci = new CONTRACT(ctcInfoMp212, algodClient, indexerClient, spec);
        const evts = await ci.getEvents({ minRound, address, sender: address });
        const swapEvents =
          evts.find((el) => el.name === "e_swap_SwapEvent")?.events || [];
        if (swapEvents.length > 0) await db.setInfo(key, Date.now());
      }
      case "faucet_drip_once": {
        if (!info) {
          const { arc200 } = await import("ulujs");
          const ci = new arc200(data.contractId, algodClient, indexerClient);
          const faucetAddress =
            "2CMESXKIAZ5HLRKGGC3RBS7XYDXK5WPH3LRN4J4ICUHNTJQIYJQPH6KX3M";
          const evts = await ci.arc200_Transfer({
            minRound,
            address: faucetAddress,
            sender: faucetAddress,
          });
          const fEvts = evts.filter((evt) => {
            const addrTo = evt[4];
            return addrTo === address;
          });
          if (fEvts.length > 0) await db.setInfo(key, Date.now());
        }
      case "hmbl_pool_swap": {
        if (!info) {
          const { swap } = await import("ulujs");
          const ci = new swap(poolId, algodClient, indexerClient);
          const evts = await ci.SwapEvents({
            minRound: Math.max(0, (await getLastRound()) - 1000),
            address,
            sender: address,
            limit: 10,
          });
          if (evts.length > 0) await db.setInfo(key, Date.now());
        }
        break;
      }
      case "hmbl_pool_swap_daily": {
	const parentKey = `hmbl_pool_swap:${address}`;
	const lastInfo = await db.getInfo(parentKey);
        if (lastInfo) {
	  const now = Date.now();
	  const lastValue = Number(lastInfo.value);
	  const diff = Math.abs(now - lastValue);
	  console.log({ now, lastValue, diff });
	  const threshold = 86400 * 1000; // day_ms
	  if(diff > threshold) {
		if(info) {
			const lastValue = Number(info.value);
	  		const { swap } = await import("ulujs");
          		const ci = new swap(poolId, algodClient, indexerClient);
          		const evts = await ci.SwapEvents({
            			minRound: Math.max(0, (await getLastRound()) - 1000),
            			address,
            			sender: address,
            			limit: 10,
          		});
          		if (evts.length > 0) {
				await db.setInfo(key, lastValue + 1);
				await db.setInfo(parentKey, Date.now());
			}
		} else {
			await db.setInfo(key, 1);
			await db.setInfo(parentKey, Date.now());
		}
	  }
        } 
        break;
      }
      case "hmbl_pool_add": {
        if (!info) {
          const { swap } = await import("ulujs");
          const ci = new swap(poolId, algodClient, indexerClient);
          const evts = await ci.DepositEvents({
            minRound: Math.max(0, (await getLastRound()) - 1000),
            address,
            sender: address,
            limit: 10,
          });
          console.log(evts);
          if (evts.length > 0) await db.setInfo(key, Date.now());
        }
        break;
      }
      case "hmbl_token_create": {
        if (!info) {
          const { swap } = await import("ulujs");
          const ci = new swap(tokenId, algodClient, indexerClient);
          const evts = (
            await ci.arc200_Transfer({
              minRound: Math.max(0, (await getLastRound()) - 1000),
              address,
              sender: address,
              limit: 1,
            })
          ).slice(0, 1);
          console.log(evts);
          const fEvts = evts.filter((evt) => {
            const addrFrom = evt[3];
            const addrTo = evt[4];
            return (
              addrFrom ===
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ" &&
              addrTo === address
            );
          });
          if (fEvts.length > 0) await db.setInfo(key, Date.now());
        }
        break;
      }
      case "hmbl_pool_create": {
        if (!info) {
          const { swap } = await import("ulujs");
          const ci = new swap(poolId, algodClient, indexerClient);
          const evts = (
            await ci.arc200_Transfer({
              minRound: Math.max(0, (await getLastRound()) - 1000),
              address,
              sender: address,
              limit: 1,
            })
          ).slice(0, 1);
          console.log(evts);
          const fEvts = evts.filter((evt) => {
            const addrFrom = evt[3];
            const addrTo = evt[4];
            return (
              addrFrom ===
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ" &&
              addrTo === algosdk.getApplicationAddress(poolId)
            );
          });
          if (fEvts.length > 0) await db.setInfo(key, Date.now());
        }
        break;
      }
      case "hmbl_farm_stake": {
        if (!info) {
          const { abi, CONTRACT } = await import("ulujs");
          const ci = new CONTRACT(contractId, algodClient, indexerClient, abi.stakr200);
          const evts = (
            await ci.Stake({
              minRound: Math.max(0, (await getLastRound()) - 1000),
              address,
              sender: address,
              limit: 1,
            })
          ).slice(0, 1);
          const fEvts = evts.filter((evt) => {
            const addr = evt[4];
            return (
              addr === address
            );
          });
          if (fEvts.length > 0) await db.setInfo(key, Date.now());
        }
        break;
      }
      case "hmbl_farm_claim": {
        if (!info) {
          const { abi, CONTRACT } = await import("ulujs");
          const ci = new CONTRACT(contractId, algodClient, indexerClient, abi.stakr200);
          const evts = (
            await ci.Harvest({
              minRound: Math.max(0, (await getLastRound()) - 1000),
              address,
              sender: address,
              limit: 1,
            })
          ).slice(0, 1);
          const fEvts = evts.filter((evt) => {
            const addr = evt[4];
            return (
              addr === address
            );
          });
          if (fEvts.length > 0) await db.setInfo(key, Date.now());
        }
        break;
      }
      case "hmbl_farm_create": {
        if (!info) {
          const { abi, CONTRACT } = await import("ulujs");
          const ci = new CONTRACT(contractId, algodClient, indexerClient, abi.stakr200);
          const evts = (
            await ci.Pool({
              minRound: Math.max(0, (await getLastRound()) - 1000),
              address,
              sender: address,
              limit: 1,
            })
          ).slice(0, 1);
          const fEvts = evts.filter((evt) => {
            const addr = evt[4];
            return (
              addr === address
            );
        break;
      }
      default:
        break; // impossible
    }
    return res.status(200).json({ message: "ok" });
  } catch (e) {
    console.log(e);
    return res.status(503).json({ message: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
