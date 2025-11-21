import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface PublicationDestination {
    destination: 'CURRENT_ISSUE' | 'PAST_ISSUE' | 'CONFERENCE' | 'ONLINE_FIRST';
    issueId?: string;
    conferenceId?: string;
    pages?: string;
}

export interface PublicationSettings {
    showTitle: boolean;
    showAuthors: boolean;
    showAbstract: boolean;
    showKeywords: boolean;
    showPublicationDate: boolean;
    showDOI: boolean;
    showConflicts: boolean;
    showFunding: boolean;
    showHistory: boolean;
    showReferences: boolean;
    showOrcid: boolean;
    enablePdfDownload: boolean;
    pdfWatermark?: string;
    showInlinePdf: boolean;
    showInTOC: boolean;
    showSequenceNo: boolean;
    showPageNumbers: boolean;
    addToSearchIndex: boolean;
    includeInSitemap: boolean;
    includeInOAIPMH: boolean;
    includeInRSS: boolean;
    enableGoogleScholar: boolean;
    embargoUntil?: string;

    // SEO & Metadata
    metaDescription?: string;
    canonicalUrl?: string;
    ogImage?: string;

    // Additional Visibility
    showViews: boolean;
    showDownloads: boolean;
    isPrivate: boolean;
}

export interface PublicationOptions {
    scheduledPublishAt?: string;
    publishImmediately: boolean;
    requiresApproval: boolean;
    showOnHomepage: boolean;
    featuredArticle: boolean;
}

export interface AuthorData {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    affiliation?: string;
    isCorresponding?: boolean;
    order: number;
}

export interface PublishArticleData extends PublicationDestination, PublicationOptions {
    settings: PublicationSettings;

    // Metadata
    title?: string;
    abstract?: string;
    keywords?: string[];
    manuscriptType?: string;
    authors?: AuthorData[];

    // Citation
    articleNumber?: string;
}

const publicationService = {
    // Get submissions ready to publish
    async getReadyToPublish() {
        const response = await axios.get(`${API_URL}/publication/ready`);
        return response.data;
    },

    // Get available publication destinations
    async getPublicationDestinations() {
        const response = await axios.get(`${API_URL}/publication/destinations`);
        return response.data;
    },

    // Get publication preview
    async getPublicationPreview(submissionId: string) {
        const response = await axios.get(`${API_URL}/publication/preview/${submissionId}`);
        return response.data;
    },

    // Publish article
    async publishArticle(submissionId: string, data: PublishArticleData) {
        const response = await axios.post(`${API_URL}/publication/publish/${submissionId}`, data);
        return response.data;
    },

    // Unpublish article
    async unpublishArticle(submissionId: string) {
        const response = await axios.post(`${API_URL}/publication/unpublish/${submissionId}`);
        return response.data;
    }
};

export default publicationService;
