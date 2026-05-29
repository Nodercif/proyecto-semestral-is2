import { vi } from 'vitest'

// Instancia compartida — todos los tests acceden a los mismos vi.fn()
export const prismaMock = {
  incidente: {
    findUnique: vi.fn(),
    findMany:   vi.fn(),
    create:     vi.fn(),
  },
  estudiante: {
    findUnique: vi.fn(),
    findMany:   vi.fn(),
    upsert:     vi.fn(),
  },
  involucrado: {
    findMany:   vi.fn(),
    create:     vi.fn(),
    deleteMany: vi.fn(),
  },
  funcionarioInstitucional: {
    findUnique: vi.fn(),
  },
  $disconnect: vi.fn(),
}

// Clase real → vitest v4 no se queja del "not a constructor"
export class PrismaClient {
  constructor() {
    return prismaMock as any
  }
}

// Enums
export const RolInvolucrado = {
  AFECTADO:     'AFECTADO',
  RESPONSABLE:  'RESPONSABLE',
  TESTIGO:      'TESTIGO',
  INTERVINIENTE:'INTERVINIENTE',
} as const

export const TipoIncidente = {
  CONFLICTO:      'CONFLICTO',
  AGRESION_FISICA:'AGRESION_FISICA',
  AGRESION_VERBAL:'AGRESION_VERBAL',
  ACOSO:          'ACOSO',
  DANO_MATERIAL:  'DANO_MATERIAL',
} as const

export const NivelGravedad = {
  LEVE:'LEVE', MODERADO:'MODERADO', GRAVE:'GRAVE', MUY_GRAVE:'MUY_GRAVE',
} as const

// Error de Prisma para simular el 409
export class Prisma {
  static PrismaClientKnownRequestError = class extends Error {
    code: string
    constructor(message: string, { code }: { code: string }) {
      super(message)
      this.code = code
    }
  }
}
