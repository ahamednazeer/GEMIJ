import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export const uploadFiles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: submissionId } = req.params;
    const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Extract files from either 'file' or 'files' field
    let files: Express.Multer.File[] = [];
    if (uploadedFiles.file) {
      files = files.concat(uploadedFiles.file);
    }
    if (uploadedFiles.files) {
      files = files.concat(uploadedFiles.files);
    }
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (submission.authorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const fileRecords = await Promise.all(
      files.map(async (file, index) => {
        return prisma.submissionFile.create({
          data: {
            filename: file.filename,
            originalName: file.originalname,
            fileType: path.extname(file.originalname).toLowerCase(),
            fileSize: file.size,
            filePath: file.path,
            submissionId,
            isMainFile: index === 0
          }
        });
      })
    );

    res.status(201).json({
      success: true,
      data: fileRecords,
      message: 'Files uploaded successfully'
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const deleteFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    
    const file = await prisma.submissionFile.findUnique({
      where: { id: fileId },
      include: {
        submission: true
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    if (file.submission.authorId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!['DRAFT', 'REVISION_REQUIRED'].includes(file.submission.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete files in current submission status'
      });
    }

    try {
      await fs.unlink(file.filePath);
    } catch (fsError) {
      console.warn('Could not delete physical file:', fsError);
    }

    await prisma.submissionFile.delete({
      where: { id: fileId }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const downloadFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    
    const file = await prisma.submissionFile.findUnique({
      where: { id: fileId },
      include: {
        submission: {
          include: {
            reviews: {
              where: {
                reviewerId: req.user!.id
              }
            },
            editorAssignments: {
              where: {
                editorId: req.user!.id
              }
            }
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const hasAccess = 
      file.submission.authorId === req.user!.id ||
      file.submission.reviews.length > 0 ||
      file.submission.editorAssignments.length > 0 ||
      ['EDITOR', 'ADMIN'].includes(req.user!.role);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    try {
      await fs.access(file.filePath);
      res.download(file.filePath, file.originalName);
    } catch (fsError) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};