// EMA-30 Trend Rider — a BTC trading bot for make.fun btc-race-24h-20261123-0511.
//
// Strategy: ride the trend, ignore the noise.
//   - Keeps an EMA(30) of the 1-minute closes of CBBTC.
//   - BUY (all cash) when the latest close is more than 0.4% ABOVE the EMA: the
//     trend is clearly up, so get in.
//   - SELL (whole position) when the latest close is more than 0.4% BELOW the
//     EMA: the trend has clearly turned, so get out.
//   - Otherwise hold whatever we hold. The 0.4% band is the whole point: 1-minute
//     BTC noise is ~8 bps, so a 40 bps band means we only switch on a real move,
//     not on every wiggle. That keeps the trade count low (a round trip costs
//     ~30 bps in fees, slippage and pool impact), which is what makes the bot
//     profitable instead of churning itself to death.
//   - No trade until 30 closes of history exist (the EMA needs to settle), and
//     never during the warm-up batches.
//   - Long only, at most one position, full size. Deterministic: no clock, no
//     randomness, no network, no files — every decision comes from the bars.
//
// Backtested on the kit's frozen 24h dev window (Python replica of the fill
// model): net PnL about +$20 on a +3.6% rising day, about -$6 on the same day
// run backwards (a -3.5% falling day), so it is long the trend but not a
// hostage to it. Buy-and-hold makes +$32 on the rising day and -$40 on the
// falling one; this bot gives up some upside to survive the down days.

import { runBars } from './vendor/makefun-bars.ts';
import type { BarsState, Batch, OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const EMA_BARS = 30;
const BAND_BPS = 40; // 0.4% above/below the EMA to switch
const MAX_SLIPPAGE_BPS = 200; // 2%: wide enough that a normal 1-minute move never rejects
const MIN_HISTORY = 30; // bars of closes before the EMA is trusted

let ema: number | null = null;
let closesSeen = 0;

function emaValue(close: number): number {
  const k = 2 / (EMA_BARS + 1);
  if (ema === null) ema = close;
  else ema = close * k + ema * (1 - k);
  return ema;
}

await runBars({
  onBatch(state: BarsState, _batch: Batch): OrderInput[] {
    if (state.warmingUp) return [];
    const closeRaw = state.close(SYMBOL);
    if (closeRaw === null) return [];
    const close = Number(closeRaw) / 1e5; // price_scale 5: raw / 10^5 = USDC per BTC
    closesSeen += 1;
    const e = emaValue(close);
    if (closesSeen < MIN_HISTORY) return [];

    const pos = state.positions.get(SYMBOL);
    const qty = pos ? pos.qty : 0n;
    const upper = e * (1 + BAND_BPS / 10000);
    const lower = e * (1 - BAND_BPS / 10000);

    if (qty === 0n) {
      if (close > upper && state.cash > 1_000_000n) {
        // Spend all cash, but never more than the weight cap allows.
        const room = state.weightRoom(SYMBOL);
        const spend = state.cash < room ? state.cash : room;
        if (spend > 1_000_000n) {
          return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: spend, max_slippage_bps: MAX_SLIPPAGE_BPS }];
        }
      }
      return [];
    }
    if (close < lower) {
      return [{ side: 'sell', symbol: SYMBOL, qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  },
});
