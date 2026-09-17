import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from '../services/ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest-prescription')
  @HttpCode(HttpStatus.OK)
  async suggestPrescription(
    @Body() body: { diagnosis: string; symptoms?: string },
  ) {
    return this.aiService.suggestPrescription(body.diagnosis, body.symptoms);
  }

  @Post('patient-summary')
  @HttpCode(HttpStatus.OK)
  async generatePatientSummary(@Body() patientData: any) {
    return this.aiService.generatePatientSummary(patientData);
  }
}