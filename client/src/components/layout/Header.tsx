import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, FileText, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import { publicService } from '@/services/publicService';
import NotificationBell from '@/components/layout/NotificationBell';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 100);
  };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);
  const [landingConfig, setLandingConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await publicService.getLandingPageConfig();
        setLandingConfig(config);
      } catch (error) {
        console.error('Error fetching landing page config:', error);
      }
    };
    fetchConfig();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/' },
    {
      name: 'About Us',
      href: '#',
      dropdown: [
        { name: 'Our Mission', href: '/about/mission' },
        { name: 'Our Vision', href: '/about/vision' }
      ]
    },
    { name: 'Aim and Scope', href: '/aim-scope' },
    {
      name: "Author's Guideline",
      href: '#',
      dropdown: [
        { name: 'Instruction to Authors', href: '/author-guidelines' },
        { name: 'Article Processing Charge', href: '/processing-charge' },
        { name: 'Indexing and Abstracting', href: '/indexing' }
      ]
    },
    { name: 'Editorial Board', href: '/editorial-board' },
    { name: 'Call For Paper', href: '/call-for-paper' },
    {
      name: 'Archive',
      href: '#',
      dropdown: [
        { name: 'Browse Issues', href: '/browse' },
        { name: 'Past Issues', href: '/archive' },
        { name: 'Current Issues', href: '/current-issue' },
        { name: 'Conferences', href: '/conferences' }
      ]
    },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="bg-white shadow-lg border-b border-slate-100 relative z-50 font-sans">
      {/* Top Banner */}
      {/* Top Banner */}
      <div className="bg-slate-900 text-white py-3 relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900"></div>

        {/* Full width container */}
        <div className="w-full relative z-10">
          <div className="relative overflow-hidden group">
            <div
              className="flex whitespace-nowrap items-center text-sm font-medium group-hover:[animation-play-state:paused]"
              style={{ animation: 'marquee 40s linear infinite' }}
              aria-hidden="true"
            >
              {/* Increased to 4 items for better coverage on ultra-wide screens */}
              {[1, 2, 3, 4].map((key) => (
                <div key={key} className="flex items-center px-8 border-r border-slate-800/50">
                  <div className="flex items-center gap-x-3 mr-6">
                    <span className="bg-red-600 text-white px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm animate-pulse">
                      {landingConfig?.announcementBar?.badgeText || 'New'}
                    </span>
                    <span className="text-slate-100 font-semibold tracking-wide">
                      {landingConfig?.announcementBar?.message || 'Call for Papers: Vol IV, Issue 11'}
                    </span>
                  </div>

                  <div className="flex items-center gap-x-6 text-slate-200 text-xs uppercase tracking-wider font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">|</span>
                      <span>Deadline: <span className="text-yellow-400 font-bold">{landingConfig?.announcementBar?.deadline || '30th Nov'}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">|</span>
                      <a href={`mailto:${landingConfig?.announcementBar?.email || 'submit.ijatem@gmail.com'}`} className="hover:text-white transition-colors flex items-center gap-1.5">
                        <span className="text-white font-semibold">{landingConfig?.announcementBar?.email || 'submit.ijatem@gmail.com'}</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">|</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-white font-semibold">{landingConfig?.announcementBar?.phone || '+91 98405 11458'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes marquee {
                  0% { transform: translateX(0%); }
                  100% { transform: translateX(-25%); }
                }
              `
            }} />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo (left) */}
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
                  {!logoError ? (
                    <img
                      src="/logo.png"
                      alt="GEMIJ Logo"
                      className="h-12 w-auto object-contain"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <span className="text-white font-bold text-xl tracking-tighter">GEMIJ</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-100 text-[10px] font-bold text-slate-500">
                  EST. 2022
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-none tracking-tight group-hover:text-blue-700 transition-colors">
                  GEMIJ
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-widest uppercase mt-1">
                  International Journal
                </p>
              </div>
            </Link>

            {/* Center Info (ISSN) - Hidden on mobile */}
            <div className="hidden md:flex flex-col items-center justify-center">
              <div className="bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-600 tracking-wide">ISSN: 2583-7052</span>
              </div>
            </div>

            {/* Action Buttons (right) */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-4">
                  {user.role === 'AUTHOR' && (
                    <Link to="/submit-paper" className="hidden sm:block">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-5 py-2.5 rounded-lg font-semibold text-sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Submit Paper
                      </Button>
                    </Link>
                  )}

                  {/* Notification Bell */}
                  <NotificationBell />

                  <div
                    className="relative"
                    onMouseEnter={() => handleMouseEnter('account')}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold">{user.firstName || 'Account'}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </button>

                    <div
                      className={`absolute right-0 top-full mt-1 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top-right ${openDropdown === 'account' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                    >
                      <div className="p-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
                        >
                          <User className="h-4 w-4 mr-3" />
                          Profile
                        </Link>
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors font-medium"
                        >
                          <User className="h-4 w-4 mr-3" />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium mt-1"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-semibold text-sm px-4 py-2.5">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 px-5 py-2.5 rounded-lg font-semibold text-sm">
                      Register
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile toggle */}
              <div className="lg:hidden ml-2">
                <button
                  type="button"
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="bg-white border-t border-slate-100 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-1">
            {navigation.map((item) => (
              <div key={item.name} className="relative group"
                onMouseEnter={() => item.dropdown ? setOpenDropdown(item.name) : setOpenDropdown(null)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  to={item.href}
                  className={`
                    flex items-center px-5 py-4 text-sm font-semibold transition-all duration-200 border-b-2 border-transparent
                    ${openDropdown === item.name ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'}
                  `}
                >
                  {item.name}
                  {item.dropdown && <ChevronDown className={`ml-1.5 h-3.5 w-3.5 transition-transform duration-200 ${openDropdown === item.name ? 'rotate-180' : ''}`} />}
                </Link>

                {item.dropdown && (
                  <div
                    className={`absolute top-full left-0 w-64 bg-white border border-slate-100 rounded-b-xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top ${openDropdown === item.name ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}
                  >
                    <div className="py-2">
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className="block px-6 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium border-l-2 border-transparent hover:border-blue-600"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}></div>

      {/* Mobile Menu Panel */}
      <div className={`lg:hidden fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <span className="font-bold text-lg text-slate-900">Menu</span>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100vh-70px)]">
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.name} className="border-b border-slate-50 last:border-0">
                {item.dropdown ? (
                  <details className="group">
                    <summary className="flex items-center justify-between w-full px-3 py-3 text-slate-700 font-medium hover:bg-slate-50 rounded-lg cursor-pointer list-none">
                      {item.name}
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="pl-4 pb-2 space-y-1">
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className="block px-3 py-2 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </details>
                ) : (
                  <Link
                    to={item.href}
                    className="block px-3 py-3 text-slate-700 font-medium hover:bg-slate-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {user && user.role === 'AUTHOR' && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <Link to="/submit-paper" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-blue-600 text-white justify-center">
                  Submit Paper
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header >
  );
};

export default Header;
