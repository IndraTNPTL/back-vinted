//! Convertir le buffer en base64
const convertToBase64 = (file) => {
  if (!file) {
    throw new Error("No file was uploaded");
  }
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

module.exports = convertToBase64;
