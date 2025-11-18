import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export const getCurrentIssue = async (req: Request, res: Response) => {
  try {
    const currentIssue = await prisma.issue.findFirst({
      where: { isCurrent: true },
      include: {
        articles: {
          orderBy: { publishedAt: 'desc' }
        }
      }
    });

    if (!currentIssue) {
      return res.status(404).json({
        success: false,
        error: 'No current issue found'
      });
    }

    res.json({
      success: true,
      data: currentIssue
    });
  } catch (error) {
    console.error('Get current issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getArchive = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where: { publishedAt: { not: null } },
        skip,
        take: Number(limit),
        orderBy: [
          { volume: 'desc' },
          { number: 'desc' }
        ],
        include: {
          _count: {
            select: { articles: true }
          }
        }
      }),
      prisma.issue.count({
        where: { publishedAt: { not: null } }
      })
    ]);

    res.json({
      success: true,
      data: issues,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get archive error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getIssue = async (req: Request, res: Response) => {
  try {
    const { volume, number } = req.params;

    const issue = await prisma.issue.findUnique({
      where: {
        volume_number: {
          volume: Number(volume),
          number: Number(number)
        }
      },
      include: {
        articles: {
          orderBy: { publishedAt: 'desc' }
        }
      }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getArticle = async (req: Request, res: Response) => {
  try {
    const { doi } = req.params;

    const article = await prisma.article.findUnique({
      where: { doi },
      include: {
        issue: true
      }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { views: article.views + 1 }
    });

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        issue: true
      }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { views: article.views + 1 }
    });

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Get article by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const downloadArticle = async (req: Request, res: Response) => {
  try {
    const { doi } = req.params;

    const article = await prisma.article.findUnique({
      where: { doi }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { downloads: article.downloads + 1 }
    });

    res.download(article.pdfPath, `${article.doi.replace('/', '_')}.pdf`);
  } catch (error) {
    console.error('Download article error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const downloadArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { downloads: article.downloads + 1 }
    });

    const path = require('path');
    const fullPath = path.join(__dirname, '../../', article.pdfPath);
    res.download(fullPath, `${article.doi.replace('/', '_')}.pdf`);
  } catch (error) {
    console.error('Download article by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const searchArticles = async (req: Request, res: Response) => {
  try {
    const { q, author, year, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { abstract: { contains: q as string, mode: 'insensitive' } },
        { keywords: { has: q as string } }
      ];
    }

    if (author) {
      where.authors = {
        path: '$[*].lastName',
        string_contains: author as string
      };
    }

    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      where.publishedAt = {
        gte: startOfYear,
        lte: endOfYear
      };
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { publishedAt: 'desc' },
        include: {
          issue: {
            select: {
              volume: true,
              number: true,
              title: true
            }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Search articles error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getJournalStats = async (req: Request, res: Response) => {
  try {
    const [
      totalArticles,
      totalIssues,
      currentYearArticles,
      totalViews,
      totalDownloads
    ] = await Promise.all([
      prisma.article.count(),
      prisma.issue.count({ where: { publishedAt: { not: null } } }),
      prisma.article.count({
        where: {
          publishedAt: {
            gte: new Date(new Date().getFullYear(), 0, 1)
          }
        }
      }),
      prisma.article.aggregate({
        _sum: { views: true }
      }),
      prisma.article.aggregate({
        _sum: { downloads: true }
      })
    ]);

    const recentArticles = await prisma.article.findMany({
      take: 5,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        authors: true,
        doi: true,
        publishedAt: true,
        views: true,
        downloads: true
      }
    });

    res.json({
      success: true,
      data: {
        totalArticles,
        totalIssues,
        currentYearArticles,
        totalViews: totalViews._sum.views || 0,
        totalDownloads: totalDownloads._sum.downloads || 0,
        recentArticles
      }
    });
  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};