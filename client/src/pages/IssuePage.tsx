import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, FileText, Download, ExternalLink } from 'lucide-react';
import issueService, { Issue } from '@/services/issueService';
import { submissionService } from '@/services/submissionService';
import { Submission } from '@/types';

const IssuePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [articles, setArticles] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadIssueData(id);
        }
    }, [id]);

    const loadIssueData = async (issueId: string) => {
        try {
            setLoading(true);
            // Load issue details
            const issuesResponse = await issueService.getIssues();
            const foundIssue = issuesResponse.data?.find((i: Issue) => i.id === issueId);

            if (foundIssue) {
                setIssue(foundIssue);
                // TODO: Load articles for this issue
                // For now, we'll show an empty list
                setArticles([]);
            }
        } catch (error) {
            console.error('Failed to load issue:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadIssue = () => {
        // TODO: Implement full issue PDF download
        alert('Full issue PDF download will be implemented');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading issue...</p>
                </div>
            </div>
        );
    }

    if (!issue) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Issue Not Found</h2>
                    <p className="text-gray-600 mb-4">The issue you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/browse')}
                        className="text-indigo-600 hover:text-indigo-800"
                    >
                        Browse All Issues
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/10 p-3 rounded-lg">
                                <BookOpen className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold">
                                    Volume {issue.volume}, Issue {issue.number}
                                </h1>
                                <p className="text-indigo-100 mt-1">
                                    {issue.year}
                                </p>
                            </div>
                        </div>
                        {issue.isCurrent && (
                            <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                                Current Issue
                            </span>
                        )}
                    </div>

                    {issue.title && (
                        <h2 className="text-xl md:text-2xl font-semibold mb-4">
                            {issue.title}
                        </h2>
                    )}

                    {issue.description && (
                        <p className="text-indigo-100 max-w-3xl">
                            {issue.description}
                        </p>
                    )}

                    <div className="flex items-center space-x-6 mt-6 text-sm">
                        {issue.publishedAt && (
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Published: {new Date(issue.publishedAt).toLocaleDateString()}</span>
                            </div>
                        )}
                        <button
                            onClick={handleDownloadIssue}
                            className="flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Full Issue
                        </button>
                    </div>
                </div>
            </div>

            {/* Table of Contents */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Table of Contents</h2>

                {articles.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Articles Yet</h3>
                        <p className="text-gray-600">
                            Articles for this issue are being prepared and will appear here soon.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {articles.map((article, index) => (
                            <div
                                key={article.id}
                                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span className="text-sm font-medium text-gray-500">
                                                Article {index + 1}
                                            </span>
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                                {article.manuscriptType}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-indigo-600 cursor-pointer">
                                            <button onClick={() => navigate(`/article/${article.id}`)}>
                                                {article.title}
                                            </button>
                                        </h3>
                                        <p className="text-gray-700 mb-2">
                                            {article.author.firstName} {article.author.lastName}
                                            {article.coAuthors && article.coAuthors.length > 0 && (
                                                <>
                                                    {article.coAuthors.map((coAuthor, idx) => (
                                                        <span key={idx}>
                                                            , {coAuthor.firstName} {coAuthor.lastName}
                                                        </span>
                                                    ))}
                                                </>
                                            )}
                                        </p>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {article.abstract}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        DOI: 10.XXXX/placeholder
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => navigate(`/article/${article.id}`)}
                                            className="flex items-center px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Article
                                        </button>
                                        <button
                                            onClick={() => window.open(article.manuscriptFile, '_blank')}
                                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IssuePage;
