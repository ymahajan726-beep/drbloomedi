import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  // 1. Clinical Symptom & Prescription Auto-Suggester
  async suggestPrescription(diagnosis: string, symptoms?: string) {
    const query = `${diagnosis || ''} ${symptoms || ''}`.toLowerCase();

    // Standard clinical protocol mapping for common conditions
    if (query.includes('fever') || query.includes('pyrexia') || query.includes('viral')) {
      return {
        suggestedDiagnosis: 'Viral Pyrexia / Upper Respiratory Infection',
        recommendedMedicines: [
          { name: 'Paracetamol 650mg', dosage: '1-0-1 (After Food)', duration: '3 Days', instruction: 'Take for fever > 100°F' },
          { name: 'Cetirizine 10mg', dosage: '0-0-1 (Night)', duration: '5 Days', instruction: 'For rhinitis / body ache' },
          { name: 'Pantoprazole 40mg', dosage: '1-0-0 (Empty Stomach)', duration: '3 Days', instruction: 'Before breakfast' },
        ],
        clinicalAdvice: 'Hydration therapy (3L fluids/day), monitor temperature every 6 hours. Report if fever persists > 72 hours.',
        suggestedLabTests: ['Complete Blood Count (CBC)', 'Dengue NS1 Antigen (if fever > 3 days)'],
      };
    }

    if (query.includes('cough') || query.includes('bronch') || query.includes('throat')) {
      return {
        suggestedDiagnosis: 'Acute Bronchitis / Pharyngitis',
        recommendedMedicines: [
          { name: 'Azithromycin 500mg', dosage: '1-0-0 (After Food)', duration: '3 Days', instruction: 'Once daily' },
          { name: 'Dextromethorphan Syrup', dosage: '10ml TDS', duration: '5 Days', instruction: 'Take after meals' },
          { name: 'Montelukast + Levocetirizine', dosage: '0-0-1 (Night)', duration: '7 Days', instruction: 'At bedtime' },
        ],
        clinicalAdvice: 'Warm water gargles with salt, steam inhalation twice daily. Avoid chilled drinks.',
        suggestedLabTests: ['Chest X-Ray (PA View)', 'CBC with ESR'],
      };
    }

    if (query.includes('gast') || query.includes('acidity') || query.includes('stomach') || query.includes('abdomen')) {
      return {
        suggestedDiagnosis: 'Acute Dyspepsia / Gastroesophageal Reflux',
        recommendedMedicines: [
          { name: 'Rabeprazole 20mg + Domperidone 30mg', dosage: '1-0-0', duration: '7 Days', instruction: 'Empty stomach 30 mins before food' },
          { name: 'Sucralfate Syrup', dosage: '10ml BD', duration: '5 Days', instruction: '1 hour before meals' },
          { name: 'Dicyclomine 10mg (SOS)', dosage: 'As needed', duration: '3 Days', instruction: 'For abdominal spasm' },
        ],
        clinicalAdvice: 'Bland diet, avoid spicy and fried items. Maintain 2-hour gap between dinner and sleeping.',
        suggestedLabTests: ['USG Whole Abdomen', 'Serum Amylase & Lipase (if severe pain)'],
      };
    }

    if (query.includes('hypertens') || query.includes('bp') || query.includes('pressure')) {
      return {
        suggestedDiagnosis: 'Essential Hypertension - Stage 1',
        recommendedMedicines: [
          { name: 'Telmisartan 40mg', dosage: '1-0-0 (Morning)', duration: '30 Days', instruction: 'Monitor daily BP log' },
          { name: 'Amlodipine 5mg', dosage: '0-0-1 (If BP > 150/95)', duration: '15 Days', instruction: 'Adjunct if needed' },
        ],
        clinicalAdvice: 'Low-salt diet (< 2g/day), 30 mins aerobic exercise. Maintain strict BP monitoring record.',
        suggestedLabTests: ['Serum Creatinine', 'Lipid Profile', 'ECG 12-Lead'],
      };
    }

    // Default Fallback Consultation Draft
    return {
      suggestedDiagnosis: diagnosis || 'General Health Examination',
      recommendedMedicines: [
        { name: 'Multivitamin with Zinc', dosage: '0-1-0', duration: '10 Days', instruction: 'Post lunch' },
        { name: 'Paracetamol 500mg (SOS)', dosage: '1-0-0 (When needed)', duration: '3 Days', instruction: 'For pain or discomfort' },
      ],
      clinicalAdvice: 'Adequate rest and fluid intake. Follow-up if symptoms persist after 3 days.',
      suggestedLabTests: ['Routine Blood & Urine Analysis'],
    };
  }

  // 2. Longitudinal EMR Medical Summary Generator
  async generatePatientSummary(patientData: {
    fullName: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    appointments?: any[];
    prescriptions?: any[];
    labOrders?: any[];
  }) {
    const visitsCount = patientData.appointments?.length || 0;
    const rxCount = patientData.prescriptions?.length || 0;
    const labCount = patientData.labOrders?.length || 0;

    const recentDiagnoses = (patientData.prescriptions || [])
      .slice(0, 3)
      .map((p: any) => p.diagnosis)
      .filter(Boolean);

    const completedLabs = (patientData.labOrders || []).filter((l: any) => l.status === 'COMPLETED');

    const summaryBrief = `${patientData.fullName} (${patientData.age || 'Adult'}y, ${patientData.gender || 'Patient'}, Blood Group: ${patientData.bloodGroup || 'Not Recorded'}) has ${visitsCount} documented consultation visits with ${rxCount} medical prescriptions on record.`;

    const clinicalHighlights = [
      recentDiagnoses.length > 0
        ? `Primary diagnostic trajectory: ${recentDiagnoses.join(' -> ')}`
        : 'No chronic diagnostic pattern flagged in recent OPD logs.',
      completedLabs.length > 0
        ? `Diagnostic reports on file: ${completedLabs.map((l: any) => `${l.labTest?.testName || 'Test'}: ${l.resultValue || 'Done'}`).join(', ')}`
        : 'No completed pathology investigations logged yet.',
      visitsCount > 3
        ? 'High-frequency visitor: consider comprehensive preventative health workup.'
        : 'Normal visit frequency within routine parameters.',
    ];

    return {
      patientName: patientData.fullName,
      generatedAt: new Date().toISOString(),
      summaryBrief,
      clinicalHighlights,
      riskStratification: visitsCount > 4 ? 'MODERATE (Frequent Follow-ups)' : 'LOW / STABLE',
    };
  }
}