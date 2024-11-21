export function formatDateTime(datetime: any) {
  return new Date(
    datetime.year.low,
    datetime.month.low - 1,
    datetime.day.low,
    datetime.hour.low,
    datetime.minute.low,
    datetime.second.low,
    datetime.nanosecond.low / 1e6
  ).toISOString();
}

export function geApproxUserAgeInYears(birthDate: any) {
  const birth = new Date(birthDate);
  const today = new Date();
  return today.getFullYear() - birth.getFullYear();
}
