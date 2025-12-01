'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Home, Plus, Archive, User, Settings, LogOut, Thermometer, Phone, FileText, Refrigerator } from 'lucide-react';

export default function Sidebar() {
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
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col hidden md:flex shadow-2xl ">
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          The Passover
        </h1>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 transform scale-105'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:transform hover:scale-[1.02] hover:shadow-md'
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
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 transform scale-105'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:transform hover:scale-[1.02] hover:shadow-md'
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
      </nav>

      <div className="p-4 border-t border-slate-700/50 sticky bottom-0 bg-slate-900">
        <Link
          href="/profile"
          className={`flex items-center w-full px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
            pathname === '/profile'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 transform scale-105'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:transform hover:scale-[1.02] hover:shadow-md'
          }`}
        >
          <User className="w-5 h-5 mr-3" />
          <span className="font-medium">{user?.fullName || 'User Name'}</span>
        </Link>
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600/90 hover:text-white transition-all duration-200 hover:shadow-md hover:transform hover:scale-[1.02]"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

