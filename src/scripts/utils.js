const numberToLetter = (n) => {
  return ["A", "B", "C", "D", "E", "F", "G"][n - 1 < 0 ? 0 : n - 1] ?? "A";
};

export default numberToLetter;
