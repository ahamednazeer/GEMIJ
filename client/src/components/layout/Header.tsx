import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, FileText, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Current Issue', href: '/current-issue' },
    { name: 'Archive', href: '/archive' },
    { name: 'Search', href: '/search' },
    { name: 'About', href: '/about' },
    { name: 'Editorial Board', href: '/editorial-board' },
    { name: 'Author Guidelines', href: '/author-guidelines' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-secondary-200 lg:border-none">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600">
                  {import.meta.env.VITE_JOURNAL_ABBREVIATION || 'IJATEM'}
                </h1>
              </div>
              <div className="hidden lg:block ml-4">
                <p className="text-sm text-secondary-600 max-w-md">
                  {import.meta.env.VITE_JOURNAL_NAME || 'International Journal of Advanced Technology and Engineering Management'}
                </p>
              </div>
            </Link>
          </div>

          <div className="ml-10 space-x-4 hidden lg:block">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-base font-medium text-secondary-500 hover:text-secondary-900 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/search"
              className="text-secondary-400 hover:text-secondary-500 transition-colors"
              aria-label="Search articles"
            >
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              <div className="relative">
                <div className="flex items-center space-x-4">
                  {user.role === 'AUTHOR' && (
                    <Link to="/submit-paper">
                      <Button size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Submit Paper
                      </Button>
                    </Link>
                  )}
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            <div className="lg:hidden">
              <button
                type="button"
                className="bg-white rounded-md p-2 inline-flex items-center justify-center text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-secondary-500 hover:text-secondary-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;