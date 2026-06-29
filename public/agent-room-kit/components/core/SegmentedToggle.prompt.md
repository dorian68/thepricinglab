Compact segmented control for timeframes (1D/1W/1M/3M/1Y) and modes (Bid/Mid, Pipeline/Map).

```jsx
<SegmentedToggle value={tf} onChange={setTf} options={['1D','1W','1M','3M','1Y']} />
```
Options accept strings or {id,label}. tone: red · green.
