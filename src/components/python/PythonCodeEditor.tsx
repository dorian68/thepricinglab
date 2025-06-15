
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Save, 
  Download, 
  FileText, 
  Code, 
  Loader2,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { executePythonCode } from '@/services/pyodideService';
import { usePyodideState } from '@/hooks/usePyodideState';

interface PythonCodeEditorProps {
  initialCode?: string;
  fileName: string;
  language: 'python' | 'jupyter';
  onCodeChange?: (code: string) => void;
  onSave?: (code: string) => void;
}

const PythonCodeEditor: React.FC<PythonCodeEditorProps> = ({
  initialCode = '',
  fileName,
  language,
  onCodeChange,
  onSave
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>('');
  const [errors, setErrors] = useState<string>('');
  const [plots, setPlots] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<Array<{
    timestamp: Date;
    code: string;
    output: string;
    success: boolean;
  }>>([]);
  const { isPyodideAvailable } = usePyodideState();

  useEffect(() => {
    // Load Monaco Editor dynamically
    const loadMonacoEditor = async () => {
      try {
        // Load Monaco Editor from CDN
        if (!(window as any).monaco) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
          document.head.appendChild(script);
          
          await new Promise((resolve) => {
            script.onload = resolve;
          });

          (window as any).require.config({ 
            paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } 
          });
          
          await new Promise((resolve) => {
            (window as any).require(['vs/editor/editor.main'], resolve);
          });
        }

        if (editorRef.current) {
          const monacoEditor = (window as any).monaco.editor.create(editorRef.current, {
            value: code,
            language: language === 'jupyter' ? 'json' : 'python',
            theme: 'vs-dark',
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            selectOnLineNumbers: true,
            matchBrackets: 'always',
            autoIndent: 'full',
          });

          monacoEditor.onDidChangeModelContent(() => {
            const newCode = monacoEditor.getValue();
            setCode(newCode);
            onCodeChange?.(newCode);
          });

          setEditor(monacoEditor);
        }
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
      }
    };

    loadMonacoEditor();

    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (editor && initialCode !== code) {
      editor.setValue(initialCode);
      setCode(initialCode);
    }
  }, [initialCode, editor]);

  const executeCode = async () => {
    if (!isPyodideAvailable) {
      setErrors('Python environment is not ready. Please wait for Pyodide to load.');
      return;
    }

    setIsExecuting(true);
    setOutput('');
    setErrors('');
    setPlots([]);

    try {
      const result = await executePythonCode(code);
      
      const execution = {
        timestamp: new Date(),
        code: code,
        output: result.result || '',
        success: !result.error
      };

      setExecutionHistory(prev => [execution, ...prev.slice(0, 9)]);

      if (result.error) {
        setErrors(result.error);
      } else {
        setOutput(result.result);
        if (result.plots && result.plots.length > 0) {
          setPlots(result.plots);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrors(errorMessage);
      
      setExecutionHistory(prev => [{
        timestamp: new Date(),
        code: code,
        output: '',
        success: false
      }, ...prev.slice(0, 9)]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = () => {
    onSave?.(code);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              {language === 'jupyter' ? 
                <FileText className="h-5 w-5 mr-2" /> : 
                <Code className="h-5 w-5 mr-2" />
              }
              {fileName}
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Badge variant={isPyodideAvailable ? "default" : "secondary"}>
                {isPyodideAvailable ? "Python Ready" : "Loading..."}
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={executeCode}
                disabled={isExecuting || !isPyodideAvailable}
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              
              <Button variant="outline" size="sm" onClick={downloadCode}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={editorRef} 
            className="border border-finance-steel/20 rounded-lg"
            style={{ height: '400px' }}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="output" className="w-full">
        <TabsList>
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="plots">Plots ({plots.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="output">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execution Results</CardTitle>
            </CardHeader>
            <CardContent>
              {errors ? (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <XCircle className="h-5 w-5 text-red-400 mr-2" />
                    <span className="font-medium text-red-400">Error</span>
                  </div>
                  <pre className="text-red-300 text-sm whitespace-pre-wrap">{errors}</pre>
                </div>
              ) : output ? (
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="font-medium text-green-400">Success</span>
                  </div>
                  <pre className="text-green-300 text-sm whitespace-pre-wrap">{output}</pre>
                </div>
              ) : (
                <div className="text-center py-8 text-finance-lightgray">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Execute your code to see the output here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plots">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generated Plots</CardTitle>
            </CardHeader>
            <CardContent>
              {plots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plots.map((plot, index) => (
                    <div key={index} className="border border-finance-steel/20 rounded-lg p-4">
                      <img src={plot} alt={`Plot ${index + 1}`} className="w-full h-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-finance-lightgray">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No plots generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {executionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {executionHistory.map((execution, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border ${
                          execution.success 
                            ? 'border-green-500/30 bg-green-900/10' 
                            : 'border-red-500/30 bg-red-900/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {execution.success ? (
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 mr-2" />
                            )}
                            <span className="text-sm text-finance-lightgray">
                              {formatTimestamp(execution.timestamp)}
                            </span>
                          </div>
                          <Badge variant={execution.success ? "default" : "destructive"}>
                            {execution.success ? "Success" : "Error"}
                          </Badge>
                        </div>
                        <pre className="text-xs text-finance-lightgray bg-finance-charcoal/30 p-2 rounded overflow-x-auto">
                          {execution.output || "No output"}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-finance-lightgray">
                    <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No execution history yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PythonCodeEditor;
