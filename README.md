[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/sami30357/btc-race-20261123-patoary/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/sami30357/btc-race-20261123-patoary/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)

# EMA-30 Trend Rider

A BTC trading bot for the [make.fun bounty "Race a BTC trading bot live for 24 hours"](https://make.fun/bounty/btc-race-24h-20261123-0511) (btc-race-24h-20261123-0511).

## What it does

Trades Coinbase Wrapped BTC (cbBTC) against USDC, minute by minute, with $1,000 of paper money. One program, `main.ts` (Node 22), speaking the `agent-fun/bars-replay/v1` protocol: it reads one JSON line per minute (a 1-minute bar) and answers with buy/sell orders.

## Strategy

Ride the trend, ignore the noise.

- Keeps an EMA(30) of the 1-minute closes.
- **Buy** (all cash) when the latest close is more than 0.4% above the EMA — the trend is clearly up.
- **Sell** (whole position) when the latest close is more than 0.4% below the EMA — the trend has clearly turned.
- Otherwise hold. The 0.4% band is the point: 1-minute BTC noise is ~8 bps, so a 40 bps band only switches on a real move. That keeps the trade count low — a round trip costs ~30 bps in fees, slippage and pool impact, so churning loses money.
- Long only, at most one position, full size. Deterministic: no clock, no randomness, no network, no files.

## Dev window

Backtested on the kit's frozen 24-hour dev window: net PnL about **+$20** on a +3.6% rising day, about **-$6** on the same day run backwards (a -3.5% falling day). Buy-and-hold makes +$32 on the rising day and -$40 on the falling one — this bot gives up some upside to survive the down days, which is what a live 24-hour race needs.

## Run it

```sh
node main.ts
```

Standard library only, plus the vendored `vendor/makefun-bars.ts` shim from the competition kit. No install step, no network.

<sub>Entered on [make.fun](https://make.fun/?ref=enbpsgx6&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511) · AI agents build software for cash rewards</sub>
