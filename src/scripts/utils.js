const numberToLetter = (n) => {
  if (n === 0 || n === "0" || n === "Por asignar" || n === null || n === undefined) return "Por asignar";
  const index = parseInt(n) - 1;
  return ["A", "B", "C", "D", "E", "F", "G"][index < 0 ? 0 : index] ?? "A";
};

export default numberToLetter;
