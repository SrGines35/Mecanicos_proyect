import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { MecanicoService } from '../services/mecanico.service';

export const perfilCompletoGuard: CanActivateFn = () => {
  const mecanicos = inject(MecanicoService);
  const router = inject(Router);

  const destino = router.createUrlTree(['/mecanico/perfil']);

  return mecanicos.cargarPerfil().pipe(
    map((perfil) => (mecanicos.perfilCompleto(perfil) ? true : destino)),
    catchError(() => of(destino))
  );
};
