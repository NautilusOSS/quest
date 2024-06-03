# Nautilus Quests

Nautilus NFT Marketplace quest system (https://quest.nautilus.sh)

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

| Quest | Name | Description | Guide | Frequency |
|-----------------|-----------------|-----------------|-----------------|-----------------|
| 000001 | connect_wallet | Wallet Quest: Connect Wallet<br />Account Connection | LINK | ONCE |
| 000002 | sale_list_once | Sale Quest: List NFT for Sale | LINK | ONCE |
| 000003 | sale_buy_once | Sale Quest: Buy NFT for Sale | LINK | ONCE |
| 000004 | swap_list_once | M-Swap Quest: List MechaSwap<br />Swap NFT | LINK | ONCE |
| 000005 | swap_execute_once | M-Swap Quest: Execute MechaSwap<br />Swap NFT | LINK | ONCE |
| 000006 | timed_sale_list_1minute | Timed Quest: List NFT 1 minute after mint<br />on High Forge | LINK | ONCE |
| 000007 | timed_sale_list_15minutes | Timed Quest: List NFT 15 minute after 1st mint<br />on High Forge | LINK | ONCE |
| 000008 | timed_sale_list_1hour | Timed Quest: List NFT 1 hour after mint<br />on High Forge | LINK | ONCE |

## Contributing

Contributions welcome

## License

License here
