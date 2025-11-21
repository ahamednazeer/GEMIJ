import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Download } from 'lucide-react';
import { publicService } from '@/services/publicService';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [footerConfig, setFooterConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await publicService.getLandingPageConfig();
        setFooterConfig(config?.footer);
      } catch (error) {
        console.error('Error fetching footer config:', error);
      }
    };
    fetchConfig();
  }, []);

  return (
    <footer className="bg-slate-900 text-slate-300 font-sans relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950"></div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Journal Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/logo.png"
                  alt="GEMIJ Logo"
                  className="h-8 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-blue-700 font-bold text-xl">G</span>';
                  }}
                />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl tracking-tight">{footerConfig?.journalName || 'GEMIJ'}</h3>
                <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold">{footerConfig?.journalTagline || 'International Journal'}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {footerConfig?.description || 'A premier peer-reviewed international journal dedicated to advancing knowledge in engineering and management disciplines.'}
            </p>
            <div className="space-y-3 pt-2">
              <a href={`mailto:${footerConfig?.email || 'submit.ijatem@gmail.com'}`} className="flex items-center gap-3 text-sm hover:text-white transition-colors group">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-sm">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="group-hover:text-blue-400 transition-colors">{footerConfig?.email || 'submit.ijatem@gmail.com'}</span>
              </a>
              <div className="flex items-center gap-3 text-sm group">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-sm">
                  <Phone className="h-4 w-4" />
                </div>
                <span>{footerConfig?.phone || '+91 98405 11458'}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-blue-600 rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              {(footerConfig?.quickLinks || [
                { name: 'About Us', href: '/about' },
                { name: 'Aim and Scope', href: '/aim-scope' },
                { name: 'Editorial Board', href: '/editorial-board' },
                { name: 'Author Guidelines', href: '/author-guidelines' },
                { name: 'Call For Paper', href: '/call-for-paper' },
                { name: 'Contact Us', href: '/contact' },
              ]).map((link: any) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm hover:text-blue-400 hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Authors */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 relative inline-block">
              For Authors
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-blue-600 rounded-full"></span>
            </h3>
            <ul className="space-y-3 mb-8">
              {(footerConfig?.authorLinks || [
                { name: 'Payment Information', href: '/payment-information' },
                { name: 'Publication Ethics', href: '/publication-ethics' },
                { name: 'Make Online Payment', href: '/make-payment' },
              ]).map((link: any) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm hover:text-blue-400 hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="text-white font-medium text-sm uppercase tracking-wider mb-4 text-blue-400">Downloads</h4>
            <div className="space-y-3">
              {(footerConfig?.downloads || [
                { name: 'Paper Template', href: '/paper-template.docx' },
                { name: 'Copyright Form', href: '/copyright-form.pdf' }
              ]).map((download: any) => (
                <a key={download.name} href={download.href} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group border border-slate-700/50 hover:border-blue-500/50">
                  <div className="p-1.5 bg-blue-500/10 rounded-md group-hover:bg-blue-500/20 transition-colors">
                    <Download className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white">{download.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Contact & Address */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 relative inline-block">
              Contact Office
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-blue-600 rounded-full"></span>
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-3 group">
                <MapPin className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                <div className="text-sm space-y-1">
                  <p className="text-white font-medium">{footerConfig?.editorAddress?.title || 'Editor in Chief'}</p>
                  <p>{footerConfig?.editorAddress?.name || 'Er.KAVIN K S,'}</p>
                  {(footerConfig?.editorAddress?.address || [
                    '5-51, Thattan Vilai, North Soorankudy Post,',
                    'Nagercoil, Kanyakumari District,',
                    'Tamilnadu, India-629501'
                  ]).map((line: string, index: number) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-slate-800 group">
                <MapPin className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                <div className="text-sm space-y-1">
                  <p className="text-white font-medium">{footerConfig?.adminAddress?.title || 'Administrative Office'}</p>
                  {(footerConfig?.adminAddress?.address || [
                    '14, Third Floor, Prajam Complex,',
                    'S. T. Hindu College Road,',
                    'Chettikulam, Nagercoil - 629002.'
                  ]).map((line: string, index: number) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-slate-950 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 text-center md:text-left">
              &copy; {currentYear} <span className="text-slate-300 font-medium">{footerConfig?.copyrightText || 'GEMIJ'}</span>. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              {(footerConfig?.bottomLinks || [
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Sitemap', href: '/sitemap' }
              ]).map((link: any) => (
                <Link key={link.name} to={link.href} className="hover:text-blue-400 transition-colors">{link.name}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;