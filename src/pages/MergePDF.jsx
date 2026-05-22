import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  FileUp,
  Trash2,
  ChevronUp,
  ChevronDown,
  GitMerge,
  Scissors,
  Settings,
  Download,
  ArrowLeft,
  Files,
  CheckCircle,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import { isSupportedPdfFile } from '../utils/fileValidation';

export default function MergePDF() {
  useSEO({
    title: 'Merge & Split PDF Utilities',
    description: 'Merge multiple PDF documents or split pages from a single PDF into new documents. 100% private, client-side PDF editing.'
  });

  const [activeTab, setActiveTab] = useState('merge');
  const [pdfFiles, setPdfFiles] = useState([]);
  const [singlePdf, setSinglePdf] = useState(null);

  const [splitStart, setSplitStart] = useState(1);
  const [splitEnd, setSplitEnd] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('No files selected yet.');

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);
  const prevOutputUrlRef = useRef(null);

  const createFileId = () => (
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  // Clean up object URLs
  useEffect(() => {
    if (outputUrl) {
      if (prevOutputUrlRef.current && prevOutputUrlRef.current !== outputUrl) {
        URL.revokeObjectURL(prevOutputUrlRef.current);
      }
      prevOutputUrlRef.current = outputUrl;
    } else if (prevOutputUrlRef.current) {
      URL.revokeObjectURL(prevOutputUrlRef.current);
      prevOutputUrlRef.current = null;
    }
  }, [outputUrl]);

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

  const readPdfFileMetadata = async (file) => {
    try {
      const arrayBuffer = await new Response(file).arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return { arrayBuffer, pageCount: pdfDoc.getPageCount() };
    } catch (err) {
      console.error(err);
      throw new Error('Invalid, corrupted, or password-protected PDF.');
    }
  };

  const getPdfBaseName = (filename) => filename.replace(/\.pdf$/i, '') || 'document';

  const downloadOutput = () => {
    if (!outputUrl) return;
    const link = document.createElement('a');
    link.href = outputUrl;
    link.download = outputFilename || 'quicktools_output.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const resetFileInputs = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
  };

  const validateAndProcessFiles = async (files) => {
    setError(null);
    const maxFilesLimit = 20;
    const maxSizeLimit = 12 * 1024 * 1024;

    if (activeTab === 'merge') {
      if (pdfFiles.length + files.length > maxFilesLimit) {
        setError(`You can merge a maximum of ${maxFilesLimit} PDFs at once.`);
        resetFileInputs();
        return;
      }

      setIsProcessing(true);
      const acceptedFiles = [];
      const rejectedMessages = [];

      for (const file of Array.from(files)) {
        if (!isSupportedPdfFile(file)) {
          rejectedMessages.push(`${file.name}: only PDF files are supported.`);
          continue;
        }
        if (file.size > maxSizeLimit) {
          rejectedMessages.push(`${file.name}: exceeds the 12MB size limit.`);
          continue;
        }
        acceptedFiles.push(file);
      }

      if (acceptedFiles.length === 0) {
        setError(rejectedMessages[0] || 'No valid PDF files were selected.');
        setIsProcessing(false);
        resetFileInputs();
        return;
      }

      const pendingPdfs = acceptedFiles.map((file) => ({
        id: createFileId(),
        name: file.name,
        sizeKb: parseFloat((file.size / 1024).toFixed(1)),
        pages: null,
        arrayBuffer: null,
        status: 'reading',
        error: null
      }));

      setPdfFiles((prev) => [...prev, ...pendingPdfs]);
      setOutputUrl(null);
      setUploadStatus(`Selected ${acceptedFiles.length} PDF${acceptedFiles.length === 1 ? '' : 's'}. Reading metadata...`);

      try {
        const failed = [];
        await Promise.all(
          pendingPdfs.map(async (pdfItem, index) => {
            const file = acceptedFiles[index];
            try {
              const { arrayBuffer, pageCount } = await readPdfFileMetadata(file);
              setPdfFiles((prev) =>
                prev.map((item) =>
                  item.id === pdfItem.id
                    ? { ...item, pages: pageCount, arrayBuffer, status: 'ready', error: null }
                    : item
                )
              );
            } catch (err) {
              failed.push(`${pdfItem.name}: ${err.message}`);
              setPdfFiles((prev) =>
                prev.map((item) =>
                  item.id === pdfItem.id
                    ? { ...item, status: 'error', error: err.message }
                    : item
                )
              );
            }
          })
        );

        if (failed.length > 0 || rejectedMessages.length > 0) {
          setError([...rejectedMessages, ...failed].join(' '));
        }

        const readyCount = pendingPdfs.length - failed.length;
        setUploadStatus(`${readyCount} PDF${readyCount === 1 ? '' : 's'} ready${failed.length ? `, ${failed.length} failed` : ''}.`);
      } catch (err) {
        setError(`Could not process selected PDFs: ${err.message}`);
      } finally {
        setIsProcessing(false);
        resetFileInputs();        // Critical fix
      }
    } else {
      // Split mode
      const file = files[0];
      if (!file) return;

      if (!isSupportedPdfFile(file)) {
        setError('Only PDF files are supported.');
        resetFileInputs();
        return;
      }
      if (file.size > maxSizeLimit) {
        setError(`File ${file.name} exceeds the 12MB size limit.`);
        resetFileInputs();
        return;
      }

      setIsProcessing(true);
      try {
        const { arrayBuffer, pageCount } = await readPdfFileMetadata(file);
        setSinglePdf({
          name: file.name,
          sizeKb: parseFloat((file.size / 1024).toFixed(1)),
          pages: pageCount,
          arrayBuffer
        });
        setSplitStart(1);
        setSplitEnd(pageCount);
        setOutputUrl(null);
        setUploadStatus(`Selected ${file.name}. Ready to split.`);
      } catch (err) {
        setError(`Error loading ${file.name}: ${err.message}`);
      } finally {
        setIsProcessing(false);
        resetFileInputs();
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files?.length) {
      validateAndProcessFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadStatus(`Browser selected ${files.length} file${files.length > 1 ? 's' : ''}`);
    validateAndProcessFiles(files);
  };

  const moveFile = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pdfFiles.length - 1) return;
    const newFiles = [...pdfFiles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;
    setPdfFiles(newFiles);
    setOutputUrl(null);
  };

  const removeFile = (index) => {
    const newFiles = [...pdfFiles];
    newFiles.splice(index, 1);
    setPdfFiles(newFiles);
    setOutputUrl(null);
  };

  const clearAll = () => {
    setPdfFiles([]);
    setSinglePdf(null);
    setOutputUrl(null);
    setError(null);
    setUploadStatus('No files selected yet.');
    resetFileInputs();
  };

  const processMerge = async () => {
    const readyFiles = pdfFiles.filter((file) => file.status === 'ready' && file.arrayBuffer);
    if (readyFiles.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();
      for (const fileObj of readyFiles) {
        const donorPdf = await PDFDocument.load(fileObj.arrayBuffer, { ignoreEncryption: true });
        const pageIndices = donorPdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(donorPdf, pageIndices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setOutputFilename(`${getPdfBaseName(readyFiles[0].name)}_merged.pdf`);
    } catch (err) {
      console.error(err);
      setError('Failed to merge PDFs. Please verify none of the files are encrypted or corrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processSplit = async () => {
    if (!singlePdf) return;
    if (splitStart < 1 || splitEnd > singlePdf.pages || splitStart > splitEnd) {
      setError('Invalid page range selected.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const donorPdf = await PDFDocument.load(singlePdf.arrayBuffer);
      const splitDoc = await PDFDocument.create();
      const indicesToCopy = [];
      for (let i = splitStart - 1; i < splitEnd; i++) {
        indicesToCopy.push(i);
      }

      const copiedPages = await splitDoc.copyPages(donorPdf, indicesToCopy);
      copiedPages.forEach((page) => splitDoc.addPage(page));

      const splitPdfBytes = await splitDoc.save();
      const blob = new Blob([splitPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setOutputFilename(`${getPdfBaseName(singlePdf.name)}_pages_${splitStart}_to_${splitEnd}.pdf`);
    } catch (err) {
      console.error(err);
      setError('Failed to split PDF document. Please verify the file is not encrypted or corrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const readyPdfCount = pdfFiles.filter((file) => file.status === 'ready' && file.arrayBuffer).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <Link to="/" className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tools</span>
        </Link>
        <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100/50 rounded-full">
          PDF Suite
        </span>
      </div>

      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Merge & Split PDF
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl font-semibold">
            Combine multiple PDF files in any order or extract a range of pages into a new document. 100% private, runs entirely on your machine.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/40 w-fit shrink-0">
          <button
            onClick={() => { setActiveTab('merge'); clearAll(); }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'merge' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <GitMerge className="h-3.5 w-3.5" />
            <span>Merge PDFs</span>
          </button>
          <button
            onClick={() => { setActiveTab('split'); clearAll(); }}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'split' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span>Split PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Zone */}
          {((activeTab === 'merge' && pdfFiles.length === 0) || (activeTab === 'split' && !singlePdf)) && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 bg-white/50 hover:bg-white/80'}`}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                  <FileUp className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700">
                    {activeTab === 'merge' ? 'Drag and drop your PDF files here' : 'Drag and drop a PDF file here'}
                  </p>
                  <p className="text-xs text-slate-400 font-semibold">Supports standard PDF documents (Max 12MB each)</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  onChange={handleFileInput}
                  className="block w-full max-w-sm text-sm text-slate-700 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white file:font-bold file:text-xs hover:file:bg-indigo-600 file:cursor-pointer"
                />

                <p className="text-[10px] text-slate-400 font-bold">{uploadStatus}</p>
              </div>
            </div>
          )}

          {/* Merge Files List */}
          {activeTab === 'merge' && pdfFiles.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <Files className="h-5 w-5 text-slate-400" />
                  <h3 className="font-extrabold text-sm text-slate-700">Selected Documents ({pdfFiles.length})</h3>
                </div>
                <button onClick={clearAll} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center space-x-1 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Add More */}
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <input
                  ref={addMoreInputRef}
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  onChange={handleFileInput}
                  className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-200 file:bg-white file:text-slate-700 file:font-bold file:text-xs hover:file:border-indigo-400 hover:file:text-indigo-600 file:cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 font-semibold">Add more PDFs to merge</span>
              </div>

              <p className="text-[10px] text-slate-400 font-bold">{uploadStatus}</p>

              <div className="space-y-3">
                {pdfFiles.map((fileObj, index) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center justify-between p-4 border border-slate-150 rounded-2xl bg-white shadow-sm hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 font-bold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-700 truncate" title={fileObj.name}>
                          {fileObj.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-2 mt-0.5">
                          <span>
                            {fileObj.status === 'reading' && 'Reading...'}
                            {fileObj.status === 'error' && 'Could not read'}
                            {fileObj.status === 'ready' && `${fileObj.pages} page${fileObj.pages > 1 ? 's' : ''}`}
                          </span>
                          <span>•</span>
                          <span>{fileObj.sizeKb} KB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex flex-col space-y-0.5">
                        <button
                          onClick={() => moveFile(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-40 text-slate-600 cursor-pointer"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveFile(index, 'down')}
                          disabled={index === pdfFiles.length - 1}
                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-40 text-slate-600 cursor-pointer"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Split View */}
          {activeTab === 'split' && singlePdf && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-sm text-slate-700">Uploaded Document</h3>
                <button onClick={clearAll} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center space-x-1 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Document</span>
                </button>
              </div>

              <div className="p-4 border border-indigo-100/50 rounded-2xl bg-indigo-50/20 flex items-start space-x-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                  <Files className="h-6 w-6" />
                </div>
                <div className="space-y-1 truncate">
                  <h4 className="text-xs font-extrabold text-slate-700 truncate" title={singlePdf.name}>
                    {singlePdf.name}
                  </h4>
                  <div className="text-[10px] text-slate-400 font-bold tracking-wide uppercase flex items-center space-x-2">
                    <span>{singlePdf.pages} Total Pages</span>
                    <span>•</span>
                    <span>{singlePdf.sizeKb} KB</span>
                  </div>
                </div>
              </div>

              {/* Page Preview */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Select Range Preview</label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl max-h-36 overflow-y-auto">
                  {Array.from({ length: singlePdf.pages }).map((_, i) => {
                    const pg = i + 1;
                    const inRange = pg >= splitStart && pg <= splitEnd;
                    return (
                      <div
                        key={pg}
                        className={`w-9 h-11 rounded-lg border flex flex-col items-center justify-between p-1 text-[9px] font-extrabold transition-all ${
                          inRange ? 'border-indigo-400 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      >
                        <div className="w-full h-1 bg-current opacity-20 rounded"></div>
                        <span>{pg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Panel + Privacy Note - unchanged from your original */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
              <Settings className="h-5 w-5 text-indigo-500" />
              <h3 className="font-extrabold text-sm text-slate-700">PDF Actions</h3>
            </div>

            {activeTab === 'merge' ? (
              <div className="space-y-4">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Merging Strategy</div>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Documents are concatenated sequentially based on the order shown on the left.
                </p>

                {outputUrl ? (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-2.5 rounded-xl border border-indigo-100/50">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>Merge complete!</span>
                    </div>
                    <button
                      onClick={downloadOutput}
                      className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Merged PDF</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={processMerge}
                    disabled={readyPdfCount < 2 || isProcessing}
                    className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold text-sm transition-all flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
                  >
                    <GitMerge className="h-4 w-4" />
                    <span>{isProcessing ? 'Processing...' : 'Merge Documents'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Split controls - same as before */}
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Page Extraction Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold">Start Page</span>
                      <input
                        type="number"
                        min={1}
                        max={singlePdf?.pages || 1}
                        value={splitStart}
                        onChange={(e) => setSplitStart(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold">End Page</span>
                      <input
                        type="number"
                        min={splitStart}
                        max={singlePdf?.pages || 1}
                        value={splitEnd}
                        onChange={(e) => setSplitEnd(Math.max(splitStart, Math.min(singlePdf?.pages || 1, parseInt(e.target.value) || 1)))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                {outputUrl ? (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <button onClick={downloadOutput} className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download Split PDF</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={processSplit}
                    disabled={!singlePdf || isProcessing}
                    className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold text-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <Scissors className="h-4 w-4" />
                    <span>{isProcessing ? 'Extracting...' : 'Extract & Split PDF'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="bg-slate-50 border border-slate-150 p-5 rounded-3xl flex items-start space-x-3">
            <Lock className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700">Secure Client Sandbox</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                All operations happen in your browser. No files are uploaded to any server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}