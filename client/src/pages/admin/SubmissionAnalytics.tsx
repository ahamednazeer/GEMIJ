import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { UserManagementData } from '@/services/adminService';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface SubmissionStatsData {
    totalSubmissions: number;
    byStatus: {
        [key: string]: number;
    };
    byManuscriptType: {
        [key: string]: number;
    };
    averageReviewTime: number;
    acceptanceRate: number;
    rejectionRate: number;
    recentSubmissions: Array<{
        id: string;
        title: string;
        authorName: string;
        status: string;
        manuscriptType: string;
        submittedDate: string;
        assignedEditor?: {
            id: string;
            name: string;
            isChief: boolean;
        };
    }>;
}

const SubmissionAnalytics: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<SubmissionStatsData | null>(null);
    const [editors, setEditors] = useState<UserManagementData[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigningSubmissionId, setAssigningSubmissionId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [selectedEditors, setSelectedEditors] = useState<{ [submissionId: string]: string }>({});
    const [isChiefEditor, setIsChiefEditor] = useState<{ [submissionId: string]: boolean }>({});

    useEffect(() => {
        loadStats();
        loadEditors();
    }, [period]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await adminService.getSubmissionStats(period);
            setStats(data);
        } catch (error) {
            console.error('Failed to load submission stats:', error);
            setMessage({ text: 'Failed to load submission statistics', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const loadEditors = async () => {
        try {
            const editorsData = await adminService.getEditors();
            setEditors(editorsData);
        } catch (error) {
            console.error('Failed to load editors:', error);
            setMessage({ text: 'Failed to load editors list', type: 'error' });
        }
    };

    const handleAssignEditor = async (submissionId: string) => {
        const editorId = selectedEditors[submissionId];
        if (!editorId) {
            setMessage({ text: 'Please select an editor', type: 'error' });
            return;
        }

        setAssigningSubmissionId(submissionId);
        try {
            await adminService.assignSubmissionToEditor(
                submissionId,
                editorId,
                isChiefEditor[submissionId] || false
            );
            setMessage({ text: 'Editor assigned successfully', type: 'success' });

            // Clear selection
            setSelectedEditors(prev => {
                const newState = { ...prev };
                delete newState[submissionId];
                return newState;
            });
            setIsChiefEditor(prev => {
                const newState = { ...prev };
                delete newState[submissionId];
                return newState;
            });

            // Reload stats to show updated assignment
            await loadStats();
        } catch (error) {
            console.error('Failed to assign editor:', error);
            setMessage({ text: 'Failed to assign editor', type: 'error' });
        } finally {
            setAssigningSubmissionId(null);
        }
    };

    const getStatusBadgeVariant = (status: string): 'neutral' | 'info' | 'success' | 'warning' | 'error' => {
        switch (status) {
            case 'SUBMITTED': return 'info';
            case 'INITIAL_REVIEW': return 'warning';
            case 'UNDER_REVIEW': return 'warning';
            case 'REVISION_REQUESTED': return 'warning';
            case 'ACCEPTED': return 'success';
            case 'REJECTED': return 'error';
            case 'PUBLISHED': return 'success';
            default: return 'neutral';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
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
                                Submission Analytics
                            </h1>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                Track and analyze manuscript submissions
                            </p>
                        </div>
                        <div className="flex-shrink-0 flex items-center space-x-4">
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value as any)}
                                className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                                <option value="YEARLY">Yearly</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {message && (
                    <Alert
                        variant={message.type === 'success' ? 'success' : 'error'}
                        title={message.type === 'success' ? 'Success' : 'Error'}
                        className="mb-6"
                    >
                        {message.text}
                    </Alert>
                )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-secondary-600 mt-4">Loading analytics...</p>
                </div>
            ) : stats ? (
                <>
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="card">
                            <div className="card-body">
                                <h3 className="text-sm font-medium text-secondary-600 mb-2">
                                    Total Submissions
                                </h3>
                                <div className="text-3xl font-bold text-primary-600">
                                    {stats.totalSubmissions || 0}
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <h3 className="text-sm font-medium text-secondary-600 mb-2">
                                    Acceptance Rate
                                </h3>
                                <div className="text-3xl font-bold text-success-600">
                                    {stats.acceptanceRate ? `${stats.acceptanceRate.toFixed(1)}%` : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <h3 className="text-sm font-medium text-secondary-600 mb-2">
                                    Rejection Rate
                                </h3>
                                <div className="text-3xl font-bold text-danger-600">
                                    {stats.rejectionRate ? `${stats.rejectionRate.toFixed(1)}%` : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <h3 className="text-sm font-medium text-secondary-600 mb-2">
                                    Avg Review Time
                                </h3>
                                <div className="text-3xl font-bold text-info-600">
                                    {stats.averageReviewTime ? `${stats.averageReviewTime} days` : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="card">
                            <div className="card-header">
                                <h2 className="text-xl font-semibold text-secondary-900">
                                    Submissions by Status
                                </h2>
                            </div>
                            <div className="card-body">
                                {stats.byStatus && Object.keys(stats.byStatus).length > 0 ? (
                                    <div className="space-y-3">
                                        {Object.entries(stats.byStatus).map(([status, count]) => (
                                            <div key={status} className="flex justify-between items-center">
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant={getStatusBadgeVariant(status)}>
                                                        {formatStatus(status)}
                                                    </Badge>
                                                </div>
                                                <span className="text-lg font-semibold text-secondary-900">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-secondary-600 text-center py-4">No status data available</p>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2 className="text-xl font-semibold text-secondary-900">
                                    Submissions by Type
                                </h2>
                            </div>
                            <div className="card-body">
                                {stats.byManuscriptType && Object.keys(stats.byManuscriptType).length > 0 ? (
                                    <div className="space-y-3">
                                        {Object.entries(stats.byManuscriptType).map(([type, count]) => (
                                            <div key={type} className="flex justify-between items-center">
                                                <span className="text-secondary-700">{type}</span>
                                                <span className="text-lg font-semibold text-secondary-900">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-secondary-600 text-center py-4">No type data available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Submissions */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="text-xl font-semibold text-secondary-900">
                                Recent Submissions
                            </h2>
                        </div>
                        <div className="card-body p-0">
                            {stats.recentSubmissions && stats.recentSubmissions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-secondary-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                                    Title
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                                    Author
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                                    Submitted
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                                    Assigned Editor
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-secondary-200">
                                            {stats.recentSubmissions.map((submission) => (
                                                <tr key={submission.id} className="hover:bg-secondary-50">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-secondary-900">
                                                            {submission.title.substring(0, 60)}
                                                            {submission.title.length > 60 ? '...' : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-secondary-600">
                                                        {submission.authorName}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-secondary-600">
                                                        {submission.manuscriptType}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={getStatusBadgeVariant(submission.status)}>
                                                            {formatStatus(submission.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-secondary-600">
                                                        {new Date(submission.submittedDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {submission.assignedEditor ? (
                                                            <div className="text-sm">
                                                                <div className="font-medium text-secondary-900">
                                                                    {submission.assignedEditor.name}
                                                                </div>
                                                                {submission.assignedEditor.isChief && (
                                                                    <Badge variant="info" className="mt-1">Chief</Badge>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <select
                                                                    value={selectedEditors[submission.id] || ''}
                                                                    onChange={(e) => setSelectedEditors(prev => ({
                                                                        ...prev,
                                                                        [submission.id]: e.target.value
                                                                    }))}
                                                                    className="text-sm px-2 py-1 border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                                    disabled={assigningSubmissionId === submission.id}
                                                                >
                                                                    <option value="">Select Editor</option>
                                                                    {editors.map(editor => (
                                                                        <option key={editor.id} value={editor.id}>
                                                                            {editor.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <div className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`chief-${submission.id}`}
                                                                        checked={isChiefEditor[submission.id] || false}
                                                                        onChange={(e) => setIsChiefEditor(prev => ({
                                                                            ...prev,
                                                                            [submission.id]: e.target.checked
                                                                        }))}
                                                                        className="rounded border-secondary-300"
                                                                        disabled={assigningSubmissionId === submission.id}
                                                                    />
                                                                    <label htmlFor={`chief-${submission.id}`} className="text-xs text-secondary-600">
                                                                        Chief Editor
                                                                    </label>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAssignEditor(submission.id)}
                                                                    disabled={assigningSubmissionId === submission.id || !selectedEditors[submission.id]}
                                                                    className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {assigningSubmissionId === submission.id ? 'Assigning...' : 'Assign'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <button
                                                            className="text-primary-600 hover:text-primary-900 font-medium"
                                                            onClick={() => {
                                                                if (submission.status === 'SUBMITTED' || submission.status === 'INITIAL_REVIEW') {
                                                                    navigate(`/editor/submission/${submission.id}/screen`);
                                                                } else {
                                                                    navigate(`/editor/submission/${submission.id}/reviews`);
                                                                }
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-secondary-600">No recent submissions</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-12">
                    <p className="text-secondary-600">No data available</p>
                </div>
            )}
            </div>
        </div>
    );
};

export default SubmissionAnalytics;
