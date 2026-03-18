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

export const parseDDMMYYYYHHMM = (input: string): Date => {
  const match = input.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/
  );

  if (!match) return new Date(NaN);

  const [, day, month, year, hours = "00", minutes = "00"] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes)
  );
};