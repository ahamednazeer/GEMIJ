import { Request, Response } from 'express';
import { FeedService } from '../services/feedService';

/**
 * Generate and serve XML sitemap
 */
export const getSitemap = async (req: Request, res: Response) => {
    try {
        const sitemap = await FeedService.generateSitemap();

        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(sitemap);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate sitemap'
        });
    }
};

/**
 * Generate and serve RSS feed
 */
export const getRSS = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const rss = await FeedService.generateRSS(limit);

        res.header('Content-Type', 'application/rss+xml');
        res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(rss);
    } catch (error) {
        console.error('RSS generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate RSS feed'
        });
    }
};

/**
 * Handle OAI-PMH requests
 */
export const getOAIPMH = async (req: Request, res: Response) => {
    try {
        const verb = req.query.verb as string;

        if (!verb) {
            const errorResponse = await FeedService.generateOAIPMH('', {});
            res.header('Content-Type', 'application/xml');
            res.send(errorResponse);
            return;
        }

        const params: any = {
            identifier: req.query.identifier,
            metadataPrefix: req.query.metadataPrefix,
            from: req.query.from,
            until: req.query.until,
            set: req.query.set,
            resumptionToken: req.query.resumptionToken
        };

        const oaipmh = await FeedService.generateOAIPMH(verb, params);

        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(oaipmh);
    } catch (error) {
        console.error('OAI-PMH generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate OAI-PMH response'
        });
    }
};

/**
 * Manually trigger feed regeneration (admin only)
 */
export const regenerateFeeds = async (req: Request, res: Response) => {
    try {
        await FeedService.regenerateAllFeeds();

        res.json({
            success: true,
            message: 'All feeds regenerated successfully'
        });
    } catch (error) {
        console.error('Feed regeneration error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to regenerate feeds'
        });
    }
};
