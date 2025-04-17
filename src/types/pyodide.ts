
export interface PyodideInterface {
  runPython: (code: string) => any;
  runPythonAsync: (code: string) => Promise<any>;
  loadPackage: (packageName: string | string[]) => Promise<void>;
  setStdout: (options: { write: (text: string) => void; flush: () => void }) => void;
  setStderr: (options: { write: (text: string) => void; flush: () => void }) => void;
}

export interface CodeExecutionResult {
  result: string;
  error: string | null;
  plots: string[];
  isLoading: boolean;
}
