export const formatDateToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');   
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const formatTime = (date: Date) => {
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${h}:${min}`;
};

export const formatDateTime = (date: Date) => {

  return `${formatDateToDDMMYYYY(date)} ${formatTime(date)}`;
};