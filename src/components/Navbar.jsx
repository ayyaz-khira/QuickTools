import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Image as ImageIcon, CheckSquare, Zap, Files, FileText, Settings, Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsDropdownRef = useRef(null);

  const navigation = [
    { name: 'Passport Size Photo Maker', href: '/passport-photo', icon: Camera },
    { name: 'Resize to KB', href: '/resize-image', icon: ImageIcon },
    { name: 'Compress Image', href: '/compress-image', icon: Zap },
    { name: 'Image to PDF', href: '/image-to-pdf', icon: Files },
    { name: 'Add Page Numbers', href: '/add-page-numbers-to-pdf', icon: FileText },
    { name: 'Signature Cropper', href: '/signature-cropper', icon: CheckSquare },
  ];

  // Featured tools shown directly in navbar
  const featuredTools = [
    { name: 'Image to PDF', href: '/image-to-pdf', icon: Files },
    { name: 'Compress Image', href: '/compress-image', icon: Zap },
    { name: 'Add Page Numbers', href: '/add-page-numbers-to-pdf', icon: FileText },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <div className="ml-10 flex items-center gap-3">
              {/* Featured Tools */}
              {featuredTools.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
	                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Tools Dropdown Separator */}
              <div className="h-6 w-px bg-slate-200 mx-1"></div>

              {/* Tools Dropdown */}
              <div className="relative" ref={toolsDropdownRef}>
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
	                  className="flex items-center px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-300 whitespace-nowrap"
                >
                  <Settings className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  All Tools
                  <ChevronDown className={`h-4 w-4 ml-1 flex-shrink-0 transition-transform duration-300 ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isToolsOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsToolsOpen(false)}
	                          className={`flex items-center px-4 py-3 text-base font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
          {/* Featured Tools */}
          {featuredTools.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
	                className={`flex items-center px-4 py-3 rounded-xl text-lg font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="h-px bg-slate-200 my-2"></div>

          {/* Tools Dropdown for Mobile */}
          <div className="space-y-1">
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
	              className="w-full flex items-center px-4 py-3 rounded-xl text-lg font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-200"
            >
              <Settings className="h-5 w-5 mr-3" />
              All Tools
              <ChevronDown className={`h-4 w-4 ml-auto transition-transform duration-300 ${isToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsOpen && (
              <div className="space-y-1 pl-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => {
                        setIsOpen(false);
                        setIsToolsOpen(false);
                      }}
	                      className={`flex items-center px-4 py-3 rounded-xl text-lg font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
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
          </div>
        </div>
      )}
    </nav>
  );
}
