import type { TicketTransactionPort } from '../../domain/interfaces/ticket-repository.port';
import { NumeroEstacion } from '../../domain/types/ticket.types';
import { formatNumeroTurno, siguienteEstadoAlAvanzar } from '../../domain/turno-state-machine';
import { TurnoDispatcherService } from './turno-dispatcher.service';

function tx(occupied: NumeroEstacion[], pending: string[]) {
  return {
    occupiedStations: jest.fn().mockResolvedValue(occupied),
    pendingFifo: jest.fn((limit: number) => Promise.resolve(pending.slice(0, limit))),
    updateTurno: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<TicketTransactionPort>;
}

describe('TurnoDispatcherService (FIFO)', () => {
  const now = new Date('2026-10-03T15:00:00Z');
  const dispatcher = new TurnoDispatcherService();

  it('asigna los más antiguos a las estaciones libres en orden', async () => {
    const t = tx([], ['a', 'b', 'c']);
    await expect(dispatcher.dispatch(t, 'u', now)).resolves.toEqual(['a', 'b']);
    expect(t.pendingFifo).toHaveBeenCalledWith(2);
    expect(t.updateTurno).toHaveBeenNthCalledWith(
      1,
      'a',
      { estadoTurno: 'LAVANDO', numeroEstacion: 1, fechaInicioLavado: now },
      { estado: 'LAVANDO', fecha: now, usuarioId: 'u' },
    );
    expect(t.updateTurno).toHaveBeenNthCalledWith(
      2,
      'b',
      expect.objectContaining({ numeroEstacion: 2 }),
      expect.anything(),
    );
  });

  it('usa solo la estación libre', async () => {
    const t = tx([1], ['a', 'b']);
    await dispatcher.dispatch(t, null, now);
    expect(t.updateTurno).toHaveBeenCalledTimes(1);
    expect(t.updateTurno).toHaveBeenCalledWith(
      'a',
      expect.objectContaining({ numeroEstacion: 2 }),
      expect.anything(),
    );
  });

  it('sin estaciones libres no consulta pendientes', async () => {
    const t = tx([1, 2], ['a']);
    await expect(dispatcher.dispatch(t, null, now)).resolves.toEqual([]);
    expect(t.pendingFifo).not.toHaveBeenCalled();
  });
});

describe('máquina de estados del turno', () => {
  it('avanza LAVANDO → SECANDO_PULIENDO → LISTO y no desde otros estados', () => {
    expect(siguienteEstadoAlAvanzar('LAVANDO')).toBe('SECANDO_PULIENDO');
    expect(siguienteEstadoAlAvanzar('SECANDO_PULIENDO')).toBe('LISTO');
    expect(siguienteEstadoAlAvanzar('EN_ESPERA')).toBeNull();
    expect(siguienteEstadoAlAvanzar('LISTO')).toBeNull();
  });

  it('formatea el número de turno por día', () => {
    expect(formatNumeroTurno('2026-10-03', 7)).toBe('CW-20261003-0007');
  });
});
