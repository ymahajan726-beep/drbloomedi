import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { IpdService } from '../services/ipd.service';

@Controller('ipd')
export class IpdController {
  constructor(private readonly ipdService: IpdService) {}

  @Get('beds')
  getAllBeds(
    @Query('wardType') wardType?: string,
    @Query('status') status?: string,
  ) {
    return this.ipdService.getAllBeds(wardType, status);
  }

  @Post('beds')
  createBed(@Body() body: any) {
    return this.ipdService.createBed(body);
  }

  @Get('admissions')
  getAllAdmissions(@Query('status') status?: string) {
    return this.ipdService.getAllAdmissions(status);
  }

  @Post('admit')
  admitPatient(
    @Body()
    body: {
      patientId: string;
      bedId: string;
      doctorId?: number;
      admissionDiagnosis?: string;
    },
  ) {
    return this.ipdService.admitPatient(body);
  }

  @Patch('discharge/:id')
  dischargePatient(
    @Param('id') id: string,
    @Body('dischargeSummary') dischargeSummary?: string,
  ) {
    return this.ipdService.dischargePatient(id, dischargeSummary);
  }
}