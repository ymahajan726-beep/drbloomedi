import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalDocument, DocumentType } from '../entities/medical-document.entity';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(MedicalDocument)
    private readonly docRepo: Repository<MedicalDocument>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async saveDocumentMeta(
    file: Express.Multer.File,
    body: { patientId?: string; documentType?: DocumentType; remarks?: string },
  ) {
    let patient: Patient | null = null;
    if (body.patientId) {
      patient = await this.patientRepo.findOne({
        where: { id: body.patientId },
      });
    }

    // Direct controller-served endpoint
    const publicUrl = `https://drbloomedi-backend.onrender.com/documents/download/${file.filename}`;

    const newDoc = this.docRepo.create({
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileUrl: publicUrl,
      documentType: body.documentType || DocumentType.LAB_REPORT,
      remarks: body.remarks || 'Uploaded via DrBlooMedi Clinical Portal',
      patient: patient || undefined,
    });

    return this.docRepo.save(newDoc);
  }

  async getDocumentsByPatient(patientId: string) {
    return this.docRepo.find({
      where: { patient: { id: patientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllDocuments() {
    return this.docRepo.find({
      relations: { patient: true },
      order: { createdAt: 'DESC' },
    });
  }
}