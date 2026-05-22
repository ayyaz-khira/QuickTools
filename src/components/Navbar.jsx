import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Image as ImageIcon, CheckSquare, Settings, Menu, X } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Passport Size Photo Maker', href: '/passport-photo', icon: Camera },
    { name: 'Resize to KB', href: '/resize-image', icon: ImageIcon },
    { name: 'Signature Cropper', href: '/signature-cropper', icon: CheckSquare },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
  <Link to="/" className="flex items-center space-x-2 group">   {/* Changed from space-x-3 to space-x-2 */}
    <img
      src="/images/quicktools-logo.png"
      alt="QuickTools"
      className="w-16 h-16 object-contain group-hover:scale-105 transition-all duration-300"
    />
    <span className="font-extrabold text-xl tracking-tight text-slate-900">
      QuickTools
    </span>
  </Link>
</div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none transition-colors duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden glass-panel border-b border-slate-200/80 px-2 pt-2 pb-4 space-y-1 sm:px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
