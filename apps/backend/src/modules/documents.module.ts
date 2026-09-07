import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalDocument } from '../entities/medical-document.entity';
import { Patient } from '../entities/patient.entity';
import { DocumentsController } from '../controllers/documents.controller';
import { DocumentsService } from '../services/documents.service';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalDocument, Patient])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}