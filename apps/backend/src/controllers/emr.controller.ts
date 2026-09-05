import { Controller, Get, Param } from '@nestjs/common';
import { EmrService } from '../services/emr.service';

@Controller('emr')
export class EmrController {
  constructor(private readonly emrService: EmrService) {}

  @Get('patient/:id')
  async getPatientTimeline(@Param('id') id: string) {
    return this.emrService.getPatientTimeline(id);
  }
}