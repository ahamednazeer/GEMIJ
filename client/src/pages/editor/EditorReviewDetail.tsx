import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewService } from '@/services/reviewService';
import { Review } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const EditorReviewDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [review, setReview] = useState<Review | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadReview();
        }
    }, [id]);

    const loadReview = async () => {
        try {
            const data = await reviewService.getReview(id!);
            setReview(data);
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to load review');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-600 mt-2">Loading review...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !review) {
        return (
            <div className="min-h-screen bg-secondary-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Alert variant="error" title="Error">
                        {error || 'Review not found'}
                    </Alert>
                    <Button onClick={() => navigate('/dashboard')} className="mt-4">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'success';
            case 'IN_PROGRESS':
                return 'warning';
            case 'PENDING':
                return 'info';
            case 'DECLINED':
                return 'error';
            default:
                return 'neutral';
        }
    };

    const getRecommendationColor = (recommendation?: string) => {
        if (!recommendation) return 'text-slate-600';

        const rec = recommendation.toUpperCase();
        if (rec.includes('ACCEPT')) return 'text-green-600';
        if (rec.includes('REJECT')) return 'text-red-600';
        if (rec.includes('REVISION')) return 'text-orange-600';
        return 'text-slate-600';
    };

    return (
        <div className="min-h-screen bg-secondary-50">
            {/* Clean Academic Header */}
            <div className="bg-white border-b border-border">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                        className="mb-6 -ml-2"
                        size="sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Button>
                    
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                                Review Details
                            </h1>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                {review.submission?.title || 'Manuscript Review'}
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <Badge
                                variant={getStatusBadgeVariant(review.status)}
                                className="text-sm px-4 py-1.5"
                            >
                                {review.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Review Information Card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h2 className="text-2xl font-bold text-slate-900">Review Information</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Reviewer Info */}
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">Reviewer</label>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">
                                        {review.reviewer?.firstName?.[0]}{review.reviewer?.lastName?.[0]}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">
                                        {review.reviewer?.firstName} {review.reviewer?.lastName}
                                    </p>
                                    <p className="text-sm text-slate-600">{review.reviewer?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1 block">Invited</label>
                                <p className="text-slate-900">{new Date(review.invitedAt).toLocaleDateString()}</p>
                            </div>
                            {review.acceptedAt && (
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Accepted</label>
                                    <p className="text-slate-900">{new Date(review.acceptedAt).toLocaleDateString()}</p>
                                </div>
                            )}
                            {review.submittedAt && (
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Submitted</label>
                                    <p className="text-slate-900">{new Date(review.submittedAt).toLocaleDateString()}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1 block">Due Date</label>
                                <p className="text-slate-900">{new Date(review.dueDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manuscript Authors */}
                {review.submission && (
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
                            <h2 className="text-2xl font-bold text-slate-900">Manuscript Authors</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Main Author */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <p className="font-semibold text-slate-900">
                                        {review.submission.author.firstName} {review.submission.author.lastName}
                                    </p>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                        Corresponding Author
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">{review.submission.author.email}</p>
                                {review.submission.author.affiliation && (
                                    <p className="text-sm text-slate-600">{review.submission.author.affiliation}</p>
                                )}
                            </div>

                            {/* Co-Authors */}
                            {review.submission.coAuthors && review.submission.coAuthors.length > 0 && (
                                <>
                                    {review.submission.coAuthors.map((author, index) => (
                                        <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                                <p className="font-semibold text-slate-900">
                                                    {author.firstName} {author.lastName}
                                                </p>
                                                {author.isCorresponding && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                                        Corresponding Author
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mb-1">{author.email}</p>
                                            {author.affiliation && (
                                                <p className="text-sm text-slate-600">{author.affiliation}</p>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Manuscript Details */}
                {review.submission && (
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
                            <h2 className="text-2xl font-bold text-slate-900">Manuscript Information</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1 block">Title</label>
                                <p className="text-slate-900 font-medium">{review.submission.title}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1 block">Abstract</label>
                                <p className="text-slate-900 leading-relaxed">{review.submission.abstract}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1 block">Keywords</label>
                                <div className="flex flex-wrap gap-2">
                                    {review.submission.keywords.map((keyword, index) => (
                                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1 block">Manuscript Type</label>
                                <p className="text-slate-900">{review.submission.manuscriptType}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-1 block">Submitted</label>
                                <p className="text-slate-900">
                                    {new Date(review.submission.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manuscript Files */}
                {review.submission && review.submission.files && review.submission.files.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                            <h2 className="text-2xl font-bold text-slate-900">Manuscript Files</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {review.submission.files.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{file.originalName}</p>
                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                    <span>{file.fileType.toUpperCase()}</span>
                                                    <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                    {file.isMainFile && (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                                            Main File
                                                        </span>
                                                    )}
                                                </div>
                                                {file.description && (
                                                    <p className="text-sm text-slate-600 mt-1">{file.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Revision Files */}
                {review.submission && review.submission.revisions && review.submission.revisions.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
                            <h2 className="text-2xl font-bold text-slate-900">Revision Files</h2>
                            <p className="text-slate-600 mt-1">Latest revised manuscript and supporting files</p>
                        </div>
                        <div className="p-6">
                            {review.submission.revisions
                                .sort((a, b) => b.revisionNumber - a.revisionNumber)
                                .slice(0, 1)
                                .map((revision) => (
                                    <div key={revision.id} className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    Revision {revision.revisionNumber}
                                                </h3>
                                                <p className="text-sm text-slate-600">
                                                    Submitted: {new Date(revision.submittedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                                                Latest Version
                                            </span>
                                        </div>

                                        {revision.authorResponse && (
                                            <div className="bg-slate-50 p-4 rounded-xl mb-4">
                                                <h4 className="font-medium text-slate-900 mb-2">Author Response</h4>
                                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{revision.authorResponse}</p>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {revision.files.map((file) => (
                                                <div key={file.id} className="flex items-center justify-between p-4 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{file.originalName}</p>
                                                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                                                <span>{file.fileType.toUpperCase()}</span>
                                                                <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                                                    Revised
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Download
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Show all revisions if more than one */}
                                        {review.submission.revisions.length > 1 && (
                                            <div className="mt-6 pt-4 border-t border-slate-200">
                                                <h4 className="font-medium text-slate-900 mb-3">Previous Revisions</h4>
                                                <div className="space-y-2">
                                                    {review.submission.revisions
                                                        .sort((a, b) => b.revisionNumber - a.revisionNumber)
                                                        .slice(1)
                                                        .map((prevRevision) => (
                                                            <div key={prevRevision.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                                <div>
                                                                    <p className="font-medium text-slate-900 text-sm">
                                                                        Revision {prevRevision.revisionNumber}
                                                                    </p>
                                                                    <p className="text-xs text-slate-600">
                                                                        {new Date(prevRevision.submittedAt).toLocaleDateString()} • {prevRevision.files.length} files
                                                                    </p>
                                                                </div>
                                                                <Button variant="ghost" size="sm" className="text-xs">
                                                                    View Files
                                                                </Button>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Review Content */}
                {review.status === 'COMPLETED' && (
                    <>
                        {/* Recommendation */}
                        {review.recommendation && (
                            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
                                    <h2 className="text-2xl font-bold text-slate-900">Recommendation</h2>
                                </div>
                                <div className="p-6">
                                    <p className={`text-2xl font-bold ${getRecommendationColor(review.recommendation)}`}>
                                        {review.recommendation.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Rating */}
                        {review.rating && (
                            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-yellow-50 to-amber-50">
                                    <h2 className="text-2xl font-bold text-slate-900">Overall Rating</h2>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-2">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-8 h-8 ${i < review.rating! ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                />
                                            </svg>
                                        ))}
                                        <span className="ml-2 text-xl font-semibold text-slate-700">{review.rating}/5</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Comments for Author */}
                        {review.authorComments && (
                            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
                                    <h2 className="text-2xl font-bold text-slate-900">Comments for Author</h2>
                                </div>
                                <div className="p-6">
                                    <div className="prose prose-slate max-w-none">
                                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{review.authorComments}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confidential Comments */}
                        {review.confidentialComments && (
                            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-red-50 to-orange-50">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <h2 className="text-2xl font-bold text-slate-900">Confidential Comments (Editor Only)</h2>
                                    </div>
                                </div>
                                <div className="p-6 bg-red-50/30">
                                    <div className="prose prose-slate max-w-none">
                                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{review.confidentialComments}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Pending/In Progress State */}
                {(review.status === 'PENDING' || review.status === 'IN_PROGRESS') && (
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">Review {review.status === 'PENDING' ? 'Pending' : 'In Progress'}</h3>
                            <p className="text-slate-600">
                                {review.status === 'PENDING'
                                    ? 'The reviewer has not yet started this review.'
                                    : 'The reviewer is currently working on this review.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Declined State */}
                {review.status === 'DECLINED' && (
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">Review Declined</h3>
                            <p className="text-slate-600">The reviewer declined this review invitation.</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex gap-4">
                    <Button onClick={() => navigate('/dashboard')} variant="outline">
                        Back to Dashboard
                    </Button>
                    {review.submission && (
                        <Button onClick={() => navigate(`/editor/submission/${review.submission.id}/reviews`)}>
                            View All Reviews
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorReviewDetail;
