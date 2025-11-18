import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Award, TrendingUp, ArrowRight, Download, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import { publicService } from '@/services/publicService';
import { Issue, Article } from '@/types';

const Home: React.FC = () => {
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [issueResponse, statsResponse] = await Promise.all([
          publicService.getCurrentIssue(),
          publicService.getJournalStats()
        ]);
        setCurrentIssue(issueResponse);
        setStats(statsResponse);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: FileText,
      title: 'Open Access',
      description: 'All articles are freely available to read, download, and share worldwide.'
    },
    {
      icon: Users,
      title: 'Peer Review',
      description: 'Rigorous double-blind peer review process ensures quality and integrity.'
    },
    {
      icon: Award,
      title: 'Indexed',
      description: 'Indexed in major databases for maximum visibility and impact.'
    },
    {
      icon: TrendingUp,
      title: 'Fast Publication',
      description: 'Efficient editorial process with quick turnaround times.'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {import.meta.env.VITE_JOURNAL_NAME || 'International Journal of Advanced Technology and Engineering Management'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-4xl mx-auto">
              Publishing cutting-edge research in technology and engineering management. 
              Open access, peer-reviewed, and globally indexed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submit">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50">
                  Submit Your Paper
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/current-issue">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                  Browse Articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-16 bg-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{stats.totalArticles}</div>
                <div className="text-secondary-600">Published Articles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{stats.totalIssues}</div>
                <div className="text-secondary-600">Issues Published</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{stats.totalViews.toLocaleString()}</div>
                <div className="text-secondary-600">Article Views</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{stats.totalDownloads.toLocaleString()}</div>
                <div className="text-secondary-600">Downloads</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">Why Publish With Us?</h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              We provide a platform for researchers to share their work with the global community
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-secondary-200 hover:shadow-lg transition-shadow">
                <feature.icon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">{feature.title}</h3>
                <p className="text-secondary-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Issue Section */}
      {currentIssue && (
        <section className="py-16 bg-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 mb-4">Current Issue</h2>
              <p className="text-lg text-secondary-600">
                Volume {currentIssue.volume}, Issue {currentIssue.number}
                {currentIssue.title && ` - ${currentIssue.title}`}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentIssue.articles.slice(0, 6).map((article: Article) => (
                <div key={article.id} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-secondary-600 text-sm mb-4 line-clamp-3">
                    {article.abstract}
                  </p>
                  <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {article.views}
                    </div>
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      {article.downloads}
                    </div>
                  </div>
                  <Link
                    to={`/articles/${article.doi}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Read Article →
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/current-issue">
                <Button variant="outline">
                  View Complete Issue
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Share Your Research?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join our community of researchers and contribute to the advancement of technology and engineering management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/submit">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50">
                Submit Your Paper
              </Button>
            </Link>
            <Link to="/author-guidelines">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                Author Guidelines
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;