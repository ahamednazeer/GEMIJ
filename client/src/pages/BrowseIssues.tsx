import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, FileText, ChevronRight, Filter } from 'lucide-react';
import { publicService } from '@/services/publicService';
import { Issue } from '@/types';

// Extended Issue type for display purposes
interface DisplayIssue extends Issue {
    year: number;
}

const BrowseIssues: React.FC = () => {
    const navigate = useNavigate();
    const [issues, setIssues] = useState<DisplayIssue[]>([]);
    const [filteredIssues, setFilteredIssues] = useState<DisplayIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedVolume, setSelectedVolume] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        loadIssues();
    }, []);

    useEffect(() => {
        filterIssues();
    }, [issues, selectedYear, selectedVolume]);

    const loadIssues = async () => {
        try {
            setLoading(true);
            const response = await publicService.getArchive(1, 100); // Load all for now

            // Transform issues to include year
            const issuesWithYear = (response.issues || []).map(issue => ({
                ...issue,
                year: issue.publishedAt ? new Date(issue.publishedAt).getFullYear() : new Date().getFullYear()
            }));

            setIssues(issuesWithYear);
        } catch (error) {
            console.error('Failed to load issues:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterIssues = () => {
        let filtered = [...issues];

        if (selectedYear !== 'all') {
            filtered = filtered.filter(issue => issue.year.toString() === selectedYear);
        }

        if (selectedVolume !== 'all') {
            filtered = filtered.filter(issue => issue.volume.toString() === selectedVolume);
        }

        // Sort by year and volume (newest first)
        filtered.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            if (a.volume !== b.volume) return b.volume - a.volume;
            return b.number - a.number;
        });

        setFilteredIssues(filtered);
    };

    const getUniqueYears = () => {
        const years = [...new Set(issues.map(issue => issue.year))];
        return years.sort((a, b) => b - a);
    };

    const getUniqueVolumes = () => {
        const volumes = [...new Set(issues.map(issue => issue.volume))];
        return volumes.sort((a, b) => b - a);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading issues...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Issues</h1>
                    <p className="text-gray-600">
                        Explore all published issues of our journal
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Filter by:</span>
                        </div>

                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Years</option>
                            {getUniqueYears().map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <select
                            value={selectedVolume}
                            onChange={(e) => setSelectedVolume(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">All Volumes</option>
                            {getUniqueVolumes().map(volume => (
                                <option key={volume} value={volume}>Volume {volume}</option>
                            ))}
                        </select>

                        <div className="ml-auto flex items-center space-x-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 rounded-md ${viewMode === 'grid'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 rounded-md ${viewMode === 'list'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Issues List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {filteredIssues.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
                        <p className="text-gray-600">
                            {selectedYear !== 'all' || selectedVolume !== 'all'
                                ? 'Try adjusting your filters to see more results.'
                                : 'No issues have been published yet.'}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredIssues.map((issue) => (
                            <div
                                key={issue.id}
                                onClick={() => navigate(`/issue/${issue.id}`)}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                            >
                                {/* Cover Image Placeholder */}
                                <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    {issue.coverImage ? (
                                        <img
                                            src={issue.coverImage}
                                            alt={`Volume ${issue.volume}, Issue ${issue.number}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center text-white">
                                            <BookOpen className="h-16 w-16 mx-auto mb-2 opacity-80" />
                                            <p className="text-2xl font-bold">Vol. {issue.volume}</p>
                                            <p className="text-lg">Issue {issue.number}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-indigo-600">
                                            {issue.year}
                                        </span>
                                        {issue.isCurrent && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                Current
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        Volume {issue.volume}, Issue {issue.number}
                                    </h3>

                                    {issue.title && (
                                        <p className="text-sm text-gray-700 mb-2 font-medium">
                                            {issue.title}
                                        </p>
                                    )}

                                    {issue.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                            {issue.description}
                                        </p>
                                    )}

                                    {issue.publishedAt && (
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            <span>{new Date(issue.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center text-indigo-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                        View Issue
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredIssues.map((issue) => (
                            <div
                                key={issue.id}
                                onClick={() => navigate(`/issue/${issue.id}`)}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-6 group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 flex-shrink-0">
                                            <BookOpen className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    Volume {issue.volume}, Issue {issue.number}
                                                </h3>
                                                {issue.isCurrent && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        Current Issue
                                                    </span>
                                                )}
                                            </div>

                                            {issue.title && (
                                                <p className="text-gray-700 font-medium mb-2">
                                                    {issue.title}
                                                </p>
                                            )}

                                            {issue.description && (
                                                <p className="text-gray-600 mb-3">
                                                    {issue.description}
                                                </p>
                                            )}

                                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2" />
                                                    <span>Year: {issue.year}</span>
                                                </div>
                                                {issue.publishedAt && (
                                                    <div className="flex items-center">
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        <span>Published: {new Date(issue.publishedAt).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseIssues;
