import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  StreamableFile,
  Response,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, createReadStream } from 'fs';
import { DocumentsService } from '../services/documents.service';
import { DocumentType } from '../entities/medical-document.entity';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Helper to determine Content-Type
const getMimeType = (filename: string): string => {
  const ext = extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};

@Controller()
export class DocumentsController {
  constructor(private readonly docsService: DocumentsService) {}

  @Post('documents/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `med-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype.match(/\/(pdf|jpg|jpeg|png|webp)$/) ||
          file.originalname.match(/\.(pdf|jpg|jpeg|png|webp)$/i)
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF and image files are permitted'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { patientId?: string; documentType?: DocumentType; remarks?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No document file was uploaded');
    }
    return this.docsService.saveDocumentMeta(file, body);
  }

  // Handle stream with inline preview headers
  @Get(['documents/download/:filename', 'uploads/:filename'])
  serveFile(
    @Param('filename') filename: string,
    @Response({ passthrough: true }) res: any,
  ): StreamableFile {
    const filePath = join(uploadDir, filename);

    if (!existsSync(filePath)) {
      const altPath = join(__dirname, '..', '..', 'uploads', filename);
      if (existsSync(altPath)) {
        res.set({
          'Content-Type': getMimeType(filename),
          'Content-Disposition': `inline; filename="${filename}"`,
        });
        return new StreamableFile(createReadStream(altPath));
      }
      throw new NotFoundException(`File ${filename} not found on server disk`);
    }

    // Set inline header so browser previews instead of downloading
    res.set({
      'Content-Type': getMimeType(filename),
      'Content-Disposition': `inline; filename="${filename}"`,
    });

    return new StreamableFile(createReadStream(filePath));
  }

  @Get('documents/patient/:patientId')
  async getByPatient(@Param('patientId') patientId: string) {
    return this.docsService.getDocumentsByPatient(patientId);
  }

  @Get('documents')
  async getAll() {
    return this.docsService.getAllDocuments();
  }
}