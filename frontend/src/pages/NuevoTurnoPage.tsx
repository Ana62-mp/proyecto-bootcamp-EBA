/**
 * NuevoTurnoPage: Self-service Kiosk & Operator Turn Creator
 * Conforms to Spec Section 8:
 * - Step 1: Document input & validation (Cédula, Pasaporte, RUC)
 * - Step 2A: Existing customer view & vehicle selection (with "Este no soy yo")
 * - Step 2B: New customer registration
 * - Step 3: Vehicle form (when new or registering additional vehicle)
 * - Step 4: Service selection & price confirmation
 * - Step 5: Final review & turn generation
 * - Step 6: Ticket printable output
 */
import React, { useState } from 'react';
import { Cliente, ServicioLavado, TipoDocumento, TurnoCarwash, Vehiculo } from '../types';
import { useCarWash } from '../context/CarWashContext';
import { ClientesService } from '../services/clientesService';
import { DocumentStep } from '../components/kiosk/DocumentStep';
import { ExistingCustomerStep } from '../components/kiosk/ExistingCustomerStep';
import { NewCustomerForm } from '../components/kiosk/NewCustomerForm';
import { VehicleForm } from '../components/kiosk/VehicleForm';
import { ServiceSelector } from '../components/kiosk/ServiceSelector';
import { TurnConfirmation } from '../components/kiosk/TurnConfirmation';
import { TurnSuccessStep } from '../components/kiosk/TurnSuccessStep';

type WizardStep =
  | 'DOCUMENT'
  | 'EXISTING_CUSTOMER'
  | 'NEW_CUSTOMER'
  | 'VEHICLE_FORM'
  | 'SERVICE_SELECTION'
  | 'CONFIRMATION'
  | 'SUCCESS';

export const NuevoTurnoPage: React.FC = () => {
  const { servicios, crearTurno, clientes, refreshData, showToast } = useCarWash();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('DOCUMENT');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CEDULA');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [docError, setDocError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Flow entities
  const [clienteActual, setClienteActual] = useState<Cliente | null>(null);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<ServicioLavado | null>(null);
  const [turnoCreado, setTurnoCreado] = useState<TurnoCarwash | null>(null);

  const [isSubmittingTurno, setIsSubmittingTurno] = useState(false);

  // STEP 1: Search customer by document
  const handleDocumentContinue = async () => {
    setIsSearching(true);
    setDocError('');

    try {
      const match = await ClientesService.buscarPorDocumento(tipoDocumento, numeroDocumento);

      if (match) {
        setClienteActual(match);
        // If customer has exactly 1 active vehicle, select it by default per spec Section 8.2
        const activeVehs = match.vehiculos.filter(v => v.activo);
        if (activeVehs.length === 1) {
          setVehiculoSeleccionado(activeVehs[0]);
        } else {
          setVehiculoSeleccionado(null);
        }
        setStep('EXISTING_CUSTOMER');
      } else {
        setClienteActual(null);
        setVehiculoSeleccionado(null);
        setStep('NEW_CUSTOMER');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al buscar cliente';
      setDocError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  // Reset/Clear everything ("Este no soy yo" or Timeout)
  const handleResetKiosk = () => {
    setStep('DOCUMENT');
    setNumeroDocumento('');
    setDocError('');
    setClienteActual(null);
    setVehiculoSeleccionado(null);
    setServicioSeleccionado(null);
    setTurnoCreado(null);
  };

  // STEP 2B: Submit new customer form
  const handleNewCustomerSubmit = async (datos: {
    nombres: string | null;
    apellidos: string | null;
    razonSocial: string | null;
    nombreContacto: string | null;
    telefono: string;
    correo: string | null;
  }) => {
    try {
      const nuevo = await ClientesService.crearCliente({
        tipoDocumento,
        numeroDocumento,
        ...datos,
        activo: true,
        vehiculos: []
      });
      refreshData();
      showToast('¡Cliente registrado exitosamente!', 'success');
      setClienteActual(nuevo);
      setStep('VEHICLE_FORM');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar cliente';
      setDocError(msg);
      showToast(msg, 'error');
    }
  };

  // STEP 3: Submit vehicle form
  const handleVehicleSubmit = async (vehiculoData: Omit<Vehiculo, 'idVehiculo' | 'idCliente' | 'activo'>) => {
    if (!clienteActual) return;

    try {
      const nuevoVehiculo = await ClientesService.agregarVehiculo(clienteActual.idCliente, {
        ...vehiculoData,
        activo: true
      });
      refreshData();

      // Update local client reference
      const updatedClient = await ClientesService.obtenerPorId(clienteActual.idCliente);
      if (updatedClient) {
        setClienteActual(updatedClient);
      }
      showToast(`Vehículo ${nuevoVehiculo.placa} agregado correctamente.`, 'success');
      setVehiculoSeleccionado(nuevoVehiculo);
      setStep('SERVICE_SELECTION');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al agregar vehículo';
      showToast(msg, 'error');
    }
  };

  // STEP 5: Confirm and create turn
  const handleConfirmTurno = async () => {
    if (!clienteActual || !vehiculoSeleccionado || !servicioSeleccionado) return;

    setIsSubmittingTurno(true);
    try {
      const result = await crearTurno({
        idCliente: clienteActual.idCliente,
        idVehiculo: vehiculoSeleccionado.idVehiculo,
        idServicio: servicioSeleccionado.idServicio
      });

      setTurnoCreado(result.turno);
      setStep('SUCCESS');
    } catch (err: unknown) {
      // Error handled by CarWashContext toast
    } finally {
      setIsSubmittingTurno(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center py-4 select-none">
      {/* STEP 1: Document */}
      {step === 'DOCUMENT' && (
        <DocumentStep
          tipoDocumento={tipoDocumento}
          numeroDocumento={numeroDocumento}
          onChangeTipo={setTipoDocumento}
          onChangeNumero={setNumeroDocumento}
          onContinue={handleDocumentContinue}
          error={docError}
          setError={setDocError}
          isSearching={isSearching}
        />
      )}

      {/* STEP 2A: Existing Customer Welcome */}
      {step === 'EXISTING_CUSTOMER' && clienteActual && (
        <ExistingCustomerStep
          cliente={clienteActual}
          selectedVehiculoId={vehiculoSeleccionado?.idVehiculo || null}
          onSelectVehiculo={idVehiculo => {
            const v = clienteActual.vehiculos.find(item => item.idVehiculo === idVehiculo);
            if (v) setVehiculoSeleccionado(v);
          }}
          onAddNewVehicle={() => setStep('VEHICLE_FORM')}
          onNotMe={handleResetKiosk}
          onContinue={() => setStep('SERVICE_SELECTION')}
        />
      )}

      {/* STEP 2B: New Customer Form */}
      {step === 'NEW_CUSTOMER' && (
        <NewCustomerForm
          tipoDocumento={tipoDocumento}
          numeroDocumento={numeroDocumento}
          onBack={() => setStep('DOCUMENT')}
          onSubmit={handleNewCustomerSubmit}
        />
      )}

      {/* STEP 3: Vehicle Form */}
      {step === 'VEHICLE_FORM' && clienteActual && (
        <VehicleForm
          idCliente={clienteActual.idCliente}
          onBack={() => {
            if (clienteActual.vehiculos.length > 0) {
              setStep('EXISTING_CUSTOMER');
            } else {
              setStep('NEW_CUSTOMER');
            }
          }}
          onSubmit={handleVehicleSubmit}
        />
      )}

      {/* STEP 4: Service Selector */}
      {step === 'SERVICE_SELECTION' && (
        <ServiceSelector
          servicios={servicios}
          selectedServicioId={servicioSeleccionado?.idServicio || null}
          onSelectServicio={idServicio => {
            const s = servicios.find(item => item.idServicio === idServicio);
            if (s) setServicioSeleccionado(s);
          }}
          onBack={() => {
            if (clienteActual && clienteActual.vehiculos.length > 1) {
              setStep('EXISTING_CUSTOMER');
            } else {
              setStep('VEHICLE_FORM');
            }
          }}
          onContinue={() => setStep('CONFIRMATION')}
        />
      )}

      {/* STEP 5: Final Review & Confirmation */}
      {step === 'CONFIRMATION' && clienteActual && vehiculoSeleccionado && servicioSeleccionado && (
        <TurnConfirmation
          cliente={clienteActual}
          vehiculo={vehiculoSeleccionado}
          servicio={servicioSeleccionado}
          isSubmitting={isSubmittingTurno}
          onBack={() => setStep('SERVICE_SELECTION')}
          onConfirm={handleConfirmTurno}
        />
      )}

      {/* STEP 6: Success & Ticket Output */}
      {step === 'SUCCESS' && turnoCreado && (
        <TurnSuccessStep
          turno={turnoCreado}
          onFinish={handleResetKiosk}
        />
      )}
    </div>
  );
};
