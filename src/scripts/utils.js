const numberToLetter = (n) => {
  if (n === 0 || n === "0" || n === "Por asignar" || n === null || n === undefined) return "Por asignar";
  const index = parseInt(n) - 1;
  return ["A", "B", "C", "D", "E", "F", "G"][index < 0 ? 0 : index] ?? "A";
};

/**
 * Formatea la cédula para mostrar el prefijo V- o E- correctamente.
 * Maneja tanto cédulas regulares (7-9 dígitos) como escolares (11+ dígitos).
 */
const formatCedula = (cedula) => {
    if (!cedula) return "";
    let str = String(cedula).toUpperCase().trim();
    
    // Si ya tiene el formato correcto (V-1234 o E-1234)
    if (str.startsWith("V-") || str.startsWith("E-")) return str;
    
    // Si empieza con la letra pero no tiene el guión (V1234 o E1234)
    if (str.startsWith("V")) return "V-" + str.substring(1);
    if (str.startsWith("E")) return "E-" + str.substring(1);
    
    // Si es solo números, determinamos si es regular o escolar
    if (/^\d+$/.test(str)) {
        // En este sistema, si no tiene prefijo, se asume Venezolano (V)
        return `V-${str}`;
    }
    
    return str;
};

export { numberToLetter, formatCedula };
export default numberToLetter;
