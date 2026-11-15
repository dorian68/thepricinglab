import catalogue from '../data/notebookExamples.json' with { type: 'json' };

export const NOTEBOOK_EXAMPLES = Object.freeze(catalogue.notebooks);
export function getNotebookExample(id) {
  return NOTEBOOK_EXAMPLES.find(item => item.id === id) || null;
}

export function buildNotebook(example, code = example.code) {
  if (!example?.id || typeof code !== 'string') throw new Error('A registered notebook and Python text are required.');
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python', version: '3' },
      tpl: { schemaVersion: catalogue.schemaVersion, notebookId: example.id, dataStatus: 'hypothetical', edited: code !== example.code },
    },
    cells: [
      { id: `${example.id}-brief`, cell_type: 'markdown', metadata: {}, source: [`# ${example.title}\n\n`, `${example.description}\n\n`, `Ticket:\n\n\u0060\u0060\u0060json\n${JSON.stringify(example.ticket, null, 2)}\n\u0060\u0060\u0060\n\n`, ...example.limitations.map(limit => `- ${limit}\n`)] },
      { id: `${example.id}-python`, cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source: code.split(/(?<=\n)/) },
    ],
  };
}

export function downloadNotebookFile(name, content, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
