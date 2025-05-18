import { ReactNode, useEffect, useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  // Persist dark mode in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      setDarkMode(stored === 'true');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-textdark dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <header className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div className="flex flex-col xs:flex-row items-center gap-2 xs:gap-3 w-full sm:w-auto justify-center sm:justify-start">
          <Link href="/" className="flex flex-col xs:flex-row items-center gap-1 xs:gap-3 group" aria-label="Home">
            <img src="/logo.png" alt="BreachSignal.io Logo" className="h-10 w-10 xs:h-14 xs:w-14 sm:h-20 sm:w-20 md:h-32 md:w-32 transition-all" />
            <span className="text-lg xs:text-2xl sm:text-4xl font-extrabold" style={{ color: '#083a5d' }}>BreachSignal.io</span>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-4 py-2 rounded bg-gray-200 text-primary font-semibold hover:bg-gray-300 transition-colors">
              Admin Dashboard
            </button>
          </Link>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full sm:w-auto p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mt-2 sm:mt-0"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
          </button>
        </div>
      </header>
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-8">
        {children}
      </main>
      <footer className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 text-center text-textdark dark:text-gray-400">
        <p>© {new Date().getFullYear()} BreachSignal.io. All rights reserved.</p>
      </footer>
    </div>
  );
} 