
import { PyodideInterface } from '@/types/pyodide';

let pyodideInstance: PyodideInterface | null = null;
let pyodideLoading: Promise<PyodideInterface> | null = null;

export const loadPyodide = async (): Promise<PyodideInterface> => {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (pyodideLoading) {
    return pyodideLoading;
  }

  pyodideLoading = new Promise(async (resolve, reject) => {
    try {
      console.log("Chargement de Pyodide depuis CDN...");
      
      // Load script manually instead of importing directly
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
      script.type = "text/javascript";
      document.head.appendChild(script);
      
      // Wait for script to load
      const waitForPyodide = () => {
        return new Promise<void>((res) => {
          if ((window as any).loadPyodide) {
            res();
          } else {
            setTimeout(() => res(waitForPyodide()), 100);
          }
        });
      };
      
      await waitForPyodide();
      
      console.log("Initialisation de Pyodide...");
      const loadPyodideFunction = (window as any).loadPyodide;
      
      pyodideInstance = await loadPyodideFunction({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
      });
      
      console.log("Pyodide chargé avec succès");
      
      // Initialize matplotlib if available
      try {
        await pyodideInstance.loadPackage("matplotlib");
        await pyodideInstance.runPythonAsync(`
          import matplotlib.pyplot as plt
          import io, base64
          
          def fig_to_base64(fig):
              buf = io.BytesIO()
              fig.savefig(buf, format='png')
              buf.seek(0)
              img_str = 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')
              buf.close()
              return img_str
        `);
        console.log("Matplotlib initialisé");
      } catch (e) {
        console.warn("Matplotlib could not be initialized:", e);
      }
      
      resolve(pyodideInstance);
    } catch (error) {
      console.error("Failed to load Pyodide:", error);
      pyodideLoading = null;
      reject(error);
    }
  });

  return pyodideLoading;
};

export const executePythonCode = async (code: string): Promise<{ result: string; error: string | null; plots: string[] }> => {
  try {
    const pyodide = await loadPyodide();
    
    // Reset matplotlib figures if matplotlib is available
    try {
      await pyodide.runPythonAsync("plt.close('all')");
    } catch (e) {
      // Matplotlib not available, silently ignore
    }
    
    // Create a custom stdout capture
    const stdout: string[] = [];
    const stderr: string[] = [];
    
    pyodide.setStdout({
      write: (text: string) => {
        stdout.push(text);
      },
      flush: () => {}
    });
    
    pyodide.setStderr({
      write: (text: string) => {
        stderr.push(text);
      },
      flush: () => {}
    });
    
    // Execute the code
    await pyodide.runPythonAsync(code);
    
    // Check for matplotlib plots
    const plots: string[] = [];
    try {
      const hasFigures = await pyodide.runPythonAsync(`
        import matplotlib.pyplot as plt
        len(plt.get_fignums()) > 0
      `);
      
      if (hasFigures) {
        const figNums = await pyodide.runPythonAsync(`plt.get_fignums()`);
        for (const num of figNums.toJs()) {
          const base64Image = await pyodide.runPythonAsync(`
            fig = plt.figure(${num})
            fig_to_base64(fig)
          `);
          plots.push(base64Image);
        }
      }
    } catch (e) {
      // Matplotlib not available or error, silently ignore
    }
    
    return {
      result: stdout.join(''),
      error: null,
      plots
    };
  } catch (error) {
    console.error("Python execution error:", error);
    return {
      result: '',
      error: error instanceof Error ? error.message : String(error),
      plots: []
    };
  }
};
