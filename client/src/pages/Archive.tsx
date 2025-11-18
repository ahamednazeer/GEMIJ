import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '@/services/publicService';
import { Issue } from '@/types';

const Archive: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const response = await publicService.getArchive(1, 50); // Get first page with 50 items
        setIssues(response.issues);
      } catch (error) {
        console.error('Failed to fetch archive:', error);
        // Keep issues as empty array to show error state
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchive();
  }, []);

  const years = [...new Set(issues.map(issue => issue.publishedAt ? new Date(issue.publishedAt).getFullYear() : new Date().getFullYear()))].sort((a, b) => b - a);
  const filteredIssues = selectedYear
    ? issues.filter(issue => issue.publishedAt && new Date(issue.publishedAt).getFullYear() === selectedYear)
    : issues;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-secondary-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-secondary-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="h-6 bg-secondary-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-secondary-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-secondary-200 rounded w-full mb-2"></div>
                  <div className="h-8 bg-secondary-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Journal Archive
        </h1>
        <p className="text-secondary-600">
          Browse all published issues of the International Journal of Advanced Technology, Engineering and Management
        </p>
      </div>

      {/* Year Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedYear(null)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedYear === null
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            All Years
          </button>
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedYear === year
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredIssues.map(issue => (
          <div key={issue.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                    Volume {issue.volume}, Issue {issue.number}
                  </h3>
                  <p className="text-secondary-600 text-sm">
                    {issue.publishedAt ? new Date(issue.publishedAt).getFullYear() : 'TBD'}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {issue._count?.articles || issue.articles?.length || 0} articles
                </span>
              </div>
              
              <p className="text-secondary-700 mb-4 text-sm">
                {issue.description}
              </p>
              
              <div className="text-xs text-secondary-500 mb-4">
                Published: {issue.publishedAt ? new Date(issue.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Not published'}
              </div>
              
              <div className="flex space-x-2">
                <Link
                  to={`/issue/${issue.id}`}
                  className="flex-1 bg-primary-600 text-white py-2 px-3 rounded-md hover:bg-primary-700 transition-colors text-center text-sm"
                >
                  View Issue
                </Link>
                <button className="border border-secondary-300 text-secondary-700 py-2 px-3 rounded-md hover:bg-secondary-50 transition-colors text-sm">
                  PDF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {issues.length}
            </div>
            <div className="text-secondary-600">Total Issues</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {issues.reduce((total, issue) => total + (issue._count?.articles || issue.articles?.length || 0), 0)}
            </div>
            <div className="text-secondary-600">Total Articles</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {years.length}
            </div>
            <div className="text-secondary-600">Years Published</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {Math.max(...issues.map(issue => issue.volume))}
            </div>
            <div className="text-secondary-600">Current Volume</div>
          </div>
        </div>
      </div>

      {/* Search and Browse */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">
            Search Archive
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search articles, authors, or keywords..."
                className="form-input"
              />
            </div>
            <div className="flex space-x-2">
              <button className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
                Search
              </button>
              <Link
                to="/search"
                className="border border-secondary-300 text-secondary-700 px-6 py-2 rounded-md hover:bg-secondary-50 transition-colors"
              >
                Advanced Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;