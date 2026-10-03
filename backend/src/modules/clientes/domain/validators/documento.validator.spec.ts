import {
  validarCedula,
  validarCelular,
  validarCorreo,
  validarPasaporte,
  validarRUC,
} from './documento.validator';

describe('validadores de documentos (Ecuador)', () => {
  it('cédula válida con módulo 10', () => {
    expect(validarCedula('1710034065')).toEqual({ isValid: true, cleanedValue: '1710034065' });
  });

  it.each(['1710034066', '0000000000', '9910034065', '1760034065', '17100340', 'ABC1234567'])(
    'cédula inválida %p',
    (value) => expect(validarCedula(value).isValid).toBe(false),
  );

  it('RUC de persona natural valida la cédula base', () => {
    expect(validarRUC('1710034065001').isValid).toBe(true);
    expect(validarRUC('1710034066001').isValid).toBe(false);
    expect(validarRUC('1710034065002').isValid).toBe(false);
  });

  it('pasaporte alfanumérico de 6 a 20', () => {
    expect(validarPasaporte(' a9823412b ').cleanedValue).toBe('A9823412B');
    expect(validarPasaporte('AB12').isValid).toBe(false);
    expect(validarPasaporte('AB-1234').isValid).toBe(false);
  });

  it('celular 9-10 dígitos y correo opcional', () => {
    expect(validarCelular('0998765432').isValid).toBe(true);
    expect(validarCelular('09987-6543').isValid).toBe(false);
    expect(validarCorreo('').isValid).toBe(true);
    expect(validarCorreo('Usuario@Correo.com').cleanedValue).toBe('usuario@correo.com');
    expect(validarCorreo('usuario@correo').isValid).toBe(false);
  });
});
