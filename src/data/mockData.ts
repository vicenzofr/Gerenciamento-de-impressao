import type {
  PrinterTimeline,
  ProducingJob,
  QueuedJob,
  VerifyJob,
} from '@/types'

export const queuedJobs: QueuedJob[] = [
  {
    id: 'q1',
    fileName: 'engrenagem_helice_v2.gcode',
    filament: 'PETG XT',
    estimatedTime: '04h 45m',
    weight: '120g',
    priority: 'ALTA',
  },
  {
    id: 'q2',
    fileName: 'suporte_filamento_reforcado.gcode',
    filament: 'PLA Premium',
    estimatedTime: '05h 12m',
    weight: '180g',
    priority: 'MEDIA',
  },
  {
    id: 'q3',
    fileName: 'case_mini_pc_rpi5.gcode',
    filament: 'ABS Pro',
    estimatedTime: '07h 30m',
    weight: '210g',
    priority: 'AGENDADA',
  },
]

export const producingJobs: ProducingJob[] = [
  {
    id: 'p1',
    fileName: 'mascara_cyberpunk_face.gcode',
    printerName: 'CR-10 Max',
    progress: 78,
    elapsedTime: '08h 15m decorridos',
    nozzleTemp: 220,
    bedTemp: 68,
  },
  {
    id: 'p2',
    fileName: 'chassi_robo_explorador_A.gcode',
    printerName: 'Ender 3 Pro',
    progress: 42,
    elapsedTime: '02h 10m decorridos',
    nozzleTemp: 240,
    bedTemp: 80,
  },
]

export const verifyJobs: VerifyJob[] = [
  {
    id: 'v1',
    fileName: 'vaso_geometrico_decorativo.gcode',
    printerName: 'Ender 3 V2',
    totalTime: '09h 40m',
    verifyStatus: 'INSPECAO_PENDENTE',
  },
  {
    id: 'v2',
    fileName: 'braco_robotico_articulado.gcode',
    printerName: 'CR-10 Max',
    totalTime: '14h 22m',
    verifyStatus: 'RETIRADA_PRONTA',
  },
]

export const printersOnline = 3

export const printerTimelines: PrinterTimeline[] = [
  {
    id: 't1',
    name: 'Ender 3 Pro',
    spec: 'FDM • 220x220mm',
    blocks: [
      {
        id: 'b1',
        fileName: 'chassi_robo_explorador_A.gcode',
        startHour: 8,
        endHour: 11.83,
        color: 'rust',
      },
      {
        id: 'b2',
        fileName: 'suporte_filamento_reforcado.gcode',
        startHour: 13,
        endHour: 17,
        color: 'navy',
      },
    ],
  },
  {
    id: 't2',
    name: 'Ender 3 V2',
    spec: 'FDM • 220x220mm',
    blocks: [
      {
        id: 'b3',
        fileName: 'engrenagem_helice_v2.gcode',
        startHour: 9,
        endHour: 13.5,
        color: 'teal',
      },
      {
        id: 'b4',
        fileName: 'teste_calibracao_bico.gcode',
        startHour: 15,
        endHour: 18,
        color: 'green',
      },
    ],
  },
  {
    id: 't3',
    name: 'CR-10 Max',
    spec: 'FDM • 450x450mm',
    blocks: [
      {
        id: 'b5',
        fileName: 'mascara_cyberpunk_face.gcode',
        startHour: 8,
        endHour: 16.25,
        autoScheduled: true,
        color: 'amber',
      },
    ],
  },
]
