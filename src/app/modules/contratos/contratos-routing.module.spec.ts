import { routes } from './contratos-routing.module';
import { RevisionContratoComponent } from './revision-contrato/revision-contrato.component';

describe('Rutas de contratos', () => {
  it('hay una sola ruta hacia la revisión del contrato, con el parámetro contratoId', () => {
    const revision = routes.filter((ruta) => ruta.component === RevisionContratoComponent);
    expect(revision.map((ruta) => ruta.path)).toEqual(['documentos/:contratoId']);
  });

  it('editar, detalle y documentos usan el mismo nombre de parámetro', () => {
    const conId = routes.map((ruta) => ruta.path ?? '').filter((path) => path.includes('/:'));
    expect(conId.every((path) => path.endsWith('/:contratoId'))).toBe(true);
    expect(conId.some((path) => path.includes('idContrato'))).toBe(false);
  });
});
