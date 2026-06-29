Dense KPI tile — the atom of every metric strip (THEO PRICE, BID, DAILY PNL, VAR).

```jsx
<StatCard label="Daily PnL" value="+2,156" delta="+0.21%" deltaTone="positive"
  chart={<Sparkline data={s} tone="green" />} />
<StatCard label="Bid" value="3.30" unit="/bbl" valueColor="var(--red-500)" accent />
```
Props: label, value, unit, delta, deltaTone, sub, valueColor, accent, chart, size.
