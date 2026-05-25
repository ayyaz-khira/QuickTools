import { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Files, Upload, Download, Trash2, FileText } from 'lucide-react';
import SEO from '../components/SEO';
import { isSupportedImageFile } from '../utils/fileValidation';

const pageConfigs = {
  default: {
    title: 'Image to PDF Converter | QuickTools',
    description: 'Convert JPG, PNG, and WEBP images into a printable PDF document instantly in your browser. No uploads or backend required.',
    pageName: 'Image to PDF Converter',
    heading: 'Image to PDF Converter',
    intro: 'Convert JPG, PNG, or WEBP images into a printable PDF document in your browser. No uploads, no backend, and no data leaves your device.',
    uploadLabel: 'Upload images',
    uploadHelp: 'Select one or more image files to combine into a PDF. Each image becomes one PDF page.',
    whyHeading: 'Why use Image to PDF?',
    benefits: [
      'Create a PDF from one or multiple images instantly without uploading files.',
      'Each photo becomes its own page for easy printing and sharing.',
      'All conversion is performed locally in the browser for full privacy.',
      'Supports JPG, JPEG, PNG, and WEBP images.'
    ],
    howToHeading: 'How to Convert Images to PDF',
    steps: [
      'Upload one or more JPG, PNG, or WEBP images.',
      'Review the selected images and remove anything you do not need.',
      'Click Convert to PDF to create one printable PDF document.',
      'Download the generated PDF directly to your device.'
    ],
    faqs: [
      ['Are my images uploaded?', 'No. The PDF is created locally in your browser, so your images never leave your device.'],
      ['Can I convert multiple images at once?', 'Yes. Add multiple images and QuickTools will place each image on its own PDF page.'],
      ['Which image formats are supported?', 'QuickTools supports JPG, JPEG, PNG, and WEBP images for PDF conversion.']
    ]
  },
  jpg: {
    title: 'JPG to PDF Converter Online Free | QuickTools',
    description: 'Convert JPG images to PDF online for free in your browser. Fast, private JPG to PDF conversion with no uploads or account required.',
    pageName: 'JPG to PDF Converter',
    heading: 'JPG to PDF Converter',
    intro: 'Convert JPG and JPEG photos into a clean PDF document instantly. The conversion runs locally in your browser, so your files stay private.',
    uploadLabel: 'Upload JPG images',
    uploadHelp: 'Select one or more JPG/JPEG files to turn them into a PDF. Each JPG becomes one PDF page.',
    whyHeading: 'Why convert JPG to PDF?',
    benefits: [
      'Turn JPG photos, scans, and documents into a single PDF for easy sharing.',
      'Keep original image privacy with browser-only processing.',
      'Create print-friendly A4 PDF pages from JPG or JPEG files.',
      'Combine multiple JPG images into one PDF without installing software.'
    ],
    howToHeading: 'How to Convert JPG to PDF',
    steps: [
      'Upload your JPG or JPEG image files.',
      'Check the image order and remove any file you do not want in the PDF.',
      'Click Convert to PDF to generate the document in your browser.',
      'Download the finished PDF file.'
    ],
    faqs: [
      ['Can I convert JPEG files too?', 'Yes. JPG and JPEG files are both supported.'],
      ['Will the JPG quality be preserved?', 'QuickTools uses high-quality image export while fitting each image onto a PDF page.'],
      ['Can I combine several JPGs into one PDF?', 'Yes. Select multiple JPG images and each one will be added as a separate page.']
    ]
  },
  png: {
    title: 'PNG to PDF Converter Online Free | QuickTools',
    description: 'Convert PNG images to PDF online for free with private browser-based processing. No uploads, signups, or backend storage.',
    pageName: 'PNG to PDF Converter',
    heading: 'PNG to PDF Converter',
    intro: 'Convert PNG images, screenshots, and transparent graphics into a printable PDF in your browser. No upload or server processing is required.',
    uploadLabel: 'Upload PNG images',
    uploadHelp: 'Select one or more PNG files to place into a PDF. Transparent areas are rendered on a white page background.',
    whyHeading: 'Why convert PNG to PDF?',
    benefits: [
      'Make screenshots and PNG images easier to print, submit, or share.',
      'Convert transparent PNGs onto a clean white PDF page.',
      'Combine multiple PNG files into a single PDF document.',
      'Keep sensitive screenshots private with local browser conversion.'
    ],
    howToHeading: 'How to Convert PNG to PDF',
    steps: [
      'Upload your PNG image files.',
      'Review the selected PNG previews.',
      'Click Convert to PDF to create the document locally.',
      'Download the generated PDF.'
    ],
    faqs: [
      ['What happens to transparent PNG backgrounds?', 'Transparent areas are placed on a white PDF page for predictable printing.'],
      ['Can I upload screenshots?', 'Yes. PNG screenshots work well for PDF conversion.'],
      ['Are PNG files sent to a server?', 'No. The conversion happens inside your browser only.']
    ]
  },
  images: {
    title: 'Images to PDF Converter Online Free | QuickTools',
    description: 'Convert multiple images to one PDF online for free. Combine JPG, PNG, and WEBP images privately in your browser with no uploads.',
    pageName: 'Images to PDF Converter',
    heading: 'Images to PDF Converter',
    intro: 'Combine multiple JPG, PNG, and WEBP images into one PDF document. Each image becomes its own page, ready for download and printing.',
    uploadLabel: 'Upload multiple images',
    uploadHelp: 'Select all images you want to combine. QuickTools will create a multi-page PDF from your selected files.',
    whyHeading: 'Why convert images to one PDF?',
    benefits: [
      'Bundle multiple photos, scans, receipts, or screenshots into one document.',
      'Create a multi-page PDF without uploading private files.',
      'Use mixed JPG, PNG, and WEBP files in the same PDF.',
      'Download one organized PDF instead of sending many image files.'
    ],
    howToHeading: 'How to Convert Multiple Images to PDF',
    steps: [
      'Upload all images you want to combine.',
      'Review the selected files and remove unwanted images.',
      'Click Convert to PDF to build a multi-page document.',
      'Download your combined PDF.'
    ],
    faqs: [
      ['Can I mix JPG and PNG images?', 'Yes. You can combine JPG, JPEG, PNG, and WEBP images in one PDF.'],
      ['Does each image get its own page?', 'Yes. Each selected image is placed on a separate PDF page.'],
      ['Is there a file upload?', 'No. Everything runs locally in your browser.']
    ]
  },
  photo: {
    title: 'Photo to PDF Converter Online Free | QuickTools',
    description: 'Convert photos to PDF online for free. Turn phone pictures, scans, and document photos into a PDF privately in your browser.',
    pageName: 'Photo to PDF Converter',
    heading: 'Photo to PDF Converter',
    intro: 'Turn photos from your phone, camera, or scanner into a PDF document. QuickTools converts locally in your browser with no uploads.',
    uploadLabel: 'Upload photos',
    uploadHelp: 'Select one or more photos to convert into a PDF. This works well for document photos, receipts, notes, and scanned pages.',
    whyHeading: 'Why convert photos to PDF?',
    benefits: [
      'Turn document photos into a PDF for forms, email, or printing.',
      'Combine several photo pages into one easy-to-share file.',
      'Keep personal photos and documents private with local processing.',
      'Create a PDF quickly from phone or camera images.'
    ],
    howToHeading: 'How to Convert a Photo to PDF',
    steps: [
      'Upload one or more photos from your device.',
      'Check the preview list before conversion.',
      'Click Convert to PDF to generate the document.',
      'Download the PDF and use it wherever needed.'
    ],
    faqs: [
      ['Can I convert phone photos?', 'Yes. JPG, PNG, and WEBP photos from phones and cameras are supported.'],
      ['Can I make a PDF from several photos?', 'Yes. Add multiple photos and QuickTools will create a multi-page PDF.'],
      ['Do I need to create an account?', 'No. The tool is free to use with no signup.']
    ]
  }
};

export default function ImageToPDF({ variant = 'default' }) {
  const config = pageConfigs[variant] || pageConfigs.default;

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputFilename, setOutputFilename] = useState('images-to-pdf.pdf');
  const [uploadStatus, setUploadStatus] = useState('No images selected yet.');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);

  const createFileId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [outputUrl]);

  const revokePreviewUrl = (url) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current = previewUrlsRef.current.filter((item) => item !== url);
  };

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFiles = (files) => {
    setError(null);
    const imageFiles = Array.from(files || []);
    const accepted = [];
    const rejected = [];

    imageFiles.forEach((file) => {
      if (!isSupportedImageFile(file)) {
        rejected.push(`${file.name}: unsupported image format.`);
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        rejected.push(`${file.name}: must be under 12 MB.`);
        return;
      }
      accepted.push(file);
    });

    if (accepted.length === 0) {
      setError(rejected[0] || 'No valid image selected.');
      resetInput();
      return;
    }

    const items = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      return {
        id: createFileId(),
        file,
        name: file.name,
        sizeKb: parseFloat((file.size / 1024).toFixed(1)),
        previewUrl
      };
    });

    setSelectedFiles((prev) => {
      const nextFiles = [...prev, ...items];
      setOutputUrl(null);
      setUploadStatus(`${nextFiles.length} image${nextFiles.length === 1 ? '' : 's'} ready to convert.`);
      return nextFiles;
    });
    if (rejected.length > 0) {
      setError(rejected.join(' '));
    }
    resetInput();
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    handleFiles(files);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleFiles(event.dataTransfer.files);
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const removeImage = (id) => {
    setSelectedFiles((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed) revokePreviewUrl(removed.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
    setOutputUrl(null);
    setUploadStatus('Updated selection. Ready to convert.');
  };

  const clearAll = () => {
    selectedFiles.forEach((item) => revokePreviewUrl(item.previewUrl));
    setSelectedFiles([]);
    setOutputUrl(null);
    setUploadStatus('No images selected yet.');
    setError(null);
    resetInput();
  };

  const loadImage = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load image.'));
      };
      img.src = url;
    });

  const createImageDataUrl = (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const convertToPdf = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image first.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setOutputUrl(null);

    try {
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;

      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index].file;
        const img = await loadImage(file);
        const imageDataUrl = createImageDataUrl(img);
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const width = img.width * ratio;
        const height = img.height * ratio;
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(imageDataUrl, 'JPEG', x, y, width, height);
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      setOutputFilename(`images-to-pdf-${Date.now()}.pdf`);
      setUploadStatus(`PDF ready with ${selectedFiles.length} page${selectedFiles.length === 1 ? '' : 's'}.`);
    } catch (err) {
      console.error(err);
      setError('Unable to generate PDF. Please try again with a different image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!outputUrl) return;
    const anchor = document.createElement('a');
    anchor.href = outputUrl;
    anchor.download = outputFilename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <>
      <SEO
        title={config.title}
        description={config.description}
        pageName={config.pageName}
      />

      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-indigo-600">
            <Files className="h-6 w-6" />
            <h1 className="text-3xl font-extrabold text-slate-900">{config.heading}</h1>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            {config.intro}
          </p>
        </div>

      <div className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-2">
            <p className="font-semibold text-slate-900">{config.uploadLabel}</p>
            <p className="text-sm text-slate-500">{config.uploadHelp}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Select Images
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-indigo-400 hover:bg-white cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
        >
          <p className="text-sm text-slate-500">Drag and drop images here, or click the button to choose files.</p>
          <p className="mt-2 text-xs text-slate-400">Supported: JPG, JPEG, PNG, WEBP. Max 12 MB per image.</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{uploadStatus}</p>
              <p className="text-xs text-slate-400">{selectedFiles.length} image{selectedFiles.length === 1 ? '' : 's'} selected</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                onClick={clearAll}
                disabled={selectedFiles.length === 0}
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                onClick={convertToPdf}
                disabled={selectedFiles.length === 0 || isProcessing}
              >
                <FileText className="h-4 w-4" />
                {isProcessing ? 'Creating PDF...' : 'Convert to PDF'}
              </button>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedFiles.map((item) => (
                <div key={item.id} className="glass-card rounded-3xl border border-slate-200 p-4 shadow-sm">
                  <div className="relative overflow-hidden rounded-3xl bg-slate-100">
                    <img src={item.previewUrl} alt={item.name} className="h-40 w-full object-cover" />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sizeKb} KB</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-rose-100 hover:text-rose-600"
                      onClick={() => removeImage(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {outputUrl && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">PDF Ready</p>
                  <p className="text-sm text-slate-500">Download the generated PDF document.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  onClick={downloadPdf}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{config.whyHeading}</h2>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {config.benefits.map((benefit) => (
              <li key={benefit} className="list-disc list-inside">{benefit}</li>
            ))}
          </ul>
        </div>

        <section aria-labelledby="image-pdf-how-to" className="space-y-4">
          <h3 id="image-pdf-how-to" className="text-xl font-semibold text-slate-900">{config.howToHeading}</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
            {config.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="image-pdf-faq" className="space-y-4">
          <h3 id="image-pdf-faq" className="text-xl font-semibold text-slate-900">FAQ</h3>
          <div className="space-y-4 text-sm text-slate-600">
            {config.faqs.map(([question, answer]) => (
              <div key={question}>
                <p className="font-semibold text-slate-900">{question}</p>
                <p>{answer}</p>
              </div>
            ))}
          </div>
        </section>

      </section>
    </div>
    </>
  );
}
