import { Link } from 'react-router-dom';
import { Settings, Shield, Lock, Cpu } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="glass-panel text-slate-600 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2 rounded-xl text-white">
              <Settings className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-950">QuickTools</span>
          </Link>
          <p className="text-sm text-slate-500 max-w-sm">
            High performance, privacy-first web utilities. All processing happens 100% locally in your browser. Your images and signatures never touch our servers.
          </p>
        </div>

        <div>
          <h3 className="text-slate-900 font-bold text-sm tracking-wider uppercase mb-4">Tools</h3>
          <ul className="space-y-2 text-sm font-semibold">
            <li>
              <Link to="/passport-photo" className="hover:text-indigo-600 transition-colors">
                Passport Photo Maker
              </Link>
            </li>
            <li>
              <Link to="/resize-image" className="hover:text-indigo-600 transition-colors">
                Resize Image to KB
              </Link>
            </li>
            <li>
              <Link to="/signature-cropper" className="hover:text-indigo-600 transition-colors">
                Signature Cropper
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-slate-900 font-bold text-sm tracking-wider uppercase mb-4">Privacy & Tech</h3>
          <div className="space-y-3 text-sm font-semibold">
            <div className="flex items-center space-x-2 text-emerald-600">
              <Lock className="h-4 w-4" />
              <span>100% Client-Side</span>
            </div>
            <div className="flex items-center space-x-2 text-indigo-600">
              <Shield className="h-4 w-4" />
              <span>No Server Uploads</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Cpu className="h-4 w-4" />
              <span>GPU Accelerated</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-200/80 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© {currentYear} QuickTools. All rights reserved.</p>
        <p className="mt-4 sm:mt-0">Designed for speed, efficiency, and absolute privacy.</p>
      </div>
    </footer>
  );
}
