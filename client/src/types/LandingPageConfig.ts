export interface LandingPageHero {
    badgeText: string;
    title: string;
    subtitle: string;
    backgroundImage?: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
    metrics: {
        label: string;
        value: string;
    }[];
}

export interface LandingPageFeatures {
    heading: string;
    subheading: string;
    items: {
        icon: string;
        title: string;
        description: string;
    }[];
}

export interface LandingPageCTA {
    title: string;
    subtitle: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
    contactInfo: {
        icon: string;
        text: string;
    }[];
}

export interface LandingPageCallForPapers {
    badgeText: string;
    title: string;
    subtitle: string;
    submissionDeadline: string;
    reviewTime: string;
    buttonText: string;
    buttonLink: string;
    statsBox: {
        value: string;
        label: string;
        sublabel: string;
    };
}

export interface LandingPageLatestResearch {
    heading: string;
    subheading: string;
    viewAllText: string;
}

export interface LandingPageAnnouncement {
    badgeText: string;
    message: string;
    deadline: string;
    email: string;
    phone: string;
}

export interface LandingPageFooter {
    journalName: string;
    journalTagline: string;
    description: string;
    email: string;
    phone: string;
    quickLinks: { name: string; href: string }[];
    authorLinks: { name: string; href: string }[];
    downloads: { name: string; href: string }[];
    editorAddress: {
        title: string;
        name: string;
        address: string[];
    };
    adminAddress: {
        title: string;
        address: string[];
    };
    copyrightText: string;
    bottomLinks: { name: string; href: string }[];
}

export interface LandingPageConfig {
    hero: LandingPageHero;
    features: LandingPageFeatures;
    callForPapers: LandingPageCallForPapers;
    latestResearch: LandingPageLatestResearch;
    cta: LandingPageCTA;
    announcementBar: LandingPageAnnouncement;
    footer: LandingPageFooter;
}
