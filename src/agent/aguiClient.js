// Minimal AG-UI SSE client (fetch streaming) — parses `data:` events and
// forwards each parsed AG-UI event to onEvent. Supports AbortController.
export async function runAgUI(base, input, onEvent, signal) {
  const res = await fetch(`${base}/agent/ag-ui/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`AG-UI request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';
    for (const chunk of chunks) {
      const data = chunk
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.replace(/^data:\s?/, ''))
        .join('\n');
      if (!data) continue;
      if (data === '[DONE]') return;
      try {
        onEvent(JSON.parse(data));
      } catch (e) {
        console.error('Invalid AG-UI event', data, e);
      }
    }
  }
}
