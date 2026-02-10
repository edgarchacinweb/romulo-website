const numberToLetter = (n) => {
  let letter = "";

  switch (n) {
    case 2:
      letter = "B";
      break;
    case 3:
      letter = "C";
      break;
    case 4:
      letter = "D";
      break;
    case 5:
      letter = "E";
      break;
    case 6:
      letter = "F";
      break;
    case 7:
      letter = "G";
      break;
    case 8:
      letter = "H";
      break;
    default:
      letter = "A";
  }

  return letter;
};

export default numberToLetter;
