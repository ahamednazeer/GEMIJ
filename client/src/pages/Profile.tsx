import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import { submissionService } from '@/services/submissionService';
import { reviewerService } from '@/services/reviewerService';
import { SubmissionStatus } from '@/types';

const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSubmissions: 0,
        publishedArticles: 0,
        totalReviews: 0,
        citations: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            setLoading(true);
            try {
                let submissionsCount = 0;
                let publishedCount = 0;
                let reviewsCount = 0;

                // Fetch submission stats for authors/admins/editors
                if (['AUTHOR', 'ADMIN', 'EDITOR'].includes(user.role)) {
                    try {
                        // Fetch all submissions for the user (pagination might limit this, but for stats we ideally want all or a stats endpoint)
                        // Since we don't have a stats endpoint for submissions, we'll fetch the first page with a large limit or just standard
                        // NOTE: Ideally backend should provide a stats endpoint. For now fetching what we can.
                        const { submissions } = await submissionService.getSubmissions({ limit: 100 });
                        submissionsCount = submissions.length; // This might be just the page, but assuming it returns user's submissions
                        publishedCount = submissions.filter(s => s.status === SubmissionStatus.PUBLISHED).length;
                    } catch (error) {
                        console.error('Error fetching submissions:', error);
                    }
                }

                // Fetch review stats for reviewers/admins/editors
                if (['REVIEWER', 'ADMIN', 'EDITOR'].includes(user.role)) {
                    try {
                        // Use the dedicated stats endpoint for reviewers
                        const reviewerStats = await reviewerService.getReviewerStats();
                        reviewsCount = reviewerStats.completedReviews;
                    } catch (error) {
                        console.error('Error fetching review stats:', error);
                    }
                }

                setStats({
                    totalSubmissions: submissionsCount,
                    publishedArticles: publishedCount,
                    totalReviews: reviewsCount,
                    citations: 0 // Placeholder as no API exists for this yet
                });
            } catch (error) {
                console.error('Error fetching profile stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    if (!user) {
        navigate('/login');
        return null;
    }

    // Generate initials from first and last name
    const getInitials = () => {
        const firstInitial = user.firstName?.charAt(0).toUpperCase() || '';
        const lastInitial = user.lastName?.charAt(0).toUpperCase() || '';
        return `${firstInitial}${lastInitial}`;
    };

    // Get role badge variant
    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'error';
            case 'EDITOR':
                return 'warning';
            case 'REVIEWER':
                return 'info';
            case 'AUTHOR':
                return 'success';
            default:
                return 'neutral';
        }
    };

    // Format role name
    const formatRole = (role: string) => {
        return role.charAt(0) + role.slice(1).toLowerCase();
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/20"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-5xl font-bold shadow-2xl group-hover:scale-105 transition-transform duration-300">
                                {getInitials()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl font-bold mb-2">
                                {user.title && `${user.title} `}
                                {user.firstName} {user.lastName}
                            </h1>
                            <p className="text-primary-100 text-lg mb-4">{user.email}</p>

                            {/* Role Badges */}
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                                <Badge variant={getRoleBadgeVariant(user.role)} className="text-sm px-4 py-1.5">
                                    {formatRole(user.role)}
                                </Badge>
                                {user.isActive && (
                                    <Badge variant="success" className="text-sm px-4 py-1.5">
                                        Active
                                    </Badge>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="px-6 py-2.5 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-all duration-200 border border-white/30"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-6 py-2.5 bg-red-500/90 text-white rounded-lg font-medium hover:bg-red-600 transition-all duration-200 shadow-lg"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Professional Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Professional Details Card */}
                        <div className="card group hover:shadow-2xl transition-all duration-300">
                            <div className="card-header bg-gradient-to-r from-primary-50 to-secondary-50">
                                <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Professional Information
                                </h2>
                            </div>
                            <div className="card-body">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1 group/item">
                                        <label className="text-sm font-medium text-secondary-500 uppercase tracking-wide">Institution / Affiliation</label>
                                        <p className="text-lg text-secondary-900 font-medium group-hover/item:text-primary-600 transition-colors">
                                            {user.affiliation || 'Not specified'}
                                        </p>
                                    </div>

                                    <div className="space-y-1 group/item">
                                        <label className="text-sm font-medium text-secondary-500 uppercase tracking-wide">Country</label>
                                        <p className="text-lg text-secondary-900 font-medium group-hover/item:text-primary-600 transition-colors">
                                            {user.country || 'Not specified'}
                                        </p>
                                    </div>

                                    {user.orcid && (
                                        <div className="space-y-1 group/item md:col-span-2">
                                            <label className="text-sm font-medium text-secondary-500 uppercase tracking-wide">ORCID iD</label>
                                            <a
                                                href={`https://orcid.org/${user.orcid}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-lg text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2 group-hover/item:underline"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 01-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-1.016 5.016-4.787 5.016h-4.457V7.416zm1.444 8.597h2.284c2.2 0 3.47-1.284 3.47-3.572 0-2.288-1.247-3.581-3.438-3.581h-2.316v7.153z" />
                                                </svg>
                                                {user.orcid}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {user.bio && (
                                    <div className="mt-6 pt-6 border-t border-secondary-200">
                                        <label className="text-sm font-medium text-secondary-500 uppercase tracking-wide block mb-2">Bio</label>
                                        <p className="text-secondary-700 leading-relaxed whitespace-pre-wrap">
                                            {user.bio}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Stats Card */}
                        <div className="card hover:shadow-2xl transition-all duration-300">
                            <div className="card-header bg-gradient-to-r from-success-50 to-info-50">
                                <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Activity Overview
                                </h2>
                            </div>
                            <div className="card-body">
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                        <p className="text-secondary-600 mt-2 text-sm">Loading statistics...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl hover:scale-105 transition-transform duration-200">
                                            <div className="text-3xl font-bold text-primary-600 mb-1">{stats.totalSubmissions}</div>
                                            <div className="text-sm text-secondary-600">Submissions</div>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-xl hover:scale-105 transition-transform duration-200">
                                            <div className="text-3xl font-bold text-success-600 mb-1">{stats.publishedArticles}</div>
                                            <div className="text-sm text-secondary-600">Published</div>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-info-50 to-info-100 rounded-xl hover:scale-105 transition-transform duration-200">
                                            <div className="text-3xl font-bold text-info-600 mb-1">{stats.totalReviews}</div>
                                            <div className="text-sm text-secondary-600">Reviews</div>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl hover:scale-105 transition-transform duration-200">
                                            <div className="text-3xl font-bold text-warning-600 mb-1">{stats.citations}</div>
                                            <div className="text-sm text-secondary-600">Citations</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Account Details */}
                    <div className="space-y-6">
                        {/* Account Information Card */}
                        <div className="card hover:shadow-2xl transition-all duration-300">
                            <div className="card-header bg-gradient-to-r from-secondary-50 to-secondary-100">
                                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Account Details
                                </h2>
                            </div>
                            <div className="card-body space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">User ID</label>
                                    <p className="text-sm text-secondary-700 font-mono bg-secondary-50 px-3 py-2 rounded border border-secondary-200">
                                        {user.id}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Member Since</label>
                                    <p className="text-sm text-secondary-900 font-medium">
                                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>

                                {user.lastLoginAt && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Last Login</label>
                                        <p className="text-sm text-secondary-900 font-medium">
                                            {new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-secondary-200">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-secondary-600">
                                            Account Status: <span className="font-medium text-secondary-900">{user.isActive ? 'Active' : 'Inactive'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links Card */}
                        <div className="card hover:shadow-2xl transition-all duration-300">
                            <div className="card-header bg-gradient-to-r from-primary-50 to-primary-100">
                                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    Quick Links
                                </h2>
                            </div>
                            <div className="card-body space-y-2">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full text-left px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-all duration-200 font-medium flex items-center gap-2 group"
                                >
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Dashboard
                                </button>
                                {user.role === 'AUTHOR' && (
                                    <button
                                        onClick={() => navigate('/submit-paper')}
                                        className="w-full text-left px-4 py-3 bg-success-50 text-success-700 rounded-lg hover:bg-success-100 transition-all duration-200 font-medium flex items-center gap-2 group"
                                    >
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Submit Paper
                                    </button>
                                )}
                                {user.role === 'REVIEWER' && (
                                    <button
                                        onClick={() => navigate('/reviewer/invitations')}
                                        className="w-full text-left px-4 py-3 bg-info-50 text-info-700 rounded-lg hover:bg-info-100 transition-all duration-200 font-medium flex items-center gap-2 group"
                                    >
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Review Invitations
                                    </button>
                                )}
                                {(user.role === 'ADMIN' || user.role === 'EDITOR') && (
                                    <button
                                        onClick={() => navigate('/admin/users')}
                                        className="w-full text-left px-4 py-3 bg-warning-50 text-warning-700 rounded-lg hover:bg-warning-100 transition-all duration-200 font-medium flex items-center gap-2 group"
                                    >
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Manage Users
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
