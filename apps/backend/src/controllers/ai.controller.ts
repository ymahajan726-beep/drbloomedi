import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from '../services/ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // 1. AI Clinical Prescription & Treatment Protocol Suggester
  @Post('suggest-prescription')
  @HttpCode(HttpStatus.OK)
  async suggestPrescription(
    @Body() body: { diagnosis: string; symptoms?: string },
  ) {
    return this.aiService.suggestPrescription(body.diagnosis, body.symptoms);
  }

  // 2. AI Patient EMR Medical Summary Generator
  @Post('patient-summary')
  @HttpCode(HttpStatus.OK)
  async generatePatientSummary(@Body() patientData: any) {
    return this.aiService.generatePatientSummary(patientData);
  }
}