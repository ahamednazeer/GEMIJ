import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div>
              <h3 className="text-lg font-semibold">
                {import.meta.env.VITE_JOURNAL_ABBREVIATION || 'IJATEM'}
              </h3>
              <p className="mt-2 text-base text-secondary-300">
                {import.meta.env.VITE_JOURNAL_NAME || 'International Journal of Advanced Technology and Engineering Management'}
              </p>
              <p className="mt-4 text-sm text-secondary-400">
                A peer-reviewed, open-access journal publishing high-quality research in technology and engineering management.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-secondary-400 hover:text-secondary-300">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-secondary-400 hover:text-secondary-300">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0H5a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5V5a5 5 0 00-5-5zM8 19H5V8h3v11zM6.5 6.732c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-secondary-400 tracking-wider uppercase">
                  Journal
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link to="/about" className="text-base text-secondary-300 hover:text-white">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link to="/aim-scope" className="text-base text-secondary-300 hover:text-white">
                      Aim & Scope
                    </Link>
                  </li>
                  <li>
                    <Link to="/editorial-board" className="text-base text-secondary-300 hover:text-white">
                      Editorial Board
                    </Link>
                  </li>
                  <li>
                    <Link to="/indexing" className="text-base text-secondary-300 hover:text-white">
                      Indexing
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-secondary-400 tracking-wider uppercase">
                  Authors
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link to="/author-guidelines" className="text-base text-secondary-300 hover:text-white">
                      Author Guidelines
                    </Link>
                  </li>
                  <li>
                    <Link to="/submit" className="text-base text-secondary-300 hover:text-white">
                      Submit Paper
                    </Link>
                  </li>
                  <li>
                    <Link to="/peer-review" className="text-base text-secondary-300 hover:text-white">
                      Peer Review Process
                    </Link>
                  </li>
                  <li>
                    <Link to="/apc" className="text-base text-secondary-300 hover:text-white">
                      APC & Payments
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-secondary-400 tracking-wider uppercase">
                  Policies
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link to="/ethics" className="text-base text-secondary-300 hover:text-white">
                      Publication Ethics
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-base text-secondary-300 hover:text-white">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-base text-secondary-300 hover:text-white">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link to="/copyright" className="text-base text-secondary-300 hover:text-white">
                      Copyright
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-secondary-400 tracking-wider uppercase">
                  Contact
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-base text-secondary-300">editor@journal.com</span>
                  </li>
                  <li className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="text-base text-secondary-300">+1 (555) 123-4567</span>
                  </li>
                  <li className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-1" />
                    <span className="text-base text-secondary-300">
                      123 Academic Street<br />
                      University City, UC 12345
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-secondary-700 pt-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <Link to="/privacy" className="text-secondary-400 hover:text-secondary-300">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-secondary-400 hover:text-secondary-300">
                Terms of Service
              </Link>
            </div>
            <p className="mt-8 text-base text-secondary-400 md:mt-0 md:order-1">
              &copy; {currentYear} {import.meta.env.VITE_JOURNAL_NAME || 'International Journal of Advanced Technology and Engineering Management'}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;