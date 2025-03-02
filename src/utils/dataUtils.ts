export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Format like "18 Feb 2024"
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Format like "9:16 AM"
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  return `${hours}:${minutes} ${ampm}`;
};

export const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const isWithinDateRange = (
  date: string,
  startDate: string | null,
  endDate: string | null
): boolean => {
  const transactionDate = new Date(date);
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
    return transactionDate >= start && transactionDate <= end;
  } else if (startDate) {
    const start = new Date(startDate);
    return transactionDate >= start;
  } else if (endDate) {
    const end = new Date(endDate);
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
    return transactionDate <= end;
  }
  
  return true;
};