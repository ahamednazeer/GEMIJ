import { PrismaClient } from '@prisma/client';
import { create } from 'xmlbuilder2';

const prisma = new PrismaClient();

export class FeedService {
    /**
     * Generate XML Sitemap for all published articles and issues
     */
    static async generateSitemap(): Promise<string> {
        const baseUrl = process.env.JOURNAL_URL || 'http://localhost:3000';

        // Get all published articles
        const articles = await prisma.submission.findMany({
            where: {
                status: 'PUBLISHED',
                publicationSettings: {
                    includeInSitemap: true
                }
            },
            select: {
                id: true,
                doi: true,
                publishedAt: true,
                updatedAt: true
            },
            orderBy: {
                publishedAt: 'desc'
            }
        });

        // Get all published issues
        const issues = await prisma.issue.findMany({
            where: {
                publishedAt: {
                    not: null
                }
            },
            select: {
                id: true,
                publishedAt: true,
                updatedAt: true
            },
            orderBy: {
                publishedAt: 'desc'
            }
        });

        // Build sitemap XML
        const urlset = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('urlset', {
                xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
                'xmlns:news': 'http://www.google.com/schemas/sitemap-news/0.9',
                'xmlns:xhtml': 'http://www.w3.org/1999/xhtml',
                'xmlns:mobile': 'http://www.google.com/schemas/sitemap-mobile/1.0',
                'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1',
                'xmlns:video': 'http://www.google.com/schemas/sitemap-video/1.1'
            });

        // Add homepage
        urlset.ele('url')
            .ele('loc').txt(baseUrl).up()
            .ele('changefreq').txt('daily').up()
            .ele('priority').txt('1.0').up();

        // Add browse issues page
        urlset.ele('url')
            .ele('loc').txt(`${baseUrl}/browse`).up()
            .ele('changefreq').txt('weekly').up()
            .ele('priority').txt('0.8').up();

        // Add articles
        for (const article of articles) {
            const articleUrl = article.doi
                ? `${baseUrl}/article/${article.doi.replace('/', '-')}`
                : `${baseUrl}/article/${article.id}`;

            urlset.ele('url')
                .ele('loc').txt(articleUrl).up()
                .ele('lastmod').txt(article.updatedAt.toISOString()).up()
                .ele('changefreq').txt('monthly').up()
                .ele('priority').txt('0.9').up();
        }

        // Add issues
        for (const issue of issues) {
            urlset.ele('url')
                .ele('loc').txt(`${baseUrl}/issue/${issue.id}`).up()
                .ele('lastmod').txt(issue.updatedAt.toISOString()).up()
                .ele('changefreq').txt('monthly').up()
                .ele('priority').txt('0.7').up();
        }

        return urlset.end({ prettyPrint: true });
    }

    /**
     * Generate RSS 2.0 feed for latest published articles
     */
    static async generateRSS(limit: number = 50): Promise<string> {
        const baseUrl = process.env.JOURNAL_URL || 'http://localhost:3000';
        const journalName = process.env.JOURNAL_NAME || 'Academic Journal';
        const journalDescription = process.env.JOURNAL_DESCRIPTION || 'Latest research articles';

        // Get latest published articles
        const articles = await prisma.submission.findMany({
            where: {
                status: 'PUBLISHED',
                publicationSettings: {
                    includeInRSS: true
                }
            },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                coAuthors: true
            },
            orderBy: {
                publishedAt: 'desc'
            },
            take: limit
        });

        // Build RSS XML
        const rss = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('rss', {
                version: '2.0',
                'xmlns:atom': 'http://www.w3.org/2005/Atom',
                'xmlns:dc': 'http://purl.org/dc/elements/1.1/'
            });

        const channel = rss.ele('channel');

        channel.ele('title').txt(journalName).up();
        channel.ele('link').txt(baseUrl).up();
        channel.ele('description').txt(journalDescription).up();
        channel.ele('language').txt('en').up();
        channel.ele('lastBuildDate').txt(new Date().toUTCString()).up();
        channel.ele('atom:link', {
            href: `${baseUrl}/feeds/rss`,
            rel: 'self',
            type: 'application/rss+xml'
        }).up();

        // Add articles as items
        for (const article of articles) {
            const articleUrl = article.doi
                ? `${baseUrl}/article/${article.doi.replace('/', '-')}`
                : `${baseUrl}/article/${article.id}`;

            const authors = [
                `${article.author.firstName} ${article.author.lastName}`,
                ...article.coAuthors.map(ca => `${ca.firstName} ${ca.lastName}`)
            ].join(', ');

            const item = channel.ele('item');
            item.ele('title').txt(article.title).up();
            item.ele('link').txt(articleUrl).up();
            item.ele('guid', { isPermaLink: 'true' }).txt(articleUrl).up();
            item.ele('description').txt(article.abstract || '').up();
            item.ele('dc:creator').txt(authors).up();

            if (article.publishedAt) {
                item.ele('pubDate').txt(article.publishedAt.toUTCString()).up();
            }

            if (article.doi) {
                item.ele('dc:identifier').txt(article.doi).up();
            }

            // Add keywords as categories
            if (article.keywords && Array.isArray(article.keywords)) {
                for (const keyword of article.keywords) {
                    item.ele('category').txt(keyword as string).up();
                }
            }
        }

        return rss.end({ prettyPrint: true });
    }

    /**
     * Generate OAI-PMH response for metadata harvesting
     */
    static async generateOAIPMH(verb: string, params: any = {}): Promise<string> {
        const baseUrl = process.env.JOURNAL_URL || 'http://localhost:3000';
        const repositoryName = process.env.JOURNAL_NAME || 'Academic Journal Repository';
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@journal.com';

        const oaipmh = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('OAI-PMH', {
                xmlns: 'http://www.openarchives.org/OAI/2.0/',
                'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                'xsi:schemaLocation': 'http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd'
            });

        oaipmh.ele('responseDate').txt(new Date().toISOString()).up();

        const requestEle = oaipmh.ele('request', { verb });
        requestEle.txt(`${baseUrl}/oai`).up();

        switch (verb) {
            case 'Identify':
                return await this.generateIdentify(oaipmh, repositoryName, baseUrl, adminEmail);

            case 'ListMetadataFormats':
                return this.generateListMetadataFormats(oaipmh);

            case 'ListIdentifiers':
            case 'ListRecords':
                return await this.generateListRecords(oaipmh, verb, params);

            case 'GetRecord':
                return await this.generateGetRecord(oaipmh, params.identifier);

            default:
                oaipmh.ele('error', { code: 'badVerb' })
                    .txt('Illegal OAI verb').up();
                return oaipmh.end({ prettyPrint: true });
        }
    }

    private static async generateIdentify(oaipmh: any, repositoryName: string, baseUrl: string, adminEmail: string): Promise<string> {
        const identify = oaipmh.ele('Identify');
        identify.ele('repositoryName').txt(repositoryName).up();
        identify.ele('baseURL').txt(`${baseUrl}/oai`).up();
        identify.ele('protocolVersion').txt('2.0').up();
        identify.ele('adminEmail').txt(adminEmail).up();
        identify.ele('earliestDatestamp').txt('2024-01-01T00:00:00Z').up();
        identify.ele('deletedRecord').txt('no').up();
        identify.ele('granularity').txt('YYYY-MM-DDThh:mm:ssZ').up();

        return oaipmh.end({ prettyPrint: true });
    }

    private static generateListMetadataFormats(oaipmh: any): string {
        const listFormats = oaipmh.ele('ListMetadataFormats');

        // Dublin Core format
        const dc = listFormats.ele('metadataFormat');
        dc.ele('metadataPrefix').txt('oai_dc').up();
        dc.ele('schema').txt('http://www.openarchives.org/OAI/2.0/oai_dc.xsd').up();
        dc.ele('metadataNamespace').txt('http://www.openarchives.org/OAI/2.0/oai_dc/').up();

        return oaipmh.end({ prettyPrint: true });
    }

    private static async generateListRecords(oaipmh: any, verb: string, params: any): Promise<string> {
        const baseUrl = process.env.JOURNAL_URL || 'http://localhost:3000';

        // Get published articles
        const articles = await prisma.submission.findMany({
            where: {
                status: 'PUBLISHED',
                publicationSettings: {
                    includeInOAIPMH: true
                }
            },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                coAuthors: true
            },
            orderBy: {
                publishedAt: 'desc'
            },
            take: 100
        });

        const listElement = oaipmh.ele(verb === 'ListIdentifiers' ? 'ListIdentifiers' : 'ListRecords');

        for (const article of articles) {
            const record = listElement.ele('record');
            const header = record.ele('header');

            header.ele('identifier').txt(`oai:${baseUrl}:${article.id}`).up();
            header.ele('datestamp').txt(article.publishedAt?.toISOString() || new Date().toISOString()).up();
            header.ele('setSpec').txt('publication:article').up();

            if (verb === 'ListRecords') {
                const metadata = record.ele('metadata');
                const dc = metadata.ele('oai_dc:dc', {
                    'xmlns:oai_dc': 'http://www.openarchives.org/OAI/2.0/oai_dc/',
                    'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
                    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                    'xsi:schemaLocation': 'http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd'
                });

                dc.ele('dc:title').txt(article.title).up();

                // Add authors
                dc.ele('dc:creator').txt(`${article.author.firstName} ${article.author.lastName}`).up();
                for (const coAuthor of article.coAuthors) {
                    dc.ele('dc:creator').txt(`${coAuthor.firstName} ${coAuthor.lastName}`).up();
                }

                if (article.abstract) {
                    dc.ele('dc:description').txt(article.abstract).up();
                }

                if (article.doi) {
                    dc.ele('dc:identifier').txt(article.doi).up();
                }

                if (article.publishedAt) {
                    dc.ele('dc:date').txt(article.publishedAt.toISOString().split('T')[0]).up();
                }

                dc.ele('dc:type').txt('Text').up();
                dc.ele('dc:format').txt('application/pdf').up();
                dc.ele('dc:language').txt('en').up();

                // Add keywords as subjects
                if (article.keywords && Array.isArray(article.keywords)) {
                    for (const keyword of article.keywords) {
                        dc.ele('dc:subject').txt(keyword as string).up();
                    }
                }
            }
        }

        return oaipmh.end({ prettyPrint: true });
    }

    private static async generateGetRecord(oaipmh: any, identifier: string): Promise<string> {
        if (!identifier) {
            oaipmh.ele('error', { code: 'badArgument' })
                .txt('Missing required argument: identifier').up();
            return oaipmh.end({ prettyPrint: true });
        }

        // Extract article ID from identifier
        const articleId = identifier.split(':').pop();

        const article = await prisma.submission.findUnique({
            where: { id: articleId },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                coAuthors: true
            }
        });

        if (!article || article.status !== 'PUBLISHED') {
            oaipmh.ele('error', { code: 'idDoesNotExist' })
                .txt('No matching identifier').up();
            return oaipmh.end({ prettyPrint: true });
        }

        const baseUrl = process.env.JOURNAL_URL || 'http://localhost:3000';
        const getRecord = oaipmh.ele('GetRecord');
        const record = getRecord.ele('record');
        const header = record.ele('header');

        header.ele('identifier').txt(identifier).up();
        header.ele('datestamp').txt(article.publishedAt?.toISOString() || new Date().toISOString()).up();
        header.ele('setSpec').txt('publication:article').up();

        const metadata = record.ele('metadata');
        const dc = metadata.ele('oai_dc:dc', {
            'xmlns:oai_dc': 'http://www.openarchives.org/OAI/2.0/oai_dc/',
            'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation': 'http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd'
        });

        dc.ele('dc:title').txt(article.title).up();
        dc.ele('dc:creator').txt(`${article.author.firstName} ${article.author.lastName}`).up();

        for (const coAuthor of article.coAuthors) {
            dc.ele('dc:creator').txt(`${coAuthor.firstName} ${coAuthor.lastName}`).up();
        }

        if (article.abstract) {
            dc.ele('dc:description').txt(article.abstract).up();
        }

        if (article.doi) {
            dc.ele('dc:identifier').txt(article.doi).up();
        }

        if (article.publishedAt) {
            dc.ele('dc:date').txt(article.publishedAt.toISOString().split('T')[0]).up();
        }

        dc.ele('dc:type').txt('Text').up();
        dc.ele('dc:format').txt('application/pdf').up();
        dc.ele('dc:language').txt('en').up();

        if (article.keywords && Array.isArray(article.keywords)) {
            for (const keyword of article.keywords) {
                dc.ele('dc:subject').txt(keyword as string).up();
            }
        }

        return oaipmh.end({ prettyPrint: true });
    }

    /**
     * Regenerate all feeds (called after publishing an article)
     */
    static async regenerateAllFeeds(): Promise<void> {
        try {
            // In a production environment, you might want to:
            // 1. Generate and cache feeds
            // 2. Store them in a CDN
            // 3. Update a last-modified timestamp

            console.log('Regenerating all feeds...');
            await this.generateSitemap();
            await this.generateRSS();
            console.log('Feeds regenerated successfully');
        } catch (error) {
            console.error('Error regenerating feeds:', error);
            throw error;
        }
    }
}
