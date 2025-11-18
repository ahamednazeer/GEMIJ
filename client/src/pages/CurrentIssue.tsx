import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '@/services/publicService';
import { Issue, Article } from '@/types';
import ShareButton from '@/components/ui/ShareButton';
import SubscriptionAlert from '@/components/ui/SubscriptionAlert';

const CurrentIssue: React.FC = () => {
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentIssue = async () => {
      try {
        const issue = await publicService.getCurrentIssue();
        setCurrentIssue(issue);
      } catch (error) {
        console.error('Failed to fetch current issue:', error);
        // Keep currentIssue as null to show error state
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentIssue();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-secondary-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-secondary-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="h-6 bg-secondary-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-secondary-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-secondary-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-secondary-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentIssue) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            No Current Issue Available
          </h1>
          <p className="text-secondary-600">
            Please check back later for the latest issue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Issue Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Volume {currentIssue.volume}, Issue {currentIssue.number} ({new Date(currentIssue.publishedAt || '').getFullYear()})
            </h1>
            <p className="text-secondary-600 mb-4">
              Published: {currentIssue.publishedAt ? new Date(currentIssue.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not published'}
            </p>
            <p className="text-secondary-700 max-w-3xl">
              {currentIssue.description}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
              Download Issue PDF
            </button>
            <ShareButton
              title={`Volume ${currentIssue.volume}, Issue ${currentIssue.number}`}
              url="/current-issue"
              description={currentIssue.description}
            />
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-secondary-900 mb-6">
          Table of Contents
        </h2>
        
        <div className="space-y-6">
          {currentIssue.articles.map((article, index) => (
            <article key={article.id} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-secondary-900 mb-2 hover:text-primary-600 transition-colors">
                      <Link to={`/article/${article.id}`}>
                        {article.title}
                      </Link>
                    </h3>
                    
                    <div className="text-secondary-600 mb-3">
                      <span className="font-medium">Authors:</span>{' '}
                      {article.authors.map((author: any) => `${author.firstName} ${author.lastName}`).join(', ')}
                    </div>
                    
                    <p className="text-secondary-700 mb-4 line-clamp-3">
                      {article.abstract}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                      <span>Pages: {article.pages}</span>
                      <span>DOI: {article.doi}</span>
                      <span>
                        Published: {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {article.keywords.map((keyword, keyIndex) => (
                        <span
                          key={keyIndex}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col space-y-2">
                    <Link
                      to={`/article/${article.id}`}
                      className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-center text-sm"
                    >
                      View Article
                    </Link>
                    <a
                      href={article.pdfPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-secondary-300 text-secondary-700 px-4 py-2 rounded-md hover:bg-secondary-50 transition-colors text-center text-sm"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Issue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {currentIssue.articles.length}
            </div>
            <div className="text-secondary-600">Articles</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {currentIssue.articles.reduce((total, article) => {
                const pages = article.pages.split('-');
                return total + (parseInt(pages[1]) - parseInt(pages[0]) + 1);
              }, 0)}
            </div>
            <div className="text-secondary-600">Total Pages</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {new Set(currentIssue.articles.flatMap(article => article.authors)).size}
            </div>
            <div className="text-secondary-600">Contributors</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {new Set(currentIssue.articles.flatMap(article => article.keywords)).size}
            </div>
            <div className="text-secondary-600">Research Areas</div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="mb-8">
        <div className="card">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-secondary-600 mb-4">
              Get notified when new issues are published or follow the journal for all updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <SubscriptionAlert type="issue" />
              <SubscriptionAlert type="journal" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link
          to="/archive"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          ← View Previous Issues
        </Link>
        
        <div className="text-secondary-600 text-sm">
          Current Issue • Volume {currentIssue.volume}, Issue {currentIssue.number}
        </div>
      </div>
    </div>
  );
};

export default CurrentIssue;