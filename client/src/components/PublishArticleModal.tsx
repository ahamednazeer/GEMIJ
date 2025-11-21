import React, { useState, useEffect } from 'react';
import { X, Globe, FileText, Users, BookOpen, Eye, CheckCircle, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import publicationService, { PublishArticleData, PublicationSettings, PublicationOptions } from '../services/publicationService';
import { Issue, Conference } from '../services/issueService';
import toast from 'react-hot-toast';

interface PublishArticleModalProps {
    isOpen: boolean;
    submission: any;
    onClose: () => void;
    onSuccess: () => void;
}

type Tab = 'destination' | 'metadata' | 'authors' | 'citation' | 'visibility' | 'review';

const PublishArticleModal: React.FC<PublishArticleModalProps> = ({ isOpen, submission, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New state for enhanced features
    const [activeTab, setActiveTab] = useState<Tab>('destination');
    const [metadata, setMetadata] = useState({
        title: '',
        abstract: '',
        keywords: [] as string[],
        manuscriptType: '',
        authors: [] as any[]
    });
    const [citation, setCitation] = useState({
        volume: 0,
        issue: 0,
        pages: '',
        articleNumber: '',
        year: new Date().getFullYear()
    });
    const [seo, setSeo] = useState({
        metaDescription: '',
        canonicalUrl: '',
        ogImage: ''
    });

    // Destination state
    const [destination, setDestination] = useState<'CURRENT_ISSUE' | 'PAST_ISSUE' | 'CONFERENCE' | 'ONLINE_FIRST'>('CURRENT_ISSUE');
    const [selectedIssueId, setSelectedIssueId] = useState('');
    const [selectedConferenceId, setSelectedConferenceId] = useState('');
    const [issues, setIssues] = useState<Issue[]>([]);
    const [conferences, setConferences] = useState<Conference[]>([]);

    // Settings state
    const [settings, setSettings] = useState<PublicationSettings>({
        showTitle: true,
        showAuthors: true,
        showAbstract: true,
        showKeywords: true,
        showPublicationDate: true,
        showDOI: true,
        showConflicts: false,
        showFunding: false,
        showHistory: false,
        showReferences: false,
        showOrcid: false,
        enablePdfDownload: true,
        pdfWatermark: '',
        showInlinePdf: false,
        showInTOC: true,
        showSequenceNo: true,
        showPageNumbers: true,
        addToSearchIndex: true,
        includeInSitemap: true,
        includeInOAIPMH: true,
        includeInRSS: true,
        enableGoogleScholar: true,

        // New defaults
        showViews: true,
        showDownloads: true,
        isPrivate: false
    });

    // Options state
    const [options, setOptions] = useState<PublicationOptions>({
        publishImmediately: true,
        scheduledPublishAt: '',
        requiresApproval: false,
        showOnHomepage: false,
        featuredArticle: false
    });

    // Initialize data when submission loads
    useEffect(() => {
        if (submission) {
            setMetadata({
                title: submission.title,
                abstract: submission.abstract,
                keywords: submission.keywords || [],
                manuscriptType: submission.manuscriptType,
                authors: [submission.author, ...(submission.coAuthors || [])].map((a: any, i: number) => ({ ...a, order: i }))
            });
            setCitation(prev => ({
                ...prev,
                pages: submission.pages || ''
            }));
        }
    }, [submission]);

    // Load destinations
    useEffect(() => {
        const loadDestinations = async () => {
            try {
                setLoading(true);
                const response = await publicationService.getPublicationDestinations();
                setIssues(response.data.allIssues || []);
                setConferences(response.data.conferences || []);

                // Auto-select current issue if available
                const currentIssue = response.data.currentIssue;
                if (currentIssue) {
                    setSelectedIssueId(currentIssue.id);
                    setCitation(prev => ({
                        ...prev,
                        volume: currentIssue.volume,
                        issue: currentIssue.number
                    }));
                }
            } catch (error) {
                console.error('Failed to load destinations:', error);
                toast.error('Failed to load publication destinations');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            loadDestinations();
        }
    }, [isOpen]);

    const handlePublish = async () => {
        // Validation
        if ((destination === 'CURRENT_ISSUE' || destination === 'PAST_ISSUE') && !selectedIssueId) {
            toast.error('Please select an issue');
            return;
        }
        if (destination === 'CONFERENCE' && !selectedConferenceId) {
            toast.error('Please select a conference');
            return;
        }

        try {
            setSubmitting(true);

            const publishData: PublishArticleData = {
                destination,
                issueId: destination.includes('ISSUE') ? selectedIssueId : undefined,
                conferenceId: destination === 'CONFERENCE' ? selectedConferenceId : undefined,
                pages: citation.pages,
                articleNumber: citation.articleNumber,
                ...options,
                settings: {
                    ...settings,
                    ...seo
                },
                // Metadata updates
                title: metadata.title,
                abstract: metadata.abstract,
                keywords: metadata.keywords,
                manuscriptType: metadata.manuscriptType,
                authors: metadata.authors
            };

            await publicationService.publishArticle(submission.id, publishData);
            toast.success('Article published successfully');
            onClose();
            onSuccess();
        } catch (error: any) {
            console.error('Publish error:', error);
            toast.error(error.response?.data?.error || 'Failed to publish article');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;
    if (!submission || !submission.author) return null;

    const tabs = [
        { id: 'destination' as Tab, label: 'Destination', icon: Globe },
        { id: 'metadata' as Tab, label: 'Metadata', icon: FileText },
        { id: 'authors' as Tab, label: 'Authors', icon: Users },
        { id: 'citation' as Tab, label: 'Citation & SEO', icon: BookOpen },
        { id: 'visibility' as Tab, label: 'Visibility', icon: Eye },
        { id: 'review' as Tab, label: 'Review & Publish', icon: CheckCircle }
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Publish Article
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Configure publication details for "{submission.title}"
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex h-[600px]">
                            {/* Sidebar Tabs */}
                            <div className="w-64 border-r border-gray-200 pr-4 space-y-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <tab.icon className={`mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400'
                                            }`} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 pl-6 overflow-y-auto">
                                {activeTab === 'destination' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-base font-medium text-gray-900">Publication Destination</label>
                                            <p className="text-sm text-gray-500 mb-4">Choose where this article will be published.</p>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                {[
                                                    { id: 'CURRENT_ISSUE', label: 'Current Issue', desc: 'Publish in the active issue' },
                                                    { id: 'PAST_ISSUE', label: 'Past Issue', desc: 'Backdate to a previous issue' },
                                                    { id: 'CONFERENCE', label: 'Conference', desc: 'Publish in proceedings' },
                                                    { id: 'ONLINE_FIRST', label: 'Online First', desc: 'Publish ahead of print' }
                                                ].map((option) => (
                                                    <div
                                                        key={option.id}
                                                        className={`relative rounded-lg border p-4 cursor-pointer hover:border-indigo-300 transition-all ${destination === option.id ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 'border-gray-300'
                                                            }`}
                                                        onClick={() => setDestination(option.id as any)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${destination === option.id ? 'border-indigo-600' : 'border-gray-300'
                                                                    }`}>
                                                                    {destination === option.id && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                                                                </div>
                                                                <div className="ml-3">
                                                                    <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                                                                    <span className="block text-xs text-gray-500">{option.desc}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {(destination === 'CURRENT_ISSUE' || destination === 'PAST_ISSUE') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Issue</label>
                                                <select
                                                    value={selectedIssueId}
                                                    onChange={(e) => setSelectedIssueId(e.target.value)}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="">Select an issue...</option>
                                                    {issues.map((issue) => (
                                                        <option key={issue.id} value={issue.id}>
                                                            Vol {issue.volume}, No {issue.number} ({issue.year}) {issue.isCurrent ? '(Current)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {destination === 'CONFERENCE' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Conference</label>
                                                <select
                                                    value={selectedConferenceId}
                                                    onChange={(e) => setSelectedConferenceId(e.target.value)}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="">Select a conference...</option>
                                                    {conferences.map((conf) => (
                                                        <option key={conf.id} value={conf.id}>
                                                            {conf.name} ({conf.year})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'metadata' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Article Title</label>
                                            <input
                                                type="text"
                                                value={metadata.title}
                                                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Abstract</label>
                                            <textarea
                                                rows={6}
                                                value={metadata.abstract}
                                                onChange={(e) => setMetadata({ ...metadata, abstract: e.target.value })}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Keywords (comma separated)</label>
                                            <input
                                                type="text"
                                                value={metadata.keywords.join(', ')}
                                                onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value.split(',').map(k => k.trim()) })}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Manuscript Type</label>
                                            <select
                                                value={metadata.manuscriptType}
                                                onChange={(e) => setMetadata({ ...metadata, manuscriptType: e.target.value })}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            >
                                                <option value="Research Article">Research Article</option>
                                                <option value="Review Article">Review Article</option>
                                                <option value="Case Study">Case Study</option>
                                                <option value="Editorial">Editorial</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'authors' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-medium text-gray-900">Authors List</h4>
                                            <button className="text-sm text-indigo-600 hover:text-indigo-500">
                                                + Add Author
                                            </button>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                            {metadata.authors.map((author, index) => (
                                                <div key={index} className="flex items-start space-x-4 p-3 bg-white rounded border border-gray-200">
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500">First Name</label>
                                                            <input
                                                                type="text"
                                                                value={author.firstName}
                                                                onChange={(e) => {
                                                                    const newAuthors = [...metadata.authors];
                                                                    newAuthors[index].firstName = e.target.value;
                                                                    setMetadata({ ...metadata, authors: newAuthors });
                                                                }}
                                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500">Last Name</label>
                                                            <input
                                                                type="text"
                                                                value={author.lastName}
                                                                onChange={(e) => {
                                                                    const newAuthors = [...metadata.authors];
                                                                    newAuthors[index].lastName = e.target.value;
                                                                    setMetadata({ ...metadata, authors: newAuthors });
                                                                }}
                                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-medium text-gray-500">Affiliation</label>
                                                            <input
                                                                type="text"
                                                                value={author.affiliation || ''}
                                                                onChange={(e) => {
                                                                    const newAuthors = [...metadata.authors];
                                                                    newAuthors[index].affiliation = e.target.value;
                                                                    setMetadata({ ...metadata, authors: newAuthors });
                                                                }}
                                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col space-y-2 pt-6">
                                                        <button className="text-gray-400 hover:text-gray-600">
                                                            <ArrowUp className="h-4 w-4" />
                                                        </button>
                                                        <button className="text-gray-400 hover:text-gray-600">
                                                            <ArrowDown className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'citation' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Volume</label>
                                                <input
                                                    type="number"
                                                    value={citation.volume}
                                                    readOnly
                                                    className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Issue</label>
                                                <input
                                                    type="number"
                                                    value={citation.issue}
                                                    readOnly
                                                    className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Page Numbers</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 123-145"
                                                    value={citation.pages}
                                                    onChange={(e) => setCitation({ ...citation, pages: e.target.value })}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Article Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. e01234"
                                                    value={citation.articleNumber}
                                                    onChange={(e) => setCitation({ ...citation, articleNumber: e.target.value })}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-4">SEO & Metadata</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Meta Description</label>
                                                    <textarea
                                                        rows={3}
                                                        value={seo.metaDescription}
                                                        onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        placeholder="Brief description for search engines..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Canonical URL</label>
                                                    <input
                                                        type="text"
                                                        value={seo.canonicalUrl}
                                                        onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        placeholder="Override default URL..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'visibility' && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium text-gray-900">Article Page Elements</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { key: 'showTitle', label: 'Show Title' },
                                                    { key: 'showAuthors', label: 'Show Authors' },
                                                    { key: 'showAbstract', label: 'Show Abstract' },
                                                    { key: 'showKeywords', label: 'Show Keywords' },
                                                    { key: 'showDOI', label: 'Show DOI' },
                                                    { key: 'showPublicationDate', label: 'Show Date' },
                                                    { key: 'showViews', label: 'Show View Count' },
                                                    { key: 'showDownloads', label: 'Show Download Count' }
                                                ].map((item) => (
                                                    <div key={item.key} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={(settings as any)[item.key]}
                                                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                        />
                                                        <label className="ml-2 block text-sm text-gray-900">
                                                            {item.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-4">Indexing & Access</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex-grow flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">Private Article</span>
                                                        <span className="text-sm text-gray-500">Hide from public view (e.g. for embargo)</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSettings({ ...settings, isPrivate: !settings.isPrivate })}
                                                        className={`${settings.isPrivate ? 'bg-indigo-600' : 'bg-gray-200'
                                                            } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                                                    >
                                                        <span className={`${settings.isPrivate ? 'translate-x-5' : 'translate-x-0'
                                                            } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.enableGoogleScholar}
                                                        onChange={(e) => setSettings({ ...settings, enableGoogleScholar: e.target.checked })}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    />
                                                    <label className="ml-2 block text-sm text-gray-900">Enable Google Scholar Indexing</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'review' && (
                                    <div className="space-y-6">
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-700">
                                                        Please review all settings before publishing. Once published, the article will be visible to the public immediately unless marked as private.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="px-4 py-5 sm:p-6">
                                                <h3 className="text-lg leading-6 font-medium text-gray-900">Summary</h3>
                                                <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                                    <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                                                        <dt className="text-sm font-medium text-gray-500 truncate">Destination</dt>
                                                        <dd className="mt-1 text-xl font-semibold text-gray-900">{destination.replace('_', ' ')}</dd>
                                                    </div>
                                                    <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                                                        <dt className="text-sm font-medium text-gray-500 truncate">DOI</dt>
                                                        <dd className="mt-1 text-sm font-semibold text-gray-900">{submission.doi || 'Will be generated'}</dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4">
                                            <div className="flex items-center">
                                                <input
                                                    id="publish_immediately"
                                                    type="checkbox"
                                                    checked={options.publishImmediately}
                                                    onChange={(e) => setOptions({ ...options, publishImmediately: e.target.checked })}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="publish_immediately" className="ml-2 block text-sm text-gray-900">
                                                    Publish Immediately
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    id="featured"
                                                    type="checkbox"
                                                    checked={options.featuredArticle}
                                                    onChange={(e) => setOptions({ ...options, featuredArticle: e.target.checked })}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                                                    Mark as Featured Article
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={submitting}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                            >
                                {submitting ? 'Publishing...' : 'Publish Now'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublishArticleModal;
