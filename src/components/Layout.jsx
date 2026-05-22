import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[42%] h-[42%] bg-indigo-500/6 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[42%] h-[42%] bg-purple-500/6 rounded-full blur-[120px] pointer-events-none"></div>
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
