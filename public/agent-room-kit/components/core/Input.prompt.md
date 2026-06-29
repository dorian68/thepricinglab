Terminal text field / textarea; hairline border turns red on focus. RFQ prompt uses as="textarea" accent.

```jsx
<Input value={q} onChange={e=>setQ(e.target.value)} icon={dollar} />
<Input as="textarea" accent rows={2} suffix={<span>69 / 500</span>} />
```
