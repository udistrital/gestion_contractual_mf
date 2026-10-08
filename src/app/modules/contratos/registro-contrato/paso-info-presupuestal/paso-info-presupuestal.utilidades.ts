export const cdpConstructorTabla = [
  {
    columnDef: 'vigencia',
    header: 'Vigencia',
    cell: (element: any) => element.vigencia,
  },
  {
    columnDef: 'solicitudNecesidad',
    header: 'Solicitud de Necesidad',
    cell: (element: any) => element.num_sol_adq,
  },
  {
    columnDef: 'numeroCDP',
    header: 'Número de Disponibilidad',
    cell: (element: any) => element.numero_disponibilidad,
  },
  {
    columnDef: 'valor',
    header: 'Valor $ (En Pesos)',
    cell: (element: any) => element.valor_contratacion,
  },
  {
    columnDef: 'dependencia',
    header: 'Dependencia',
    cell: (element: any) => element.nombre_dependencia,
  },
  {
    columnDef: 'rubro',
    header: 'Rubro',
    cell: (element: any) => element.descripcion,
  },
  {
    columnDef: 'estado',
    header: 'Estado',
    cell: (element: any) => element.estado,
  },
  {
    columnDef: 'acciones',
    header: 'Acciones',
    cell: (element: any) => '',
  },
];
