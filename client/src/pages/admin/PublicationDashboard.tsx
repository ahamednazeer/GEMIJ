import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import publicationService from '../../services/publicationService';
import PublishArticleModal from '../../components/PublishArticleModal';

interface ReadySubmission {
    id: string;
    title: string;
    manuscriptType: string;
    author: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    submittedAt: string;
    acceptedAt: string;
    doi?: string;
    files: any[];
    payments: {
        status: string;
        amount: number;
        paidAt: string;
    }[];
}

const PublicationDashboard: React.FC = () => {
    const [submissions, setSubmissions] = useState<ReadySubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<ReadySubmission | null>(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'with-doi' | 'without-doi'>('all');

    useEffect(() => {
        loadReadySubmissions();
    }, []);

    const loadReadySubmissions = async () => {
        try {
            setLoading(true);
            const response = await publicationService.getReadyToPublish();
            setSubmissions(response.data || []);
        } catch (error) {
            console.error('Failed to load submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublishClick = (submission: ReadySubmission) => {
        setSelectedSubmission(submission);
        setShowPublishModal(true);
    };

    const handlePublishSuccess = () => {
        setShowPublishModal(false);
        setSelectedSubmission(null);
        loadReadySubmissions();
    };

    const filteredSubmissions = submissions.filter(sub => {
        if (filter === 'with-doi') return sub.doi;
        if (filter === 'without-doi') return !sub.doi;
        return true;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysSince = (dateString: string) => {
        const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading submissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Publication Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage and publish accepted articles
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-indigo-50 px-4 py-2 rounded-lg">
                                <div className="text-2xl font-bold text-indigo-600">{submissions.length}</div>
                                <div className="text-xs text-indigo-600">Ready to Publish</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="mb-6 flex space-x-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        All ({submissions.length})
                    </button>
                    <button
                        onClick={() => setFilter('with-doi')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'with-doi'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        With DOI ({submissions.filter(s => s.doi).length})
                    </button>
                    <button
                        onClick={() => setFilter('without-doi')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'without-doi'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Without DOI ({submissions.filter(s => !s.doi).length})
                    </button>
                </div>

                {/* Submissions List */}
                {filteredSubmissions.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions ready</h3>
                        <p className="text-gray-500">
                            {filter === 'all'
                                ? 'There are no accepted and paid submissions ready for publication.'
                                : `No submissions ${filter === 'with-doi' ? 'with' : 'without'} DOI.`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSubmissions.map((submission) => (
                            <div
                                key={submission.id}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900 flex-1">
                                                {submission.title}
                                            </h3>
                                            {submission.doi ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    DOI Assigned
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    No DOI
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                                <span>
                                                    {submission.author.firstName} {submission.author.lastName}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                                <span>{submission.manuscriptType}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                <span>Accepted: {formatDate(submission.acceptedAt)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                <span>{getDaysSince(submission.acceptedAt)} days since acceptance</span>
                                            </div>
                                            <div className="flex items-center text-sm text-green-600">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                <span>Payment: ${submission.payments?.[0]?.amount || '0.00'} (Paid)</span>
                                            </div>
                                        </div>

                                        {submission.doi && (
                                            <div className="mt-3 text-sm text-gray-500">
                                                <span className="font-medium">DOI:</span> {submission.doi}
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-6">
                                        <button
                                            onClick={() => handlePublishClick(submission)}
                                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md"
                                        >
                                            Publish Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Publish Modal */}
            {showPublishModal && selectedSubmission && (
                <PublishArticleModal
                    isOpen={true}
                    submission={selectedSubmission}
                    onClose={() => {
                        setShowPublishModal(false);
                        setSelectedSubmission(null);
                    }}
                    onSuccess={handlePublishSuccess}
                />
            )}
        </div>
    );
};

export default PublicationDashboard;
