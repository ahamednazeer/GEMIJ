import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import ShareButton from '@/components/ui/ShareButton';
import ContactForm from '@/components/ui/ContactForm';
import { publicService } from '@/services/publicService';
import { Article } from '@/types';
import { buildPdfUrl } from '@/utils/url';



const ArticleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('abstract');
  const [showContactForm, setShowContactForm] = useState<'report' | 'typo' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const articleData = await publicService.getArticleById(id);
        setArticle(articleData);
      } catch (error) {
        console.error('Failed to fetch article:', error);
        setError('Failed to load article. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-secondary-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-secondary-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-secondary-200 rounded w-full"></div>
            <div className="h-4 bg-secondary-200 rounded w-5/6"></div>
            <div className="h-4 bg-secondary-200 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Error Loading Article
          </h1>
          <p className="text-secondary-600 mb-8">
            {error}
          </p>
          <Link
            to="/current-issue"
            className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors"
          >
            Browse Current Issue
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Article Not Found
          </h1>
          <p className="text-secondary-600 mb-8">
            The requested article could not be found.
          </p>
          <Link
            to="/current-issue"
            className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors"
          >
            Browse Current Issue
          </Link>
        </div>
      </div>
    );
  }

  const generateCitation = (format: string) => {
    const authors = article.authors.map((a: any) => `${a.firstName} ${a.lastName}`).join(', ');
    const year = new Date(article.publishedAt).getFullYear();
    
    switch (format) {
      case 'apa':
        return `${authors} (${year}). ${article.title}. International Journal of Advanced Technology, Engineering and Management, ${article.issue.volume}(${article.issue.number}), ${article.pages}. https://doi.org/${article.doi}`;
      case 'mla':
        return `${authors}. "${article.title}." International Journal of Advanced Technology, Engineering and Management, vol. ${article.issue.volume}, no. ${article.issue.number}, ${year}, pp. ${article.pages}.`;
      case 'chicago':
        return `${authors}. "${article.title}." International Journal of Advanced Technology, Engineering and Management ${article.issue.volume}, no. ${article.issue.number} (${year}): ${article.pages}.`;
      case 'ris':
        return `TY  - JOUR
AU  - ${article.authors.map((a: any) => `${a.firstName} ${a.lastName}`).join('\nAU  - ')}
TI  - ${article.title}
JO  - International Journal of Advanced Technology, Engineering and Management
VL  - ${article.issue.volume}
IS  - ${article.issue.number}
SP  - ${article.pages.split('-')[0]}
EP  - ${article.pages.split('-')[1] || article.pages.split('-')[0]}
PY  - ${year}
DO  - ${article.doi}
UR  - https://doi.org/${article.doi}
KW  - ${article.keywords.join('\nKW  - ')}
ER  -`;
      case 'bibtex':
        const firstAuthor = article.authors[0]?.lastName?.toLowerCase() || 'author';
        return `@article{${firstAuthor}${year},
  title={${article.title}},
  author={${article.authors.map((a: any) => `${a.firstName} ${a.lastName}`).join(' and ')}},
  journal={International Journal of Advanced Technology, Engineering and Management},
  volume={${article.issue.volume}},
  number={${article.issue.number}},
  pages={${article.pages}},
  year={${year}},
  doi={${article.doi}},
  url={https://doi.org/${article.doi}}
}`;
      default:
        return '';
    }
  };

  const downloadCitation = (format: string) => {
    const citation = generateCitation(format);
    const filename = `${article.doi.replace(/[^a-zA-Z0-9]/g, '_')}.${format === 'bibtex' ? 'bib' : format}`;
    const blob = new Blob([citation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Article Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          {article.title}
        </h1>
        
        <div className="space-y-2 mb-6">
          {article.authors.map((author: any, index: number) => (
            <div key={index} className="text-secondary-700">
              <span className="font-medium">{author.firstName} {author.lastName}</span>
              {author.isCorresponding && <span className="text-primary-600 ml-1">*</span>}
              <br />
              <span className="text-sm text-secondary-600">{author.affiliation}</span>
            </div>
          ))}
          <p className="text-xs text-secondary-500">
            * Corresponding author
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600 mb-6">
          <span>Volume {article.issue.volume}, Issue {article.issue.number}</span>
          <span>Pages: {article.pages}</span>
          <span>DOI: {article.doi}</span>
          <span>Published: {new Date(article.publishedAt).toLocaleDateString()}</span>
        </div>
        
        <div className="flex space-x-4">
          <a
            href={buildPdfUrl(article.pdfPath)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Download PDF
          </a>
          <ShareButton
            title={article.title}
            url={`/article/${article.id}`}
            description={article.abstract}
            className="px-6 py-2"
          />
          <button 
            onClick={() => setActiveTab('citation')}
            className="border border-secondary-300 text-secondary-700 px-6 py-2 rounded-md hover:bg-secondary-50 transition-colors"
          >
            Cite Article
          </button>
        </div>
      </div>

      {/* Article Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {article.views.toLocaleString()}
            </div>
            <div className="text-secondary-600 text-sm">Views</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {article.downloads}
            </div>
            <div className="text-secondary-600 text-sm">Downloads</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              0
            </div>
            <div className="text-secondary-600 text-sm">Citations</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-secondary-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'abstract', label: 'Abstract' },
            { id: 'fulltext', label: 'Full Text' },
            { id: 'keywords', label: 'Keywords' },
            { id: 'references', label: 'References' },
            { id: 'citation', label: 'Citation' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'abstract' && (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Abstract</h2>
            <p className="text-secondary-700 leading-relaxed">
              {article.abstract}
            </p>
          </div>
        )}
        
        {activeTab === 'fulltext' && (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Full Text PDF</h2>
            <div className="bg-secondary-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-secondary-700">Embedded PDF Viewer</span>
                <div className="flex space-x-2">
                  <a
                    href={buildPdfUrl(article.pdfPath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Open in New Tab
                  </a>
                  <a
                    href={buildPdfUrl(article.pdfPath)}
                    download
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
              <div className="border border-secondary-200 rounded-lg overflow-hidden">
                <iframe
                  src={`${buildPdfUrl(article.pdfPath)}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-96 md:h-[600px]"
                  title="Article PDF"
                />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'keywords' && (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'references' && (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">References</h2>
            <div className="text-secondary-600">
              <p>References are available in the full PDF version of this article.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'citation' && (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">How to Cite</h2>
            
            {/* Export Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => downloadCitation('ris')}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm"
              >
                Export RIS
              </button>
              <button
                onClick={() => downloadCitation('bibtex')}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm"
              >
                Export BibTeX
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-secondary-900">APA Style</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(generateCitation('apa'))}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-secondary-50 p-4 rounded-md">
                  <p className="text-secondary-700 text-sm font-mono">
                    {generateCitation('apa')}
                  </p>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-secondary-900">MLA Style</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(generateCitation('mla'))}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-secondary-50 p-4 rounded-md">
                  <p className="text-secondary-700 text-sm font-mono">
                    {generateCitation('mla')}
                  </p>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-secondary-900">Chicago Style</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(generateCitation('chicago'))}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-secondary-50 p-4 rounded-md">
                  <p className="text-secondary-700 text-sm font-mono">
                    {generateCitation('chicago')}
                  </p>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-secondary-900">RIS Format</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(generateCitation('ris'))}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-secondary-50 p-4 rounded-md">
                  <pre className="text-secondary-700 text-xs font-mono whitespace-pre-wrap">
                    {generateCitation('ris')}
                  </pre>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-secondary-900">BibTeX Format</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(generateCitation('bibtex'))}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-secondary-50 p-4 rounded-md">
                  <pre className="text-secondary-700 text-xs font-mono whitespace-pre-wrap">
                    {generateCitation('bibtex')}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact/Report Section */}
      <div className="border-t border-secondary-200 pt-8 mb-8">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">
          Report an Issue
        </h2>
        <p className="text-secondary-600 mb-4">
          Found an error or have concerns about this article? Let us know.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowContactForm('typo')}
            className="inline-flex items-center px-4 py-2 border border-secondary-300 text-secondary-700 rounded-md hover:bg-secondary-50 transition-colors"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Report Typo
          </button>
          <button
            onClick={() => setShowContactForm('report')}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Ethical Concern
          </button>
        </div>
      </div>

      {/* Related Articles */}
      <div className="border-t border-secondary-200 pt-8">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">
          Related Articles
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-secondary-900 mb-2">
                <Link to={`/article/${i + 1}`} className="hover:text-primary-600">
                  Related Article Title {i}
                </Link>
              </h3>
              <p className="text-secondary-600 text-sm mb-2">
                Author Name, et al.
              </p>
              <p className="text-secondary-700 text-sm">
                Brief description of the related article content...
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ContactForm
              type={showContactForm}
              articleId={article?.id}
              articleTitle={article?.title}
              onClose={() => setShowContactForm(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleView;