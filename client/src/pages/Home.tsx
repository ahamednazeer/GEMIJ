import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  ArrowRight,
  CheckCircle,
  Award,
  Globe,
  Clock,
  Download,
  Eye,
  ChevronRight,
  Play,
  Megaphone,
  Sparkles,
  Layout,
  Palette
} from 'lucide-react';
import Button from '../components/ui/Button';
import { publicService } from '../services/publicService';
import { Issue, Article } from '../types';

const Home: React.FC = () => {
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [landingConfig, setLandingConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [issueResponse, statsResponse, configResponse] = await Promise.all([
          publicService.getCurrentIssue(),
          publicService.getJournalStats(),
          publicService.getLandingPageConfig()
        ]);
        setCurrentIssue(issueResponse);
        setStats(statsResponse);
        setLandingConfig(configResponse);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Icon mapper for dynamic icons
  const getIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      FileText, Users, Award, TrendingUp, Globe, Clock, BookOpen,
      Search, Calendar, CheckCircle, Download, Eye, ChevronRight,
      Play, Megaphone, Sparkles, Layout, Palette
    };
    return icons[iconName] || FileText;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  // Fallback defaults if config is missing (for safety)
  const hero = landingConfig?.hero || {};
  const features = landingConfig?.features || { items: [] };
  const callForPapers = landingConfig?.callForPapers || {};
  const latestResearch = landingConfig?.latestResearch || {};
  const cta = landingConfig?.cta || {};

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white py-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-blue-600/20 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-indigo-600/20 blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay"
          style={hero.backgroundImage ? { backgroundImage: `url(${hero.backgroundImage})` } : { backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span className="text-blue-100 text-sm font-medium tracking-wide uppercase">
                {hero.badgeText || 'Peer-Reviewed Academic Journal'}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-fade-in-up delay-100">
              {hero.title ? (
                <span dangerouslySetInnerHTML={{
                  __html: hero.title.replace(
                    /Engineering & Management/gi,
                    '<span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-300% animate-gradient">Engineering & Management</span>'
                  )
                }} />
              ) : (
                <>
                  Advancing Knowledge in <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-300% animate-gradient">
                    Engineering & Management
                  </span>
                </>
              )}
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto animate-fade-in-up delay-200 font-light">
              {hero.subtitle || (
                <><strong className="text-white font-semibold">IJATEM (ISSN 2583-7052)</strong> bridges the gap between theoretical innovation and practical application. Join a global community of researchers.</>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-fade-in-up delay-300">
              <Link to={hero.primaryButtonLink || '/submit-paper'}>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 text-lg rounded-full font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 group">
                  <FileText className="w-5 h-5" />
                  {hero.primaryButtonText || 'Submit Manuscript'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to={hero.secondaryButtonLink || '/current-issue'}>
                <Button variant="outline" className="bg-white/5 hover:bg-white/10 border-white/20 text-white px-10 py-4 text-lg rounded-full font-semibold backdrop-blur-sm transition-all duration-300 hover:border-white/40">
                  {hero.secondaryButtonText || 'Browse Latest Issue'}
                </Button>
              </Link>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-white/10 animate-fade-in-up delay-500">
              {(hero.metrics || [
                { label: 'ISSN Number', value: '2583-7052' },
                { label: 'Publication', value: 'Monthly' },
                { label: 'Access', value: 'Open' },
                { label: 'Reach', value: 'Global' },
              ]).map((metric: any, index: number) => (
                <div key={index} className="text-center group">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{metric.value}</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative z-20 -mt-10 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {features.heading || 'Why Publish With Us?'}
            </h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full mb-6"></div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {features.subheading || 'We are committed to disseminating high-quality research with speed, efficiency, and global impact.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(features.items || [
              { icon: 'FileText', title: 'Open Access', description: 'All articles are freely available to read, download, and share worldwide.' },
              { icon: 'Users', title: 'Peer Review', description: 'Rigorous double-blind peer review process ensures quality and integrity.' },
              { icon: 'Award', title: 'Indexed', description: 'Indexed in major databases for maximum visibility and impact.' },
              { icon: 'TrendingUp', title: 'Fast Publication', description: 'Efficient editorial process with quick turnaround times.' }
            ]).map((feature: any, index: number) => {
              const IconComponent = getIcon(feature.icon);
              return (
                <div key={index} className="group p-8 rounded-3xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500">
                  <div className="w-16 h-16 bg-white text-blue-600 rounded-2xl shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Current Issue Highlight / Call for Papers */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-slate-200/50 border border-slate-100">
            <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-b from-red-500 via-orange-500 to-yellow-500"></div>
            <div className="p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center gap-3 text-red-600 font-bold tracking-wide uppercase text-sm mb-6 bg-red-50 px-4 py-1.5 rounded-full">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  {callForPapers.badgeText || 'Call for Papers Open'}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  {callForPapers.title || 'Volume IV, Issue 11'} <br />
                  <span className="text-slate-400 font-medium text-3xl">{callForPapers.subtitle || 'November 2025 Edition'}</span>
                </h2>

                <div className="grid sm:grid-cols-2 gap-8 mb-10">
                  <div className="flex items-start gap-5">
                    <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Submission Deadline</div>
                      <div className="text-xl font-bold text-slate-900">{callForPapers.submissionDeadline || '30th November 2025'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="p-3.5 bg-green-50 text-green-600 rounded-2xl">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Fast Review</div>
                      <div className="text-xl font-bold text-slate-900">{callForPapers.reviewTime || 'Decision in 10 days'}</div>
                    </div>
                  </div>
                </div>

                <Link to={callForPapers.buttonLink || '/submit-paper'}>
                  <Button className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-600/20 transition-all duration-300 hover:scale-105">
                    {callForPapers.buttonText || 'Submit Manuscript Now'}
                  </Button>
                </Link>
              </div>

              <div className="hidden lg:block w-px h-80 bg-slate-100"></div>

              <div className="w-full lg:w-auto flex-shrink-0 text-center lg:text-left">
                <div className="bg-slate-50 p-10 rounded-3xl border border-slate-100 text-center hover:shadow-lg transition-shadow duration-300">
                  <div className="text-6xl font-black text-slate-900 mb-2">
                    {callForPapers.statsBox?.value || '10'}
                  </div>
                  <div className="text-xl font-bold text-slate-900 mb-1">
                    {callForPapers.statsBox?.label || 'Days'}
                  </div>
                  <div className="text-slate-500 font-medium">
                    {callForPapers.statsBox?.sublabel || 'Average Review Time'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Research Articles */}
      {currentIssue && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {latestResearch.heading || 'Latest Research'}
                </h2>
                <p className="text-lg text-slate-600">
                  {latestResearch.subheading || (
                    <>
                      Volume {currentIssue.volume}, Issue {currentIssue.number}
                      {currentIssue.title && ` - ${currentIssue.title}`}
                    </>
                  )}
                </p>
              </div>
              <Link to="/current-issue" className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-2 group bg-blue-50 px-6 py-3 rounded-full transition-colors">
                {latestResearch.viewAllText || 'View All Articles'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentIssue.articles.slice(0, 6).map((article: Article) => (
                <div key={article.id} className="group bg-white rounded-2xl p-8 border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
                      Original Research
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-8 line-clamp-3 flex-grow leading-relaxed">
                    {article.abstract}
                  </p>

                  <div className="pt-6 border-t border-slate-50 mt-auto">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-5 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {article.views}</span>
                        <span className="flex items-center gap-1.5"><Download className="w-4 h-4" /> {article.downloads}</span>
                      </div>
                    </div>
                    <Link
                      to={`/articles/${article.doi}`}
                      className="block w-full text-center py-3.5 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-blue-600 hover:text-white transition-all duration-300"
                    >
                      Read Article
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
            {cta.title || 'Ready to Publish Your Work?'}
          </h2>
          <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            {cta.subtitle || 'Join our growing community of authors and researchers. Submit your manuscript today for a fast, fair, and constructive review process.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link to={cta.primaryButtonLink || '/submit-paper'}>
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 text-lg rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all duration-300 hover:scale-105">
                {cta.primaryButtonText || 'Start Submission'}
              </Button>
            </Link>
            <Link to={cta.secondaryButtonLink || '/author-guidelines'}>
              <Button variant="outline" className="w-full sm:w-auto bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-10 py-4 text-lg rounded-xl font-bold transition-all duration-300 hover:border-slate-500">
                {cta.secondaryButtonText || 'Read Guidelines'}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 pt-16 border-t border-slate-800/50">
            {(cta.contactInfo || [
              { icon: '📧', text: 'submit.ijatem@gmail.com' },
              { icon: '⚡', text: 'Fast Review Process' },
              { icon: '🌍', text: 'International Reach' }
            ]).map((info: any, index: number) => (
              <div key={index} className="text-center group">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{info.icon}</div>
                <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">{info.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;