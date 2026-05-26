import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { FileUp, Download, Settings, Trash2, AlertCircle, Check, FileText, Eye, X, RefreshCw } from 'lucide-react';
import SEO from '../components/SEO';
import { isSupportedPdfFile } from '../utils/fileValidation';

const POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

export default function AddPageNumbersToPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Page number controls
  const [position, setPosition] = useState('bottom-center');
  const [startPage, setStartPage] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [margin, setMargin] = useState(20);

  const fileInputRef = useRef(null);
  const prevOutputUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (prevOutputUrlRef.current) URL.revokeObjectURL(prevOutputUrlRef.current);
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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    setError(null);
    setOutputUrl(null);
    setIsLoadingFile(true);

    try {
      if (!isSupportedPdfFile(file)) {
        setError('Only PDF files are supported.');
        setPdfFile(null);
        setPdfData(null);
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50 MB limit.');
        setPdfFile(null);
        setPdfData(null);
        return;
      }

      setFileName(file.name);
      setPdfFile(file);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();
      setPdfData({ arrayBuffer, pageCount });
    } catch (err) {
      console.error(err);
      setError('Could not read PDF file. It may be corrupted or password-protected.');
      setPdfFile(null);
      setPdfData(null);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const getPageNumberPosition = (pageWidth, pageHeight) => {
    const x = pageWidth / 2;

    const positions = {
      'top-left': { x: margin, y: pageHeight - margin - fontSize },
      'top-center': { x, y: pageHeight - margin - fontSize },
      'top-right': { x: pageWidth - margin, y: pageHeight - margin - fontSize },
      'bottom-left': { x: margin, y: margin },
      'bottom-center': { x, y: margin },
      'bottom-right': { x: pageWidth - margin, y: margin },
    };

    return positions[position] || positions['bottom-center'];
  };

  const addPageNumbers = async () => {
    if (!pdfData || !pdfFile) {
      setError('Please select a PDF file first.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setOutputUrl(null);

    try {
      const pdfDoc = await PDFDocument.load(pdfData.arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      pages.forEach((page, index) => {
        const pageNum = startPage + index;
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const { x, y } = getPageNumberPosition(pageWidth, pageHeight);

        // Calculate text width to center it properly
        const textWidth = helvetica.widthOfTextAtSize(`${pageNum}`, fontSize);

        let drawX = x;
        if (position.includes('center')) {
          drawX = x - textWidth / 2;
        } else if (position.includes('right')) {
          drawX = x - textWidth;
        }

        page.drawText(`${pageNum}`, {
          x: drawX,
          y,
          size: fontSize,
          font: helvetica,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (prevOutputUrlRef.current) {
        URL.revokeObjectURL(prevOutputUrlRef.current);
      }
      prevOutputUrlRef.current = url;

      setOutputUrl(url);
      setOutputFilename(`${fileName.replace('.pdf', '')}-numbered.pdf`);
    } catch (err) {
      console.error(err);
      setError('Failed to add page numbers. Please try with a different PDF.');
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

  const resetAll = () => {
    setPdfFile(null);
    setPdfData(null);
    setFileName('');
    setOutputUrl(null);
    setError(null);
    setStartPage(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <SEO
        title="Add Page Numbers to PDF Online Free | QuickTools"
        description="Add page numbers to PDF files online for free. Choose placement position and download the updated PDF instantly in your browser."
      />

      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-extrabold text-slate-900">Add Page Numbers to PDF</h1>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Add page numbers to your PDF documents directly in your browser. Choose where the numbers appear and customize their size and spacing. No uploads, no servers, 100% private.
          </p>
        </div>

        {/* Upload Section */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-6">
          <div>
            <p className="font-semibold text-slate-900 mb-2">Upload PDF</p>
            <p className="text-sm text-slate-500">Select or drag and drop a PDF file to get started.</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            className={`rounded-3xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-white'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDrag}
            onDragEnter={handleDrag}
            onDragLeave={() => setDragActive(false)}
            onClick={() => !isLoadingFile && fileInputRef.current?.click()}
          >
            {isLoadingFile ? (
              <RefreshCw className="h-12 w-12 text-indigo-500 mx-auto mb-3 animate-spin" />
            ) : (
              <FileUp className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            )}
            <p className="text-sm text-slate-600 font-semibold">
              {isLoadingFile ? 'Reading PDF...' : 'Drag and drop your PDF here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{isLoadingFile ? 'Checking page count and file details' : 'or click to select a file'}</p>
            <p className="text-xs text-slate-400 mt-2">Max 50 MB</p>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {pdfFile && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-indigo-600" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm truncate">{fileName}</p>
                  <p className="text-xs text-slate-500">
                    {pdfData?.pageCount} page{pdfData?.pageCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={resetAll}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Controls Section */}
        {pdfFile && (
          <div className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Page Number Settings
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Position
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POSITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPosition(opt.value)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                        position === opt.value
                          ? 'bg-indigo-600 text-white border border-indigo-600'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Page Number */}
              <div>
                <label htmlFor="start-page" className="block text-sm font-semibold text-slate-900 mb-2">
                  Start Page Number
                </label>
                <input
                  id="start-page"
                  type="number"
                  min="1"
                  value={startPage}
                  onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Font Size */}
              <div>
                <label htmlFor="font-size" className="block text-sm font-semibold text-slate-900 mb-2">
                  Font Size: {fontSize}px
                </label>
                <input
                  id="font-size"
                  type="range"
                  min="8"
                  max="32"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Margin */}
              <div>
                <label htmlFor="margin" className="block text-sm font-semibold text-slate-900 mb-2">
                  Margin: {margin}pt
                </label>
                <input
                  id="margin"
                  type="range"
                  min="10"
                  max="50"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <button
              onClick={addPageNumbers}
              disabled={isProcessing || isLoadingFile}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isProcessing && <RefreshCw className="h-4 w-4 animate-spin" />}
              {isProcessing ? 'Adding Page Numbers...' : 'Add Page Numbers'}
            </button>
          </div>
        )}

        {/* Download Section */}
        {outputUrl && (
          <div className="glass-panel rounded-3xl p-8 border border-emerald-200/60 bg-emerald-50/50 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-900">PDF Ready</p>
                  <p className="text-sm text-slate-600">Page numbers have been added successfully.</p>
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
                  Download PDF
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
              <li>Upload a PDF file using the drag-and-drop area or file picker.</li>
              <li>Choose where page numbers should appear (top or bottom, left/center/right).</li>
              <li>Set the starting page number and adjust font size and margin as needed.</li>
              <li>Click "Add Page Numbers" to process the PDF.</li>
              <li>Download your PDF with page numbers instantly.</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">FAQ</h3>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Will my PDF be uploaded to a server?</p>
                <p className="text-sm text-slate-600 mt-1">
                  No. All processing happens entirely in your browser. Your PDF never leaves your device.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Can I skip numbering on the first page?</p>
                <p className="text-sm text-slate-600 mt-1">
                  Set the start page number to 0 or use the start number option. All pages will receive numbers based on your settings.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">What file size limit applies?</p>
                <p className="text-sm text-slate-600 mt-1">PDFs up to 50 MB are supported for fast local processing.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Can I customize fonts or colors?</p>
                <p className="text-sm text-slate-600 mt-1">
                  Currently, page numbers are added in black using a standard font. This keeps the tool lightweight and focused.
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
                <p className="text-sm text-slate-600 mt-1">{fileName}</p>
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
