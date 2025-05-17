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

  useEffect(() => {
    // Check for user's preferred color scheme
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-textdark dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group" onClick={(e) => { e.preventDefault(); router.push('/'); router.reload(); }}>
            <img src="/logo.png" alt="BreachSignal.io Logo" className="h-32 w-32" />
            <span className="text-4xl font-extrabold" style={{ color: '#083a5d' }}>BreachSignal.io</span>
          </Link>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
        </button>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="container mx-auto px-4 py-6 text-center text-textdark dark:text-gray-400">
        <p>© {new Date().getFullYear()} BreachSignal.io. All rights reserved.</p>
      </footer>
    </div>
  );
} 