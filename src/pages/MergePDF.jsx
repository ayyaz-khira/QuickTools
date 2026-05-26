import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUp, Download, AlertCircle, Check, FileText, Trash2, Eye, X, GripVertical, RefreshCw } from 'lucide-react';
import SEO from '../components/SEO';
import { isSupportedPdfFile } from '../utils/fileValidation';

export default function MergePDF() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const fileInputRef = useRef(null);
  const prevOutputUrlRef = useRef(null);
  const pdfFilesRef = useRef([]);

  useEffect(() => {
    pdfFilesRef.current = pdfFiles;
  }, [pdfFiles]);

  useEffect(() => {
    return () => {
      if (prevOutputUrlRef.current) URL.revokeObjectURL(prevOutputUrlRef.current);
      pdfFilesRef.current.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    handleFiles(files);
    e.target.value = '';
  };

  const handleFiles = async (files) => {
    setError(null);
    setIsLoadingFiles(true);
    const fileArray = Array.from(files);
    const validFiles = [];

    try {
      for (const file of fileArray) {
        if (!isSupportedPdfFile(file)) {
          setError('Only PDF files are supported.');
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          setError('Some files exceed 50 MB limit and were skipped.');
          continue;
        }

        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const pageCount = pdfDoc.getPageCount();

          validFiles.push({
            id: Date.now() + Math.random(),
            name: file.name,
            file,
            arrayBuffer,
            pageCount,
            preview: URL.createObjectURL(file),
          });
        } catch (err) {
          console.error(err);
          setError(`Could not read ${file.name}. It may be corrupted or password-protected.`);
        }
      }

      setPdfFiles((prev) => [...prev, ...validFiles]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const removeFile = (id) => {
    setPdfFiles((prev) => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const moveFile = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= pdfFiles.length) return;
    const newFiles = [...pdfFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setPdfFiles(newFiles);
  };

  const mergePdfs = async () => {
    if (pdfFiles.length < 2) {
      setError('Please select at least 2 PDF files to merge.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setOutputUrl(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of pdfFiles) {
        const sourceDoc = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(sourceDoc, sourceDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (prevOutputUrlRef.current) {
        URL.revokeObjectURL(prevOutputUrlRef.current);
      }
      prevOutputUrlRef.current = url;

      setOutputUrl(url);
      setOutputFilename('merged-documents.pdf');
    } catch (err) {
      console.error(err);
      setError('Failed to merge PDFs. Please try with different files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!outputUrl) return;
    const link = document.createElement('a');
    link.href = outputUrl;
    link.download = outputFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const clearAll = () => {
    pdfFiles.forEach(f => URL.revokeObjectURL(f.preview));
    setPdfFiles([]);
    setOutputUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <SEO
        title="Merge PDF Online Free | Combine Multiple PDFs | QuickTools"
        description="Merge multiple PDF files into one. Reorder pages, combine documents, and download instantly in your browser. No uploads, no servers, 100% private."
      />

      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-extrabold text-slate-900">Merge PDF Files</h1>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Combine multiple PDF documents into one. Drag to reorder files, then merge instantly in your browser. All processing happens locally—your files never leave your device.
          </p>
        </div>

        {/* Upload Section */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-6">
          <div>
            <p className="font-semibold text-slate-900 mb-2">Upload PDFs</p>
            <p className="text-sm text-slate-500">Select or drag and drop multiple PDF files. You can reorder them before merging.</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            className={`rounded-3xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
              dragActive
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-300 bg-slate-50 hover:border-purple-400 hover:bg-white'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDrag}
            onDragEnter={handleDrag}
            onDragLeave={() => setDragActive(false)}
            onClick={() => !isLoadingFiles && fileInputRef.current?.click()}
          >
            {isLoadingFiles ? (
              <RefreshCw className="h-12 w-12 text-purple-500 mx-auto mb-3 animate-spin" />
            ) : (
              <FileUp className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            )}
            <p className="text-sm text-slate-600 font-semibold">
              {isLoadingFiles ? 'Reading PDF files...' : 'Drag and drop your PDFs here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{isLoadingFiles ? 'Checking pages and file details' : 'or click to select files'}</p>
            <p className="text-xs text-slate-400 mt-2">Max 50 MB per file</p>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {pdfFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{pdfFiles.length} file{pdfFiles.length !== 1 ? 's' : ''} selected</p>
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pdfFiles.map((pdf, index) => (
                  <div
                    key={pdf.id}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null && draggedIndex !== index) {
                        moveFile(draggedIndex, index);
                        setDraggedIndex(null);
                      }
                    }}
                    className={`rounded-2xl border-2 p-4 flex items-center justify-between cursor-move transition ${
                      draggedIndex === index
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-slate-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <GripVertical className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{pdf.name}</p>
                        <p className="text-xs text-slate-500">{pdf.pageCount} page{pdf.pageCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(pdf.id)}
                      className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Merge Button */}
        {pdfFiles.length >= 2 && (
          <button
            onClick={mergePdfs}
            disabled={isProcessing || isLoadingFiles}
            className="w-full rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
            {isProcessing ? 'Merging PDFs...' : `Merge ${pdfFiles.length} PDF${pdfFiles.length !== 1 ? 's' : ''}`}
          </button>
        )}

        {/* Download Section */}
        {outputUrl && (
          <div className="glass-panel rounded-3xl p-8 border border-purple-200/60 bg-purple-50/50 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-semibold text-slate-900">PDFs Merged Successfully</p>
                  <p className="text-sm text-slate-600">Your merged PDF is ready to download.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button
                  onClick={downloadPdf}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">How to Use</h2>
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
              <li>Upload multiple PDF files by dragging and dropping or selecting them.</li>
              <li>Drag files to reorder them in the order you want them merged.</li>
              <li>Click "Merge PDFs" to combine all files into one document.</li>
              <li>Preview the result or download your merged PDF instantly.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">FAQ</h3>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Is my data safe and private?</p>
                <p className="text-sm text-slate-600 mt-1">
                  Yes. All processing happens entirely in your browser. Your PDFs never leave your device or contact any server.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Can I reorder the PDFs before merging?</p>
                <p className="text-sm text-slate-600 mt-1">
                  Yes! Drag and drop files to reorder them. The merge will follow the order you set.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">What's the file size limit?</p>
                <p className="text-sm text-slate-600 mt-1">Each PDF can be up to 50 MB. You can merge multiple files together.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Can I merge password-protected PDFs?</p>
                <p className="text-sm text-slate-600 mt-1">
                  Password-protected PDFs may not be readable. Try converting them to regular PDFs first.
                </p>
              </div>
            </div>
          </div>

        </section>
      </div>

      {/* Preview Modal */}
      {showPreview && outputUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">PDF Preview</h2>
                <p className="text-sm text-slate-600 mt-1">{outputFilename}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto bg-slate-100">
              <iframe
                src={outputUrl}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-4 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  downloadPdf();
                  setShowPreview(false);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
