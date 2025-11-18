import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '@/services/publicService';
import { Article } from '@/types';
import { buildPdfUrl } from '@/utils/url';



const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [results, setResults] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    
    try {
      const searchParams: any = {
        q: searchQuery,
        page: 1,
        limit: 20
      };

      // Add year filter if selected
      if (selectedYears.length === 1) {
        searchParams.year = selectedYears[0];
      }

      const response = await publicService.searchArticles(searchParams);
      setResults(response.articles);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Available filter options
  const availableSubjects = [
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Cybersecurity',
    'Internet of Things',
    'Blockchain',
    'Cloud Computing',
    'Software Engineering',
    'Computer Networks',
    'Database Systems'
  ];

  const availableYears = ['2024', '2023', '2022', '2021', '2020'];

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleYearToggle = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedYears([]);
    setDateRange('all');
    setSearchType('all');
  };

  const filteredResults = results.filter(result => {
    // Filter by subjects
    if (selectedSubjects.length > 0) {
      const hasMatchingSubject = result.keywords.some(keyword => 
        selectedSubjects.some(subject => 
          keyword.toLowerCase().includes(subject.toLowerCase()) ||
          subject.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      if (!hasMatchingSubject) return false;
    }

    // Filter by years
    if (selectedYears.length > 0) {
      const resultYear = new Date(result.publishedAt).getFullYear().toString();
      if (!selectedYears.includes(resultYear)) return false;
    }

    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'relevance':
      default:
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(); // Default to date since we don't have relevance score
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          Search Articles
        </h1>
        <p className="text-lg text-secondary-600">
          Search through our comprehensive database of published research
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="lg:w-1/4">
          <div className="card sticky top-4">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  Clear All
                </button>
              </div>

              {/* Subject Filters */}
              <div className="mb-6">
                <h4 className="font-medium text-secondary-900 mb-3">Subject Areas</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableSubjects.map(subject => (
                    <label key={subject} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-secondary-700">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Year Filters */}
              <div className="mb-6">
                <h4 className="font-medium text-secondary-900 mb-3">Publication Year</h4>
                <div className="space-y-2">
                  {availableYears.map(year => (
                    <label key={year} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => handleYearToggle(year)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-secondary-700">{year}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Filters */}
              {(selectedSubjects.length > 0 || selectedYears.length > 0) && (
                <div className="border-t border-secondary-200 pt-4">
                  <h4 className="font-medium text-secondary-900 mb-3">Active Filters</h4>
                  <div className="space-y-2">
                    {selectedSubjects.map(subject => (
                      <div key={subject} className="flex items-center justify-between bg-primary-50 px-2 py-1 rounded">
                        <span className="text-xs text-primary-800">{subject}</span>
                        <button
                          onClick={() => handleSubjectToggle(subject)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {selectedYears.map(year => (
                      <div key={year} className="flex items-center justify-between bg-primary-50 px-2 py-1 rounded">
                        <span className="text-xs text-primary-800">{year}</span>
                        <button
                          onClick={() => handleYearToggle(year)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">

      {/* Search Form */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="space-y-6">
            {/* Main Search */}
            <div>
              <label className="form-label">Search Terms</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="form-input flex-1"
                  placeholder="Enter keywords, author names, or article titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isLoading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Search In</label>
                <select
                  className="form-select"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option value="all">All Fields</option>
                  <option value="title">Title Only</option>
                  <option value="abstract">Abstract Only</option>
                  <option value="keywords">Keywords Only</option>
                  <option value="authors">Authors Only</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Date Range</label>
                <select
                  className="form-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="last5">Last 5 Years</option>
                </select>
              </div>
              
              <div>
                <label className="form-label">Sort By</label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Publication Date</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="card-body">
                    <div className="h-6 bg-secondary-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-secondary-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-secondary-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-secondary-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">
                  Search Results ({sortedResults.length} of {results.length} found)
                </h2>
                <div className="text-sm text-secondary-600">
                  Showing results for "{searchQuery}"
                </div>
              </div>

              {/* Results List */}
              {sortedResults.length > 0 ? (
                <div className="space-y-6">
                  {sortedResults.map((result) => (
                    <article key={result.id} className="card hover:shadow-md transition-shadow">
                      <div className="card-body">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-secondary-900 mb-2 hover:text-primary-600 transition-colors">
                              <Link to={`/article/${result.id}`}>
                                {result.title}
                              </Link>
                            </h3>
                            
                            <div className="text-secondary-600 mb-3">
                              <span className="font-medium">Authors:</span>{' '}
                              {result.authors.map((author: any) => `${author.firstName} ${author.lastName}`).join(', ')}
                            </div>
                            
                            <p className="text-secondary-700 mb-4 line-clamp-3">
                              {result.abstract}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600 mb-3">
                              <span>Volume {result.issue.volume}, Issue {result.issue.number}</span>
                              <span>Pages: {result.pages}</span>
                              <span>DOI: {result.doi}</span>
                              <span>
                                Published: {new Date(result.publishedAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {result.keywords.map((keyword, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="ml-6 flex flex-col space-y-2">
                            <Link
                              to={`/article/${result.doi}`}
                              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-center text-sm"
                            >
                              View Article
                            </Link>
                            <a
                              href={buildPdfUrl(result.pdfPath)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="border border-secondary-300 text-secondary-700 px-4 py-2 rounded-md hover:bg-secondary-50 transition-colors text-sm text-center"
                            >
                              Download PDF
                            </a>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-secondary-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    No results found
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <div className="space-y-2 text-sm text-secondary-600">
                    <p>• Check spelling and try different keywords</p>
                    <p>• Use broader search terms</p>
                    <p>• Try searching in different fields</p>
                    <p>• Expand the date range</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!hasSearched && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                Search Tips
              </h3>
              <ul className="text-secondary-700 space-y-2">
                <li>• Use quotation marks for exact phrases: "machine learning"</li>
                <li>• Use AND, OR, NOT for complex searches</li>
                <li>• Use wildcards (*) for partial matches: comput*</li>
                <li>• Search by author: author:"Smith, J."</li>
                <li>• Search by DOI: doi:10.1234/example</li>
              </ul>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                Popular Searches
              </h3>
              <div className="space-y-2">
                {[
                  'artificial intelligence',
                  'machine learning',
                  'blockchain technology',
                  'internet of things',
                  'cybersecurity',
                  'data science'
                ].map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(term);
                      handleSearch();
                    }}
                    className="block text-primary-600 hover:text-primary-700 text-sm"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default Search;