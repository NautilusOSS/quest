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

const indexerClient = new algosdk.Indexer(
  process.env.INDEXER_TOKEN || "",
  process.env.INDEXER_SERVER || ALGO_INDEXER_SERVER,
  process.env.INDEXER_PORT || ""
);

const dbPath = DB_PATH;

const db = new Database(dbPath);

const app = express();
const port = PORT;

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

const validateAction = (req, res, next) => {
  const { action, data } = req.body;
  if (!action || !data) {
    return res.status(400).json({ error: "Action and data are required" });
  }
  switch (action) {
    case "connect_wallet":
    case "sale_list_once": {
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

app.get("/quest", async (req, res) => {
  const key = req.query.key;
  // validate key
  const results = await db.searchInfo(key);
  return res.status(200).json({ message: "ok", results });
});

app.post("/quest", cors(corsOptions), async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Response-Type", "application/json");
  try {
    const [{ address }] = data.wallets;
    const key = `${action}:${address}`;
    const info = await db.getInfo(key);
    switch (action) {
      case "connect_wallet": {
        if (!info) await db.setInfo(key, Date.now());
        break;
      }
      case "sale_list_once": {
        if (!info) {
          const minRound = 6534432; // 1 May
          const { listings } = await axios.get(
            `https://arc72-idx.nftnavigator.xyz/nft-indexer/v1/mp/listings?seller=${address}&min-round=${minRound}`
          );
          if (listings.length > 0) await db.setInfo(key, Date.now());
        }
        break;
      }
      default: {
        return res
          .status(401)
          .json({ message: `Unsupported action '${action}'` });
      }
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
