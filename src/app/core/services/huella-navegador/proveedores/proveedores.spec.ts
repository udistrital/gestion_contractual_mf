import { FingerprintjsProveedor } from './fingerprintjs.proveedor';
import { ThumbmarkjsProveedor } from './thumbmarkjs.proveedor';
import { hashComponentes } from '../utilidades/hash-componentes';

const mockLoad = jest.fn();
const mockThumbmarkConstructor = jest.fn();
const mockThumbmarkGet = jest.fn();

jest.mock('@fingerprintjs/fingerprintjs', () => ({
  load: (...args: unknown[]) => mockLoad(...args),
}));

jest.mock('@thumbmarkjs/thumbmarkjs', () => ({
  Thumbmark: class {
    constructor(opciones: unknown) {
      mockThumbmarkConstructor(opciones);
    }
    get() {
      return mockThumbmarkGet();
    }
  },
}));

jest.mock('../utilidades/hash-componentes', () => ({
  hashComponentes: jest.fn(async () => ({
    canvas: { hash: 'a1b2c3d4e5f60718', duracion_ms: 12, error: false },
  })),
}));

const mockHash = hashComponentes as jest.MockedFunction<typeof hashComponentes>;

describe('FingerprintjsProveedor', () => {
  beforeEach(() => {
    mockLoad.mockReset();
    mockHash.mockClear();
  });

  it('debería cargar la librería con monitoring: false', async () => {
    mockLoad.mockResolvedValue({
      get: async () => ({
        visitorId: 'abc',
        confidence: { score: 0.5 },
        components: {},
        version: '5.3.0',
      }),
    });

    await new FingerprintjsProveedor().obtener();

    expect(mockLoad).toHaveBeenCalledTimes(1);
    expect(mockLoad).toHaveBeenCalledWith({ monitoring: false });
  });

  it('debería mapear visitorId, confidence.score, version y components', async () => {
    mockLoad.mockResolvedValue({
      get: async () => ({
        visitorId: '4f2a9c1e8b7d6a5f3e2d1c0b9a8f7e6d',
        confidence: { score: 0.4, comment: 'precisión limitada' },
        components: {
          canvas: { value: { geometry: 'data:...' }, duration: 12 },
          audio: { error: new Error('suspendido'), duration: 40 },
        },
        version: '5.3.0',
      }),
    });

    const resultado = await new FingerprintjsProveedor().obtener();

    expect(mockHash).toHaveBeenCalledWith({
      canvas: { valor: { geometry: 'data:...' }, duracion_ms: 12 },
      audio: { error: true, duracion_ms: 40 },
    });
    expect(resultado).toEqual({
      huella: '4f2a9c1e8b7d6a5f3e2d1c0b9a8f7e6d',
      libreria: 'fingerprintjs',
      version_libreria: '5.3.0',
      confianza: 0.4,
      componentes: {
        canvas: { hash: 'a1b2c3d4e5f60718', duracion_ms: 12, error: false },
      },
    });
  });
});

describe('ThumbmarkjsProveedor', () => {
  beforeEach(() => {
    mockThumbmarkConstructor.mockReset();
    mockThumbmarkGet.mockReset();
    mockHash.mockClear();
  });

  it('debería crear la instancia con logging: false', async () => {
    mockThumbmarkGet.mockResolvedValue({
      thumbmark: 'abc',
      components: {},
      info: {},
      version: '1.12.0',
    });

    await new ThumbmarkjsProveedor().obtener();

    expect(mockThumbmarkConstructor).toHaveBeenCalledTimes(1);
    expect(mockThumbmarkConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ logging: false, collect_beacon: false }),
    );
  });

  it('debería mapear thumbmark, version, componentes con tiempos y errores, y confianza null', async () => {
    mockThumbmarkGet.mockResolvedValue({
      thumbmark: '9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b',
      components: { canvas: { commonPixels: ['a'] }, timezone: 'America/Bogota' },
      info: {},
      version: '1.12.0',
      elapsed: { canvas: 15, timezone: 1, '_pipeline.hash': 2 },
      error: [{ type: 'component_timeout', message: 'timeout', component: 'webgl' }],
    });

    const resultado = await new ThumbmarkjsProveedor().obtener();

    expect(mockHash).toHaveBeenCalledWith({
      canvas: { valor: { commonPixels: ['a'] }, error: false, duracion_ms: 15 },
      timezone: { valor: 'America/Bogota', error: false, duracion_ms: 1 },
      webgl: { error: true, duracion_ms: null },
    });
    expect(resultado).toEqual({
      huella: '9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b',
      libreria: 'thumbmarkjs',
      version_libreria: '1.12.0',
      confianza: null,
      componentes: {
        canvas: { hash: 'a1b2c3d4e5f60718', duracion_ms: 12, error: false },
      },
    });
  });
});
