import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ResizeTool from '../components/ResizeTool';

const pageConfigs = {
  20: {
    title: 'Resize Image to 20KB Online Free | QuickTools',
    description: 'Resize JPG, PNG, and WEBP images to exactly 20KB online for free using QuickTools. Fast browser-based image resizing with no uploads.',
    heading: 'Resize Image to 20KB Online Free',
    intro: 'Resize JPG, PNG, and WEBP images to exactly 20KB online for free using QuickTools. Fast browser-based image resizing with no uploads.',
  },
  50: {
    title: 'Resize Image to 50KB Online Free | QuickTools',
    description: 'Resize JPG, PNG, and WEBP images to exactly 50KB online for free using QuickTools. Fast browser-based image resizing with no uploads.',
    heading: 'Resize Image to 50KB Online Free',
    intro: 'Resize JPG, PNG, and WEBP images to exactly 50KB online for free using QuickTools. Fast browser-based image resizing with no uploads.',
  },
  100: {
    title: 'Resize Image to 100KB Online Free | QuickTools',
    description: 'Resize JPG, PNG, and WEBP images to exactly 100KB online for free using QuickTools. Fast browser-based image resizing with no uploads.',
    heading: 'Resize Image to 100KB Online Free',
    intro: 'Resize JPG, PNG, and WEBP images to exactly 100KB online for free using QuickTools. Fast browser-based image resizing with no uploads.',
  },
};

export default function ResizeImageSeo({ targetKb }) {
  const config = pageConfigs[targetKb];

  if (!config) {
    return null;
  }

  return (
    <>
      <SEO title={config.title} description={config.description} />

      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900">{config.heading}</h1>
          <p className="text-slate-600 text-sm leading-relaxed">{config.intro}</p>
        </div>

        <section aria-labelledby="related-sizes" className="glass-panel rounded-3xl p-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 id="related-sizes" className="text-lg font-semibold text-slate-900">Related Sizes</h2>
              <p className="text-sm text-slate-500 mt-1">Jump directly to the most popular target size pages.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/resize-image-to-20kb"
                className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-3 py-2 hover:bg-slate-200 transition"
              >
                20KB
              </Link>
              <Link
                to="/resize-image-to-50kb"
                className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-3 py-2 hover:bg-slate-200 transition"
              >
                50KB
              </Link>
              <Link
                to="/resize-image-to-100kb"
                className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-3 py-2 hover:bg-slate-200 transition"
              >
                100KB
              </Link>
            </div>
          </div>
        </section>

        <ResizeTool defaultTargetKb={targetKb} />

        <section className="glass-panel rounded-3xl p-8 border border-slate-200/60 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Features</h2>
            <ul className="space-y-3 text-sm text-slate-600 mt-4">
              <li className="list-disc list-inside">Resize JPG, PNG, and WEBP images to exactly {targetKb}KB directly inside your browser.</li>
              <li className="list-disc list-inside">Choose a precise target size and get instant previews before download.</li>
              <li className="list-disc list-inside">Keep your photos private with 100% client-side compression and no server uploads.</li>
              <li className="list-disc list-inside">Download optimized JPG output ready for forms, portals, and documentation.</li>
            </ul>
          </div>

          <section aria-labelledby="seo-usage" className="space-y-4">
            <h3 id="seo-usage" className="text-xl font-semibold text-slate-900">How to Use</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600">
              <li>Upload your JPG, PNG, or WEBP photo using the upload button or drag-and-drop area.</li>
              <li>Select the exact target file size and adjust the slider if needed.</li>
              <li>Wait for QuickTools to compress the image and generate a preview.</li>
              <li>Download the optimized image in seconds with no account or upload required.</li>
            </ol>
          </section>

          <section aria-labelledby="seo-faq" className="space-y-4">
            <h3 id="seo-faq" className="text-xl font-semibold text-slate-900">FAQ</h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Will my image be uploaded?</p>
                <p>No. All compression happens locally in your browser, so your image never leaves your device.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">What file formats are supported?</p>
                <p>QuickTools supports JPG, JPEG, PNG, and WEBP images for browser-based resizing.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Can I use this for official forms?</p>
                <p>Yes. The tool is ideal for online forms, applications, and portals that require exact size limits.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="seo-related" className="space-y-4">
            <h3 id="seo-related" className="text-xl font-semibold text-slate-900">Related QuickTools</h3>
            <p className="text-sm text-slate-600">Explore more privacy-first image utilities in one place.</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold">
              <li>
                <Link to="/resize-image" className="text-indigo-600 hover:underline">Resize Image Tool</Link>
              </li>
              <li>
                <Link to="/resize-image-to-20kb" className="text-indigo-600 hover:underline">Resize Image to 20KB</Link>
              </li>
              <li>
                <Link to="/resize-image-to-50kb" className="text-indigo-600 hover:underline">Resize Image to 50KB</Link>
              </li>
              <li>
                <Link to="/resize-image-to-100kb" className="text-indigo-600 hover:underline">Resize Image to 100KB</Link>
              </li>
              <li>
                <Link to="/passport-photo" className="text-indigo-600 hover:underline">Passport Size Photo Maker</Link>
              </li>
              <li>
                <Link to="/signature-cropper" className="text-indigo-600 hover:underline">Signature Cropper</Link>
              </li>
              <li>
                <Link to="/compress-image" className="text-indigo-600 hover:underline">Compress Image</Link>
              </li>
            </ul>
          </section>
        </section>
      </div>
    </>
  );
}
