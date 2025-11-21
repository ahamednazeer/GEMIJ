import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Download,
    Share2,
    Calendar,
    FileText,
    Users,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { publicService } from '@/services/publicService';
import { Article } from '@/types';
import { buildPdfUrl } from '@/utils/url';

const ArticlePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAbstract, setShowAbstract] = useState(true);
    const [showReferences, setShowReferences] = useState(false);
    const [citationFormat, setCitationFormat] = useState<'apa' | 'mla' | 'chicago' | 'bibtex'>('apa');

    useEffect(() => {
        if (id) {
            loadArticle(id);
        }
    }, [id]);

    const loadArticle = async (articleId: string) => {
        try {
            setLoading(true);
            const response = await publicService.getArticleById(articleId);
            setArticle(response);
        } catch (error) {
            console.error('Failed to load article:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (article?.pdfPath) {
            window.open(buildPdfUrl(article.pdfPath), '_blank');
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article?.title,
                    text: article?.abstract,
                    url: url,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    const generateCitation = () => {
        if (!article) return '';

        const authors = article.authors || [];
        const authorNames = authors.map((a: any) => `${a.lastName}, ${a.firstName.charAt(0)}.`).join(', ');
        const year = new Date(article.publishedAt).getFullYear();

        switch (citationFormat) {
            case 'apa':
                return `${authorNames} (${year}). ${article.title}. Journal Name, Volume(Issue), ${article.pages}. DOI: ${article.doi}`;
            case 'mla':
                return `${authorNames} "${article.title}." Journal Name, vol. X, no. Y, ${year}, pp. ${article.pages}.`;
            case 'chicago':
                return `${authorNames} "${article.title}." Journal Name X, no. Y (${year}): ${article.pages}.`;
            case 'bibtex':
                return `@article{author${year},\n  author = {${authorNames}},\n  title = {${article.title}},\n  journal = {Journal Name},\n  year = {${year}}\n}`;
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading article...</p>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h2>
                    <p className="text-gray-600 mb-4">The article you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-indigo-600 hover:text-indigo-800"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                            Research Article
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </button>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        {article.title}
                    </h1>

                    {/* Authors */}
                    <div className="flex items-start space-x-2 text-gray-700 mb-4">
                        <Users className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                            {article.authors.map((author: any, idx: number) => (
                                <div key={idx} className="flex items-center">
                                    <span className="font-medium">
                                        {author.firstName} {author.lastName}
                                    </span>
                                    {author.affiliation && (
                                        <span className="text-gray-500 ml-1 text-sm">
                                            ({author.affiliation})
                                        </span>
                                    )}
                                    {idx < article.authors.length - 1 && <span className="mr-2">,</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Published: {new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>DOI: {article.doi}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Article Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Abstract */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <button
                                onClick={() => setShowAbstract(!showAbstract)}
                                className="flex items-center justify-between w-full text-left mb-4"
                            >
                                <h2 className="text-xl font-bold text-gray-900">Abstract</h2>
                                {showAbstract ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                            {showAbstract && (
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {article.abstract}
                                </p>
                            )}
                        </div>

                        {/* Keywords */}
                        {article.keywords && article.keywords.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Keywords</h2>
                                <div className="flex flex-wrap gap-2">
                                    {article.keywords.map((keyword, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* References */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <button
                                onClick={() => setShowReferences(!showReferences)}
                                className="flex items-center justify-between w-full text-left mb-4"
                            >
                                <h2 className="text-xl font-bold text-gray-900">References</h2>
                                {showReferences ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                            {showReferences && (
                                <p className="text-gray-600 text-sm">
                                    References will be displayed here once the full article is processed.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Citation */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Cite This Article</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Citation Format
                                </label>
                                <select
                                    value={citationFormat}
                                    onChange={(e) => setCitationFormat(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="apa">APA</option>
                                    <option value="mla">MLA</option>
                                    <option value="chicago">Chicago</option>
                                    <option value="bibtex">BibTeX</option>
                                </select>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md">
                                <p className="text-sm text-gray-700 font-mono whitespace-pre-wrap break-words">
                                    {generateCitation()}
                                </p>
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(generateCitation())}
                                className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                            >
                                Copy Citation
                            </button>
                        </div>

                        {/* Article Metrics */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Article Metrics</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Views</span>
                                    <span className="font-semibold text-gray-900">{article.views}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Downloads</span>
                                    <span className="font-semibold text-gray-900">{article.downloads}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticlePage;
