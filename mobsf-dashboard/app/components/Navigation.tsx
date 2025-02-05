// app/components/Navigation.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMouseLeave = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (menuRef.current && titleRef.current) {
      menuRef.current.style.width = `${titleRef.current.offsetWidth}px`;
    }
  }, []);

  return (
    <nav 
      className="bg-gray-800 text-white p-4 flex justify-between items-center relative"
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center space-x-4">
        <button
          className="text-white focus:outline-none"
          onClick={toggleMenu}
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/" className="flex items-center hover:text-gray-300 transition-colors">
          <img 
            src="/bnhp_logo.png" 
            alt="BNHP Logo" 
            className="h-8 w-8 mr-2"
          />
          <div ref={titleRef} className="text-xl font-bold">
            BNHP Mobile Apps Scanner
          </div>
        </Link>
      </div>
      <div
        ref={menuRef}
        className={`absolute top-full left-0 bg-gray-800 overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-40' : 'max-h-0'
        }`}
      >
        <ul className="p-4 space-y-2">
          <li>
            <Link href="/" className="block hover:text-gray-300">
              Main Dashboard
            </Link>
          </li>
          <li>
            <Link href="/batches" className="block hover:text-gray-300">
              Batch Security Scans
            </Link>
          </li>
          <li>
            <Link href="/inventory" className="block hover:text-gray-300">
              App Inventory
            </Link>
          </li>
          <li>
            <Link href="/scans" className="hover:text-gray-300">
              Scan Management
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}