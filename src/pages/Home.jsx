import { Link } from 'react-router-dom';
import { Camera, Image as ImageIcon, CheckSquare, ArrowRight, ShieldCheck, Zap, Heart } from 'lucide-react';
import useSEO from '../hooks/useSEO';

export default function Home() {
  useSEO({
    title: 'Local-First Image & Document Utilities',
    description: 'QuickTools provides local-first, privacy-focused image resizing, signature cropping, and passport photo formatting tools. No uploads, offline-capable.'
  });

  const tools = [
    {
      name: 'Passport Photo Maker',
      description: 'Crop and align your photos to official government passport sizes. Features head overlay guides, custom crop positions, and a multi-photo print sheet generator.',
      href: '/passport-photo',
      icon: Camera,
      color: 'from-blue-500 to-indigo-500',
      tag: 'Best Seller',
      features: ['Standard 2x2" & 3.5x4.5cm sizes', 'Alignment guidelines', 'Single or grid sheet output', '100% private']
    },
    {
      name: 'Resize Image to KB',
      description: 'Compress images precisely to a target file size (e.g., under 50 KB, 100 KB) for official web applications, portals, and online forms without losing quality.',
      href: '/resize-image',
      icon: ImageIcon,
      color: 'from-indigo-500 to-purple-500',
      tag: 'Popular',
      features: ['Iterative smart compression', 'Custom target KB settings', 'Before vs. After file details', 'No image uploads']
    },
    {
      name: 'Signature Cropper',
      description: 'Crop hand-written signatures from scanned papers. Cleans up backgrounds by converting them to solid white and boosting ink contrast.',
      href: '/signature-cropper',
      icon: CheckSquare,
      color: 'from-purple-500 to-pink-500',
      tag: 'New',
      features: ['Interactive signature cropping', 'High contrast & threshold adjustment', 'Binarization (clean white bg)', 'Download as transparent PNG']
    },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border border-indigo-100 shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>Privacy Guaranteed: No images leave your browser</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-slate-900">
          Simple, Fast, and Secure{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Image & PDF Tools
          </span>
        </h1>
        
        <p className="text-lg text-slate-600 leading-relaxed font-medium">
          QuickTools handles resizing, cropping, and PDF formatting directly on your device. Zero uploads. Zero latency. Just pure performance for your daily document requirements.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-bold text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Instant Processing</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Offline-Ready Client Execution</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center space-x-1.5">
            <Heart className="h-4 w-4 text-pink-500" />
            <span>Ad-free & Open Source</span>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.name}
              className="glass-card rounded-3xl p-6 flex flex-col justify-between relative group overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Card top gradient line decoration */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent group-hover:via-indigo-500 transition-all duration-500"></div>
              
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl bg-gradient-to-tr ${tool.color} text-white shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 bg-slate-100 border border-slate-200/60 text-slate-500 rounded-full">
                    {tool.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {tool.name}
                </h3>
                
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {tool.description}
                </p>

                <ul className="space-y-2 mb-8">
                  {tool.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-xs text-slate-500 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={tool.href}
                className="group btn-primary btn-primary-blue w-full flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <span>Launch Tool</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-8 mt-12 shadow-sm">
        <div className="space-y-4 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Why Local Web Tools?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Conventional web tools send your sensitive identity documents (like passport photos or signatures) to their backend servers for formatting. This poses major security risks. 
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            QuickTools leverages HTML5 APIs, canvas operations, and local computation models to execute all alterations locally. Your data stays on your computer.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl text-center shadow-sm">
            <div className="text-3xl font-extrabold text-indigo-600">0</div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">Uploads</div>
          </div>
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl text-center shadow-sm">
            <div className="text-3xl font-extrabold text-purple-600">100%</div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">Private</div>
          </div>
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl text-center shadow-sm">
            <div className="text-3xl font-extrabold text-pink-600">&lt; 1s</div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">Speed</div>
          </div>
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl text-center shadow-sm">
            <div className="text-3xl font-extrabold text-emerald-600">FREE</div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">Unlimited</div>
          </div>
        </div>
      </div>
    </div>
  );
}
