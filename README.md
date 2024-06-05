# Nautilus Quests

Nautilus quest system (https://quest.nautilus.sh)

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Complete actions in quest system to earn points

## Installation

Setup for localhost

```
npm i
node index.js
# Listening on port 3001
```

Setup for docker

```
docker build -f Dockerfile .
# get sha256 hash
# install in docker compile file
```

## Usage

Get completed quests for account

`https://quest.nautilus.sh/quest?key=G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ`

## Table Example

Here's an example table:

| Quest | Name | Description | Frequency |
|-----------------|-----------------|-----------------|-----------------|
| 000001 | connect_wallet | Wallet Quest: Connect Wallet<br />Account Connection [Guide](https://confused-timbale-d13.notion.site/Wallet-Quest-Connect-Wallet-Account-Connection-31f5538d31da4969938a832693dcaf2d) | ONCE |
| 000002 | sale_list_once | Sale Quest: List NFT for Sale [Guide](https://confused-timbale-d13.notion.site/Sale-Quest-List-NFT-for-Sale-c56a1df7859341b9ae4de3c0a09af95a) | ONCE |
| 000003 | sale_buy_once | Sale Quest: Buy NFT for Sale [Guide](https://confused-timbale-d13.notion.site/Sale-Quest-Buy-NFT-for-Sale-f65e3255da1d49cb9f0f0f7224f7ec68) | ONCE |
| 000004 | swap_list_once | M-Swap Quest: List MechaSwap<br />Swap NFT | ONCE |
| 000005 | swap_execute_once | M-Swap Quest: Execute MechaSwap<br />Swap NFT | ONCE |
| 000006 | timed_sale_list_1minute | Timed Quest: List NFT 1 minute after mint<br />on High Forge | ONCE |
| 000007 | timed_sale_list_15minutes | Timed Quest: List NFT 15 minute after 1st mint<br />on High Forge | ONCE |
| 000008 | timed_sale_list_1hour | Timed Quest: List NFT 1 hour after mint<br />on High Forge | ONCE |
| 000016 | faucet_drip_once | Faucet Quest: Drip 1000 VIA from faucet | ONCE |

## Contributing

Contributions welcome

## License

MIT License
