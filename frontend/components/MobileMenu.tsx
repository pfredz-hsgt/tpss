'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Menu, X, Home, Plus, Archive, User, Settings, LogOut, Thermometer, Phone, FileText, Refrigerator } from 'lucide-react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { logout, isAdmin, user } = useAuth();

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/create', label: 'Post New', icon: Plus },
    { href: '/archive', label: 'Past Archive', icon: Archive },
  ];

  // Temperature Monitoring submenu items
  const temperatureItems = [
    { href: '/temperature-reporting', label: 'Temperature Reporting', icon: Thermometer },
    { href: '/pic-contacts', label: 'PIC Contact Number', icon: Phone },
    { href: '/view-reports', label: 'View Report', icon: FileText },
  ];
  
  // Only show Manage Fridge for admins
  if (isAdmin) {
    temperatureItems.push({ href: '/manage-fridges', label: 'Manage Fridge', icon: Refrigerator });
  }

  if (isAdmin) {
    navItems.push({ href: '/admin', label: 'Admin', icon: Settings });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg shadow-lg hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900 text-white overflow-y-auto">
          <div className="p-6 pt-20">
            <nav>
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:shadow-md'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Temperature Monitoring Section */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <h2 className="px-4 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Temperature Monitoring
                </h2>
                <ul className="space-y-2">
                  {temperatureItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:shadow-md'
                          }`}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <ul className="space-y-2 mt-6 pt-6 border-t border-slate-700/50">
                <li>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center w-full px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
                      pathname === '/profile'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:shadow-md'
                    }`}
                  >
                    <User className="w-5 h-5 mr-3" />
                    <span className="font-medium">{user?.fullName || 'User Name'}</span>
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600/90 hover:text-white transition-all duration-200 hover:shadow-md"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

