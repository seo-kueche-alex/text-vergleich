import React, { useState, useCallback, useRef } from 'react';
import { Split, FileText, Wand2, ArrowRightLeft, Eye, AlertCircle, Copy, Check, Printer } from 'lucide-react';
import { computeMarkdownDiff } from './utils/diffHelper';
import { improveTextWithGemini } from './services/gemini';
import { MarkdownPreview } from './components/MarkdownPreview';

const DEFAULT_TEXT = `# E-Rechnung für Freelancer 2025

**Wichtige Erkenntnisse:**
Ab 1. Januar 2025 müssen Freelancer im B2B-Bereich E-Rechnungen empfangen können.

*   Versand bleibt freiwillig bis Ende 2026.
*   B2C sind ausgenommen.
*   XRechnung und ZUGFeRD sind die Standards.

Nutzen Sie die Übergangsfrist!`;

const App: React.FC = () => {
  const [originalText, setOriginalText] = useState<string>(DEFAULT_TEXT);
  const [modifiedText, setModifiedText] = useState<string>(DEFAULT_TEXT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'diff'>('edit');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Ref to access the rendered HTML for copying
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate the diff string suitable for Markdown rendering
  const diffContent = React.useMemo(() => {
    if (!originalText || !modifiedText) return '';
    return computeMarkdownDiff(originalText, modifiedText);
  }, [originalText, modifiedText]);

  const handleAutoImprove = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const improved = await improveTextWithGemini(originalText);
      setModifiedText(improved);
      setActiveTab('diff');
    } catch (err: any) {
      setError(err.message || "Failed to generate improvements.");
    } finally {
      setIsProcessing(false);
    }
  }, [originalText]);

  const handleCopyToModified = () => {
    setModifiedText(originalText);
  };

  const handlePrint = () => {
    if (!previewRef.current) return;
    
    // Create a hidden iframe to print just the content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>MarkDiff Print</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { padding: 40px; font-family: sans-serif; }
              /* Ensure background colors print */
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
          </head>
          <body>
            ${previewRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Wait for styles to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleCopyDiff = async () => {
    if (!previewRef.current) return;

    try {
      // 1. Get the Rendered HTML (for Word/Email)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; color: #333;">
            ${previewRef.current.innerHTML}
          </body>
        </html>
      `;
      
      // 2. Get the HTML Source Code (for Markdown Editors)
      // Instead of converting to Markdown (**bold**), we pass the raw HTML string (<span...>)
      // This ensures that when you paste into a Markdown editor, it renders the colors correctly.
      const htmlSourceCode = diffContent;

      const copyListener = (e: ClipboardEvent) => {
        e.preventDefault();
        if (e.clipboardData) {
          // Rich Text (Word, Email)
          e.clipboardData.setData('text/html', htmlContent);
          // Plain Text (Code Editors, Markdown Editors) -> Now contains HTML tags!
          e.clipboardData.setData('text/plain', htmlSourceCode);
        }
      };

      document.addEventListener('copy', copyListener);
      const successful = document.execCommand('copy');
      document.removeEventListener('copy', copyListener);

      if (successful) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // Fallback
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
            'text/plain': new Blob([htmlSourceCode], { type: 'text/plain' }),
          }),
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Copy failed', err);
      setError("Could not copy automatically. Please try selecting the text manually.");
      setTimeout(() => setError(null), 4000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              MarkDiff AI
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'edit' 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Editor</span>
                </button>
                <button
                  onClick={() => setActiveTab('diff')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === 'diff' 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Diff</span>
                </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col">
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Editor Mode */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 h-full flex-grow ${activeTab === 'diff' ? 'hidden lg:grid' : ''}`}>
          
          {/* Left: Original */}
          <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                Original Text
              </span>
              <button 
                onClick={handleAutoImprove}
                disabled={isProcessing}
                className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all
                  ${isProcessing 
                    ? 'bg-blue-50 text-blue-400 cursor-not-allowed' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm border border-blue-100'
                  }`}
              >
                <Wand2 className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Improving...' : 'AI Auto-Fix'}
              </button>
            </div>
            <textarea
              className="flex-grow p-4 w-full resize-none outline-none text-sm font-mono leading-relaxed text-slate-700 placeholder-slate-400 focus:bg-slate-50 transition-colors"
              placeholder="Paste your original markdown here..."
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              spellCheck={false}
            />
          </div>

          {/* Right: Modified */}
          <div className={`flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${activeTab === 'diff' ? 'hidden lg:flex' : ''}`}>
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Modified Text
              </span>
              <button 
                onClick={handleCopyToModified}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium hover:bg-slate-100 px-2 py-1 rounded transition-colors"
              >
                Copy Original
              </button>
            </div>
            <textarea
              className="flex-grow p-4 w-full resize-none outline-none text-sm font-mono leading-relaxed text-slate-700 placeholder-slate-400 focus:bg-slate-50 transition-colors"
              placeholder="Edit this text to see changes in the diff view..."
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Diff Mode (Mobile/Tablet Only for split view mostly, but full view here) */}
        {activeTab === 'diff' && (
          <div className="flex-grow h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
             <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Split className="w-4 h-4" />
                Diff Visualization
              </span>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 opacity-50"></span>
                    <span className="line-through text-slate-500">Removed</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    <span className="bg-yellow-100 text-yellow-900 px-1 rounded">Added</span>
                  </span>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1.5 rounded border border-slate-200 hover:border-slate-300 shadow-sm transition-all group"
                  title="Print the diff view"
                >
                  <Printer className="w-3.5 h-3.5 group-hover:text-blue-600" />
                  <span>Print</span>
                </button>

                <button
                  onClick={handleCopyDiff}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1.5 rounded border border-slate-200 hover:border-slate-300 shadow-sm transition-all group"
                  title="Copy HTML (Preserves colors in Markdown editors)"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 group-hover:text-blue-600" />}
                  <span>{copySuccess ? 'Copied!' : 'Copy HTML'}</span>
                </button>
              </div>
            </div>
            <div className="flex-grow p-8 overflow-auto bg-white" ref={previewRef}>
              <MarkdownPreview content={diffContent} />
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>Powered by React, Diff.js, and Gemini 2.0 Flash</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
