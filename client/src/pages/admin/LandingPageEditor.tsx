import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye, Layout, Palette, FileText, Megaphone, Sparkles, TrendingUp, BookOpen, ExternalLink, Bell } from 'lucide-react';
import Button from '../../components/ui/Button';
import ImageUploader from '../../components/ui/ImageUploader';
import adminService from '../../services/adminService';
import { publicService } from '../../services/publicService';
import { LandingPageConfig } from '../../types/LandingPageConfig';

const LandingPageEditor: React.FC = () => {
    const [config, setConfig] = useState<LandingPageConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'callForPapers' | 'latestResearch' | 'cta' | 'announcements' | 'footer'>('hero');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);

    // Default configuration
    const defaultConfig: LandingPageConfig = {
        hero: {
            badgeText: 'Peer-Reviewed Academic Journal',
            title: 'Advancing Knowledge in Engineering & Management',
            subtitle: 'IJATEM (ISSN 2583-7052) bridges the gap between theoretical innovation and practical application. Join a global community of researchers.',
            backgroundImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
            primaryButtonText: 'Submit Manuscript',
            primaryButtonLink: '/submit-paper',
            secondaryButtonText: 'Browse Latest Issue',
            secondaryButtonLink: '/current-issue',
            metrics: [
                { label: 'ISSN Number', value: '2583-7052' },
                { label: 'Publication', value: 'Monthly' },
                { label: 'Access', value: 'Open' },
                { label: 'Reach', value: 'Global' }
            ]
        },
        features: {
            heading: 'Why Publish With Us?',
            subheading: 'We are committed to disseminating high-quality research with speed, efficiency, and global impact.',
            items: [
                {
                    icon: 'FileText',
                    title: 'Open Access',
                    description: 'All articles are freely available to read, download, and share worldwide.'
                },
                {
                    icon: 'Users',
                    title: 'Peer Review',
                    description: 'Rigorous double-blind peer review process ensures quality and integrity.'
                },
                {
                    icon: 'Award',
                    title: 'Indexed',
                    description: 'Indexed in major databases for maximum visibility and impact.'
                },
                {
                    icon: 'TrendingUp',
                    title: 'Fast Publication',
                    description: 'Efficient editorial process with quick turnaround times.'
                }
            ]
        },
        callForPapers: {
            badgeText: 'Call for Papers Open',
            title: 'Volume IV, Issue 11',
            subtitle: 'November 2025 Edition',
            submissionDeadline: '30th November 2025',
            reviewTime: 'Decision in 10 days',
            buttonText: 'Submit Manuscript Now',
            buttonLink: '/submit-paper',
            statsBox: {
                value: '10',
                label: 'Days',
                sublabel: 'Average Review Time'
            }
        },
        latestResearch: {
            heading: 'Latest Research',
            subheading: 'Explore our most recent publications and findings.',
            viewAllText: 'View All Articles'
        },
        cta: {
            title: 'Ready to Publish Your Work?',
            subtitle: 'Join our growing community of authors and researchers. Submit your manuscript today for a fast, fair, and constructive review process.',
            primaryButtonText: 'Start Submission',
            primaryButtonLink: '/submit-paper',
            secondaryButtonText: 'Read Guidelines',
            secondaryButtonLink: '/author-guidelines',
            contactInfo: [
                { icon: '📧', text: 'submit.ijatem@gmail.com' },
                { icon: '⚡', text: 'Fast Review Process' },
                { icon: '🌍', text: 'International Reach' }
            ]
        },
        announcementBar: {
            badgeText: 'New',
            message: 'Call for Papers: Vol IV, Issue 11',
            deadline: '30th Nov',
            email: 'submit.ijatem@gmail.com',
            phone: '+91 98405 11458'
        },
        footer: {
            journalName: 'GEMIJ',
            journalTagline: 'International Journal',
            description: 'A premier peer-reviewed international journal dedicated to advancing knowledge in engineering and management disciplines.',
            email: 'submit.ijatem@gmail.com',
            phone: '+91 98405 11458',
            quickLinks: [
                { name: 'About Us', href: '/about' },
                { name: 'Aim and Scope', href: '/aim-scope' },
                { name: 'Editorial Board', href: '/editorial-board' },
                { name: 'Author Guidelines', href: '/author-guidelines' },
                { name: 'Call For Paper', href: '/call-for-paper' },
                { name: 'Contact Us', href: '/contact' }
            ],
            authorLinks: [
                { name: 'Payment Information', href: '/payment-information' },
                { name: 'Publication Ethics', href: '/publication-ethics' },
                { name: 'Make Online Payment', href: '/make-payment' }
            ],
            downloads: [
                { name: 'Paper Template', href: '/paper-template.docx' },
                { name: 'Copyright Form', href: '/copyright-form.pdf' }
            ],
            editorAddress: {
                title: 'Editor in Chief',
                name: 'Er.KAVIN K S',
                address: [
                    '5-51, Thattan Vilai, North Soorankudy Post,',
                    'Nagercoil, Kanyakumari District,',
                    'Tamilnadu, India-629501'
                ]
            },
            adminAddress: {
                title: 'Administrative Office',
                address: [
                    '14, Third Floor, Prajam Complex,',
                    'S. T. Hindu College Road,',
                    'Chettikulam, Nagercoil - 629002.'
                ]
            },
            copyrightText: 'GEMIJ',
            bottomLinks: [
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Sitemap', href: '/sitemap' }
            ]
        }
    };

    const templates = {
        professional: {
            name: 'Professional',
            description: 'Clean, corporate design',
            config: defaultConfig
        },
        modern: {
            name: 'Modern',
            description: 'Vibrant, contemporary style',
            config: {
                ...defaultConfig,
                hero: {
                    ...defaultConfig.hero,
                    title: '🚀 Innovate. Publish. Impact.',
                    subtitle: 'Join the future of academic publishing with IJATEM - where cutting-edge research meets global visibility.',
                }
            }
        },
        academic: {
            name: 'Academic',
            description: 'Traditional, scholarly look',
            config: {
                ...defaultConfig,
                hero: {
                    ...defaultConfig.hero,
                    title: 'International Journal of Advanced Technology in Engineering and Management',
                    subtitle: 'A peer-reviewed academic journal dedicated to advancing knowledge in engineering and management sciences.',
                }
            }
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const data = await publicService.getLandingPageConfig();
            if (data) {
                // Robust deep merge to ensure all fields exist
                const mergedConfig: LandingPageConfig = {
                    hero: {
                        ...defaultConfig.hero,
                        ...(data.hero || {}),
                        // Ensure metrics array exists
                        metrics: data.hero?.metrics || defaultConfig.hero.metrics
                    },
                    features: Array.isArray(data.features)
                        ? { ...defaultConfig.features, items: data.features }
                        : { ...defaultConfig.features, ...(data.features || {}) },
                    callForPapers: {
                        ...defaultConfig.callForPapers,
                        ...(data.callForPapers || {}),
                        // Ensure nested statsBox exists and has all fields
                        statsBox: {
                            ...defaultConfig.callForPapers.statsBox,
                            ...(data.callForPapers?.statsBox || {})
                        }
                    },
                    latestResearch: {
                        ...defaultConfig.latestResearch,
                        ...(data.latestResearch || {})
                    },
                    cta: {
                        ...defaultConfig.cta,
                        ...(data.cta || {})
                    },
                    announcementBar: {
                        ...defaultConfig.announcementBar,
                        ...(data.announcementBar || {})
                    },
                    footer: {
                        ...defaultConfig.footer,
                        ...(data.footer || {}),
                        quickLinks: data.footer?.quickLinks || defaultConfig.footer.quickLinks,
                        authorLinks: data.footer?.authorLinks || defaultConfig.footer.authorLinks,
                        downloads: data.footer?.downloads || defaultConfig.footer.downloads,
                        editorAddress: {
                            ...defaultConfig.footer.editorAddress,
                            ...(data.footer?.editorAddress || {}),
                            address: data.footer?.editorAddress?.address || defaultConfig.footer.editorAddress.address
                        },
                        adminAddress: {
                            ...defaultConfig.footer.adminAddress,
                            ...(data.footer?.adminAddress || {}),
                            address: data.footer?.adminAddress?.address || defaultConfig.footer.adminAddress.address
                        },
                        bottomLinks: data.footer?.bottomLinks || defaultConfig.footer.bottomLinks
                    }
                };

                setConfig(mergedConfig);
            } else {
                setConfig(defaultConfig);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            setConfig(defaultConfig);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;

        try {
            setSaving(true);
            setMessage(null);
            await adminService.updateLandingPageConfig(config);
            setMessage({ type: 'success', text: '✓ Changes saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ type: 'error', text: '✗ Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Reset to default configuration? This will discard all your changes.')) {
            setConfig(defaultConfig);
            setMessage({ type: 'success', text: 'Reset to default configuration' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const applyTemplate = (templateKey: keyof typeof templates) => {
        setConfig(templates[templateKey].config);
        setShowTemplates(false);
        setMessage({ type: 'success', text: `Applied ${templates[templateKey].name} template` });
        setTimeout(() => setMessage(null), 3000);
    };

    const updateHero = (field: string, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            hero: { ...config.hero, [field]: value }
        });
    };

    const updateMetric = (index: number, field: 'label' | 'value', value: string) => {
        if (!config) return;
        const newMetrics = [...config.hero.metrics];
        newMetrics[index] = { ...newMetrics[index], [field]: value };
        setConfig({
            ...config,
            hero: { ...config.hero, metrics: newMetrics }
        });
    };

    const updateFeatures = (field: string, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            features: { ...config.features, [field]: value }
        });
    };

    const updateFeatureItem = (index: number, field: string, value: string) => {
        if (!config) return;
        const newItems = [...config.features.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setConfig({
            ...config,
            features: { ...config.features, items: newItems }
        });
    };

    const updateCallForPapers = (field: string, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            callForPapers: { ...config.callForPapers, [field]: value }
        });
    };

    const updateCallForPapersStats = (field: string, value: string) => {
        if (!config) return;
        setConfig({
            ...config,
            callForPapers: {
                ...config.callForPapers,
                statsBox: { ...config.callForPapers.statsBox, [field]: value }
            }
        });
    };

    const updateLatestResearch = (field: string, value: string) => {
        if (!config) return;
        setConfig({
            ...config,
            latestResearch: { ...config.latestResearch, [field]: value }
        });
    };

    const updateCTA = (field: string, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            cta: { ...config.cta, [field]: value }
        });
    };

    const updateContactInfo = (index: number, field: 'icon' | 'text', value: string) => {
        if (!config) return;
        const newContactInfo = [...config.cta.contactInfo];
        newContactInfo[index] = { ...newContactInfo[index], [field]: value };
        setConfig({
            ...config,
            cta: { ...config.cta, contactInfo: newContactInfo }
        });
    };

    const updateAnnouncement = (field: string, value: string) => {
        if (!config) return;
        setConfig({
            ...config,
            announcementBar: { ...config.announcementBar, [field]: value }
        });
    };

    const updateFooter = (field: string, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            footer: { ...config.footer, [field]: value }
        });
    };

    const updateFooterLink = (type: 'quickLinks' | 'authorLinks' | 'downloads' | 'bottomLinks', index: number, field: 'name' | 'href', value: string) => {
        if (!config) return;
        const newLinks = [...config.footer[type]];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setConfig({
            ...config,
            footer: { ...config.footer, [type]: newLinks }
        });
    };

    const updateFooterAddress = (type: 'editorAddress' | 'adminAddress', field: string, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            footer: {
                ...config.footer,
                [type]: { ...config.footer[type], [field]: value }
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading editor...</p>
                </div>
            </div>
        );
    }

    if (!config) return null;

    const tabs = [
        { id: 'hero' as const, label: 'Hero Section', icon: Layout },
        { id: 'announcements' as const, label: 'Announcements', icon: Bell },
        { id: 'features' as const, label: 'Features', icon: Sparkles },
        { id: 'callForPapers' as const, label: 'Call for Papers', icon: Megaphone },
        { id: 'latestResearch' as const, label: 'Latest Research', icon: BookOpen },
        { id: 'cta' as const, label: 'Call to Action', icon: TrendingUp },
        { id: 'footer' as const, label: 'Footer', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Palette className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Landing Page Editor</h1>
                        <p className="text-xs text-slate-500">Customize your journal's public face</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Layout className="w-4 h-4" />
                            Templates
                        </button>

                        {showTemplates && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Select Template</div>
                                {Object.entries(templates).map(([key, template]) => (
                                    <button
                                        key={key}
                                        onClick={() => applyTemplate(key as keyof typeof templates)}
                                        className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors group"
                                    >
                                        <div className="font-medium text-slate-900 group-hover:text-blue-700">{template.name}</div>
                                        <div className="text-xs text-slate-500">{template.description}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={() => window.open('/', '_blank')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Live Site
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`mt-4 mx-6 px-4 py-3 rounded-lg border ${message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'} flex items-center justify-center font-medium animate-in slide-in-from-top-2`}
                >
                    {message.text}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Panel - Editor Controls */}
                <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-slate-100 p-2 gap-1 scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {activeTab === 'hero' && (
                            <HeroEditor config={config} updateHero={updateHero} updateMetric={updateMetric} />
                        )}
                        {activeTab === 'announcements' && (
                            <AnnouncementEditor config={config} updateAnnouncement={updateAnnouncement} />
                        )}
                        {activeTab === 'features' && (
                            <FeaturesEditor config={config} updateFeatures={updateFeatures} updateFeatureItem={updateFeatureItem} />
                        )}
                        {activeTab === 'callForPapers' && (
                            <CallForPapersEditor config={config} updateCallForPapers={updateCallForPapers} updateCallForPapersStats={updateCallForPapersStats} />
                        )}
                        {activeTab === 'latestResearch' && (
                            <LatestResearchEditor config={config} updateLatestResearch={updateLatestResearch} />
                        )}
                        {activeTab === 'cta' && (
                            <CTAEditor config={config} updateCTA={updateCTA} updateContactInfo={updateContactInfo} />
                        )}
                        {activeTab === 'footer' && (
                            <FooterEditor config={config} updateFooter={updateFooter} updateFooterLink={updateFooterLink} updateFooterAddress={updateFooterAddress} />
                        )}
                    </div>
                </div>

                {/* Right Panel - Live Preview */}
                <div className="flex-1 bg-slate-200 rounded-2xl border border-slate-300 overflow-hidden flex flex-col shadow-inner">
                    <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div className="ml-4 bg-slate-700 px-3 py-1 rounded text-xs text-slate-400 font-mono flex items-center gap-2">
                                <span className="text-green-400">🔒</span> gemij.com
                            </div>
                        </div>
                        <span className="font-medium text-slate-400 text-xs uppercase tracking-wider">Live Preview</span>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar relative">
                        <LivePreview config={config} activeSection={activeTab} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components for Editor Sections ---

const HeroEditor: React.FC<{ config: LandingPageConfig; updateHero: (field: string, value: any) => void; updateMetric: (index: number, field: 'label' | 'value', value: string) => void }> = ({ config, updateHero, updateMetric }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-600 mb-6">
            <p className="text-sm text-blue-900 font-medium">👋 Editing Hero Section - The first thing visitors see</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Badge Text</label>
            <input
                type="text"
                value={config.hero.badgeText}
                onChange={(e) => updateHero('badgeText', e.target.value)}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Main Title</label>
            <textarea
                value={config.hero.title}
                onChange={(e) => updateHero('title', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-lg"
            />
            <p className="text-xs text-slate-500 mt-1">Tip: "Engineering & Management" will automatically get the gradient effect.</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
            <textarea
                value={config.hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Background Image URL</label>
            <ImageUploader
                value={config.hero.backgroundImage || ''}
                onChange={(url) => updateHero('backgroundImage', url)}
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Primary Button</label>
                <input
                    type="text"
                    value={config.hero.primaryButtonText}
                    onChange={(e) => updateHero('primaryButtonText', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Link</label>
                <input
                    type="text"
                    value={config.hero.primaryButtonLink}
                    onChange={(e) => updateHero('primaryButtonLink', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Key Metrics</label>
            <div className="space-y-3">
                {config.hero.metrics.map((metric, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <input
                            type="text"
                            value={metric.label}
                            onChange={(e) => updateMetric(index, 'label', e.target.value)}
                            placeholder="Label"
                            className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all bg-white"
                        />
                        <input
                            type="text"
                            value={metric.value}
                            onChange={(e) => updateMetric(index, 'value', e.target.value)}
                            placeholder="Value"
                            className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-all bg-white"
                        />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const AnnouncementEditor: React.FC<{ config: LandingPageConfig; updateAnnouncement: (field: string, value: string) => void }> = ({ config, updateAnnouncement }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border-l-4 border-slate-500 mb-6">
            <p className="text-sm text-slate-100 font-medium">📢 Editing Announcement Bar - Top of the page marquee</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Badge Text (e.g., NEW)</label>
            <input
                type="text"
                value={config.announcementBar.badgeText}
                onChange={(e) => updateAnnouncement('badgeText', e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Main Message</label>
            <input
                type="text"
                value={config.announcementBar.message}
                onChange={(e) => updateAnnouncement('message', e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                placeholder="e.g., Call for Papers: Vol IV, Issue 11"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Deadline Text</label>
            <input
                type="text"
                value={config.announcementBar.deadline}
                onChange={(e) => updateAnnouncement('deadline', e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                placeholder="e.g., 30th Nov"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Contact Email</label>
            <input
                type="text"
                value={config.announcementBar.email}
                onChange={(e) => updateAnnouncement('email', e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
            <input
                type="text"
                value={config.announcementBar.phone}
                onChange={(e) => updateAnnouncement('phone', e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            />
        </div>
    </div>
);

const FeaturesEditor: React.FC<{ config: LandingPageConfig; updateFeatures: (field: string, value: any) => void; updateFeatureItem: (index: number, field: string, value: string) => void }> = ({ config, updateFeatures, updateFeatureItem }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border-l-4 border-slate-600 mb-6">
            <p className="text-sm text-slate-900 font-medium">⭐ Editing Features - Why researchers choose you</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Section Heading</label>
            <input
                type="text"
                value={config.features.heading}
                onChange={(e) => updateFeatures('heading', e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Section Subheading</label>
            <textarea
                value={config.features.subheading}
                onChange={(e) => updateFeatures('subheading', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Feature Items</label>
            <div className="space-y-4">
                {config.features.items.map((item, index) => (
                    <div key={index} className="p-4 bg-white rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase">Feature {index + 1}</span>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-xs text-slate-500 mb-1">Icon Name</label>
                                    <input
                                        type="text"
                                        value={item.icon}
                                        onChange={(e) => updateFeatureItem(index, 'icon', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        placeholder="e.g. FileText"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs text-slate-500 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => updateFeatureItem(index, 'title', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Description</label>
                                <textarea
                                    value={item.description}
                                    onChange={(e) => updateFeatureItem(index, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const CallForPapersEditor: React.FC<{ config: LandingPageConfig; updateCallForPapers: (field: string, value: any) => void; updateCallForPapersStats: (field: string, value: string) => void }> = ({ config, updateCallForPapers, updateCallForPapersStats }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border-l-4 border-red-500 mb-6">
            <p className="text-sm text-red-900 font-medium">📢 Editing Call for Papers - Encourage submissions</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Badge Text</label>
            <input
                type="text"
                value={config.callForPapers.badgeText}
                onChange={(e) => updateCallForPapers('badgeText', e.target.value)}
                className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
                type="text"
                value={config.callForPapers.title}
                onChange={(e) => updateCallForPapers('title', e.target.value)}
                className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
            <input
                type="text"
                value={config.callForPapers.subtitle}
                onChange={(e) => updateCallForPapers('subtitle', e.target.value)}
                className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Submission Deadline</label>
                <input
                    type="text"
                    value={config.callForPapers.submissionDeadline}
                    onChange={(e) => updateCallForPapers('submissionDeadline', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Review Time Text</label>
                <input
                    type="text"
                    value={config.callForPapers.reviewTime}
                    onChange={(e) => updateCallForPapers('reviewTime', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Button Text</label>
                <input
                    type="text"
                    value={config.callForPapers.buttonText}
                    onChange={(e) => updateCallForPapers('buttonText', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Button Link</label>
                <input
                    type="text"
                    value={config.callForPapers.buttonLink}
                    onChange={(e) => updateCallForPapers('buttonLink', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
            </div>
        </div>

        <div className="border-t border-red-100 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-3">Stats Box (Right Side)</label>
            <div className="grid grid-cols-3 gap-3 p-3 bg-red-50 rounded-lg border-2 border-red-200">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Big Number</label>
                    <input
                        type="text"
                        value={config.callForPapers.statsBox.value}
                        onChange={(e) => updateCallForPapersStats('value', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Label</label>
                    <input
                        type="text"
                        value={config.callForPapers.statsBox.label}
                        onChange={(e) => updateCallForPapersStats('label', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Sublabel</label>
                    <input
                        type="text"
                        value={config.callForPapers.statsBox.sublabel}
                        onChange={(e) => updateCallForPapersStats('sublabel', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white"
                    />
                </div>
            </div>
        </div>
    </div>
);

const LatestResearchEditor: React.FC<{ config: LandingPageConfig; updateLatestResearch: (field: string, value: string) => void }> = ({ config, updateLatestResearch }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border-l-4 border-blue-600 mb-6">
            <p className="text-sm text-blue-900 font-medium">📚 Editing Latest Research - Showcase your content</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Section Heading</label>
            <input
                type="text"
                value={config.latestResearch.heading}
                onChange={(e) => updateLatestResearch('heading', e.target.value)}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Section Subheading (optional)</label>
            <textarea
                value={config.latestResearch.subheading}
                onChange={(e) => updateLatestResearch('subheading', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Displays below the heading..."
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">View All Button Text</label>
            <input
                type="text"
                value={config.latestResearch.viewAllText}
                onChange={(e) => updateLatestResearch('viewAllText', e.target.value)}
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
        </div>
    </div>
);

const CTAEditor: React.FC<{ config: LandingPageConfig; updateCTA: (field: string, value: any) => void; updateContactInfo: (index: number, field: 'icon' | 'text', value: string) => void }> = ({ config, updateCTA, updateContactInfo }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border-l-4 border-slate-600 mb-6">
            <p className="text-sm text-slate-100 font-medium">🎯 Editing Call to Action - Final conversion push</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
                type="text"
                value={config.cta.title}
                onChange={(e) => updateCTA('title', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
            <textarea
                value={config.cta.subtitle}
                onChange={(e) => updateCTA('subtitle', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all"
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Primary Button Text</label>
                <input
                    type="text"
                    value={config.cta.primaryButtonText}
                    onChange={(e) => updateCTA('primaryButtonText', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Primary Button Link</label>
                <input
                    type="text"
                    value={config.cta.primaryButtonLink}
                    onChange={(e) => updateCTA('primaryButtonLink', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all"
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Button Text</label>
                <input
                    type="text"
                    value={config.cta.secondaryButtonText}
                    onChange={(e) => updateCTA('secondaryButtonText', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Button Link</label>
                <input
                    type="text"
                    value={config.cta.secondaryButtonLink}
                    onChange={(e) => updateCTA('secondaryButtonLink', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-400 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all"
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Contact Information</label>
            <div className="space-y-3">
                {config.cta.contactInfo.map((info, index) => (
                    <div key={index} className="grid grid-cols-[80px_1fr] gap-3 p-3 bg-slate-100 rounded-lg border-2 border-slate-300">
                        <input
                            type="text"
                            value={info.icon}
                            onChange={(e) => updateContactInfo(index, 'icon', e.target.value)}
                            placeholder="Icon"
                            className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 text-center text-xl transition-all bg-white"
                        />
                        <input
                            type="text"
                            value={info.text}
                            onChange={(e) => updateContactInfo(index, 'text', e.target.value)}
                            placeholder="Text"
                            className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all bg-white"
                        />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const FooterEditor: React.FC<{
    config: LandingPageConfig;
    updateFooter: (field: string, value: any) => void;
    updateFooterLink: (type: 'quickLinks' | 'authorLinks' | 'downloads' | 'bottomLinks', index: number, field: 'name' | 'href', value: string) => void;
    updateFooterAddress: (type: 'editorAddress' | 'adminAddress', field: string, value: any) => void;
}> = ({ config, updateFooter, updateFooterLink, updateFooterAddress }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-4 rounded-xl border-l-4 border-slate-500 mb-6">
            <p className="text-sm text-slate-100 font-medium">📄 Editing Footer - Site-wide footer content</p>
        </div>

        {/* Journal Info */}
        <div className="border-b border-slate-200 pb-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Journal Information</h4>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Journal Name</label>
                        <input
                            type="text"
                            value={config.footer.journalName}
                            onChange={(e) => updateFooter('journalName', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
                        <input
                            type="text"
                            value={config.footer.journalTagline}
                            onChange={(e) => updateFooter('journalTagline', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                        value={config.footer.description}
                        onChange={(e) => updateFooter('description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={config.footer.email}
                            onChange={(e) => updateFooter('email', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                        <input
                            type="tel"
                            value={config.footer.phone}
                            onChange={(e) => updateFooter('phone', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Links */}
        <div className="border-b border-slate-200 pb-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Quick Links</h4>
            <div className="space-y-3">
                {config.footer.quickLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <input
                            type="text"
                            value={link.name}
                            onChange={(e) => updateFooterLink('quickLinks', index, 'name', e.target.value)}
                            placeholder="Link Name"
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                            type="text"
                            value={link.href}
                            onChange={(e) => updateFooterLink('quickLinks', index, 'href', e.target.value)}
                            placeholder="/path"
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>

        {/* Author Links */}
        <div className="border-b border-slate-200 pb-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">For Authors Links</h4>
            <div className="space-y-3">
                {config.footer.authorLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <input
                            type="text"
                            value={link.name}
                            onChange={(e) => updateFooterLink('authorLinks', index, 'name', e.target.value)}
                            placeholder="Link Name"
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                            type="text"
                            value={link.href}
                            onChange={(e) => updateFooterLink('authorLinks', index, 'href', e.target.value)}
                            placeholder="/path"
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>

        {/* Downloads */}
        <div className="border-b border-slate-200 pb-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Downloads</h4>
            <div className="space-y-3">
                {config.footer.downloads.map((download, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <input
                            type="text"
                            value={download.name}
                            onChange={(e) => updateFooterLink('downloads', index, 'name', e.target.value)}
                            placeholder="File Name"
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                            type="text"
                            value={download.href}
                            onChange={(e) => updateFooterLink('downloads', index, 'href', e.target.value)}
                            placeholder="/file.pdf"
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>

        {/* Editor Address */}
        <div className="border-b border-slate-200 pb-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Editor Address</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                    <input
                        type="text"
                        value={config.footer.editorAddress.title}
                        onChange={(e) => updateFooterAddress('editorAddress', 'title', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                    <input
                        type="text"
                        value={config.footer.editorAddress.name}
                        onChange={(e) => updateFooterAddress('editorAddress', 'name', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address Lines</label>
                    {config.footer.editorAddress.address.map((line, index) => (
                        <input
                            key={index}
                            type="text"
                            value={line}
                            onChange={(e) => {
                                const newAddress = [...config.footer.editorAddress.address];
                                newAddress[index] = e.target.value;
                                updateFooterAddress('editorAddress', 'address', newAddress);
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-2"
                            placeholder={`Address Line ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* Admin Address */}
        <div className="border-b border-slate-200 pb-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Administrative Office</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                    <input
                        type="text"
                        value={config.footer.adminAddress.title}
                        onChange={(e) => updateFooterAddress('adminAddress', 'title', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address Lines</label>
                    {config.footer.adminAddress.address.map((line, index) => (
                        <input
                            key={index}
                            type="text"
                            value={line}
                            onChange={(e) => {
                                const newAddress = [...config.footer.adminAddress.address];
                                newAddress[index] = e.target.value;
                                updateFooterAddress('adminAddress', 'address', newAddress);
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-2"
                            placeholder={`Address Line ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* Bottom Links & Copyright */}
        <div>
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Bottom Bar</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Copyright Text</label>
                    <input
                        type="text"
                        value={config.footer.copyrightText}
                        onChange={(e) => updateFooter('copyrightText', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Bottom Links</label>
                    <div className="space-y-3">
                        {config.footer.bottomLinks.map((link, index) => (
                            <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <input
                                    type="text"
                                    value={link.name}
                                    onChange={(e) => updateFooterLink('bottomLinks', index, 'name', e.target.value)}
                                    placeholder="Link Name"
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                />
                                <input
                                    type="text"
                                    value={link.href}
                                    onChange={(e) => updateFooterLink('bottomLinks', index, 'href', e.target.value)}
                                    placeholder="/path"
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const LivePreview: React.FC<{ config: LandingPageConfig; activeSection: string }> = ({ config, activeSection }) => {
    return (
        <div className="space-y-0 bg-slate-50">
            {/* Announcement Bar Preview */}
            <div className="bg-slate-900 text-white py-3 relative overflow-hidden border-b border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900"></div>
                <div className="w-full relative z-10">
                    <div className="flex items-center px-8">
                        <div className="flex items-center gap-x-3 mr-6">
                            <span className="bg-red-600 text-white px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                {config.announcementBar.badgeText}
                            </span>
                            <span className="text-slate-100 font-semibold tracking-wide text-xs whitespace-nowrap">
                                {config.announcementBar.message}
                            </span>
                        </div>
                        <div className="flex items-center gap-x-6 text-slate-200 text-xs uppercase tracking-wider font-medium">
                            <span>Deadline: <span className="text-yellow-400 font-bold">{config.announcementBar.deadline}</span></span>
                            <span className="text-white font-semibold">{config.announcementBar.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Preview */}
            {(activeSection === 'hero' || activeSection === 'latestResearch' || activeSection === 'announcements') && (
                <div className="relative bg-slate-900 text-white py-20 overflow-hidden">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-3xl animate-pulse"></div>
                        <div className="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-3xl animate-pulse"></div>
                    </div>

                    {config.hero.backgroundImage && (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay"
                                style={{ backgroundImage: `url(${config.hero.backgroundImage})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
                        </>
                    )}

                    <div className="relative z-10 px-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-4 backdrop-blur-md">
                            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                            <span className="text-blue-100 text-xs font-medium tracking-wide uppercase">{config.hero.badgeText}</span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight text-white">
                            {config.hero.title ? (
                                <span dangerouslySetInnerHTML={{
                                    __html: config.hero.title.replace(
                                        /Engineering & Management/gi,
                                        '<span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-300% animate-gradient">Engineering & Management</span>'
                                    )
                                }} />
                            ) : (
                                <>
                                    Advancing Knowledge in <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-300% animate-gradient">
                                        Engineering & Management
                                    </span>
                                </>
                            )}
                        </h1>

                        <p className="text-base text-slate-300 mb-6 leading-relaxed max-w-2xl mx-auto font-light">
                            {config.hero.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 text-sm rounded-full font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {config.hero.primaryButtonText}
                            </button>
                            <button className="bg-white/5 hover:bg-white/10 border-white/20 text-white px-6 py-2.5 text-sm rounded-full font-semibold backdrop-blur-sm border">
                                {config.hero.secondaryButtonText}
                            </button>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/10">
                            {config.hero.metrics.map((metric, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-xl md:text-2xl font-bold text-white">{metric.value}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{metric.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Features Preview */}
            {activeSection === 'features' && (
                <div className="py-12 bg-white">
                    <div className="px-6">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{config.features.heading}</h2>
                            <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full mb-3"></div>
                            <p className="text-sm text-slate-600 max-w-xl mx-auto">{config.features.subheading}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {config.features.items.map((feature, i) => (
                                <div key={i} className="group p-4 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl transition-all duration-500">
                                    <div className="w-12 h-12 bg-white text-blue-600 rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                        <span className="text-xl font-bold">{feature.icon.charAt(0)}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Call For Papers Preview */}
            {activeSection === 'callForPapers' && (
                <div className="py-12 bg-slate-50">
                    <div className="px-6">
                        <div className="relative rounded-2xl overflow-hidden bg-white shadow-xl border border-slate-100">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 via-orange-500 to-yellow-500"></div>
                            <div className="p-8 flex flex-col gap-8">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-red-600 font-bold tracking-wide uppercase text-xs mb-4 bg-red-50 px-3 py-1 rounded-full">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                        {config.callForPapers.badgeText}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                                        {config.callForPapers.title} <br />
                                        <span className="text-slate-400 font-medium text-xl">{config.callForPapers.subtitle}</span>
                                    </h2>

                                    <div className="grid grid-cols-1 gap-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Submission Deadline</div>
                                                <div className="text-base font-bold text-slate-900">{config.callForPapers.submissionDeadline}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Fast Review</div>
                                                <div className="text-base font-bold text-slate-900">{config.callForPapers.reviewTime}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg shadow-red-600/20 w-full">
                                        {config.callForPapers.buttonText}
                                    </button>
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                                        <div className="text-4xl font-black text-slate-900 mb-1">{config.callForPapers.statsBox.value}</div>
                                        <div className="text-lg font-bold text-slate-900 mb-0.5">{config.callForPapers.statsBox.label}</div>
                                        <div className="text-xs text-slate-500 font-medium">{config.callForPapers.statsBox.sublabel}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Latest Research Preview */}
            {activeSection === 'latestResearch' && (
                <div className="py-12 bg-white">
                    <div className="px-6">
                        <div className="flex flex-col justify-between items-start mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">{config.latestResearch.heading}</h2>
                                <p className="text-sm text-slate-600">
                                    {config.latestResearch.subheading}
                                </p>
                            </div>
                            <button className="text-blue-600 font-bold text-sm flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                                {config.latestResearch.viewAllText} →
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                                    <div className="mb-4">
                                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                            Original Research
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                                        Sample Article Title {i}: Research on Engineering Management
                                    </h3>
                                    <p className="text-slate-600 text-xs mb-4 line-clamp-2">
                                        This is a preview of how article abstracts will appear. The actual content comes from your published issues.
                                    </p>
                                    <div className="pt-4 border-t border-slate-50">
                                        <button className="w-full text-center py-2 rounded-lg bg-slate-50 text-slate-700 text-sm font-bold">
                                            Read Article
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CTA Preview */}
            {activeSection === 'cta' && (
                <div className="relative bg-slate-900 py-20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent"></div>

                    <div className="relative z-10 px-6 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{config.cta.title}</h2>
                        <p className="text-sm text-slate-300 mb-8 leading-relaxed max-w-xl mx-auto">
                            {config.cta.subtitle}
                        </p>

                        <div className="flex flex-col gap-3 justify-center mb-10">
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 text-sm rounded-xl font-bold shadow-lg shadow-blue-600/20">
                                {config.cta.primaryButtonText}
                            </button>
                            <button className="bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-6 py-3 text-sm rounded-xl font-bold">
                                {config.cta.secondaryButtonText}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 pt-8 border-t border-slate-800/50">
                            {config.cta.contactInfo.map((info, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-2xl mb-2">{info.icon}</div>
                                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">{info.text}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Preview */}
            {activeSection === 'footer' && (
                <div className="bg-slate-900 text-slate-300 py-12">
                    <div className="px-6">
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            {/* Journal Info */}
                            <div>
                                <h3 className="text-white font-bold text-lg mb-2">{config.footer.journalName}</h3>
                                <p className="text-xs text-blue-400 mb-3">{config.footer.journalTagline}</p>
                                <p className="text-xs text-slate-400 mb-4">{config.footer.description}</p>
                                <div className="space-y-2 text-xs">
                                    <div>📧 {config.footer.email}</div>
                                    <div>📞 {config.footer.phone}</div>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div>
                                <h4 className="text-white font-semibold mb-3 text-sm">Quick Links</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {config.footer.quickLinks.slice(0, 4).map((link, i) => (
                                        <div key={i}>• {link.name}</div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Addresses */}
                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-800">
                            <div className="text-xs">
                                <p className="text-white font-medium mb-1">{config.footer.editorAddress.title}</p>
                                <p>{config.footer.editorAddress.name}</p>
                                {config.footer.editorAddress.address.map((line, i) => (
                                    <p key={i} className="text-slate-400">{line}</p>
                                ))}
                            </div>
                            <div className="text-xs">
                                <p className="text-white font-medium mb-1">{config.footer.adminAddress.title}</p>
                                {config.footer.adminAddress.address.map((line, i) => (
                                    <p key={i} className="text-slate-400">{line}</p>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                            <p className="text-xs text-slate-500">© 2024 {config.footer.copyrightText}. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPageEditor;
