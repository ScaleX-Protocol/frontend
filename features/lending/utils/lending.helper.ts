export const parseCurrency = (value: string) => {
  return parseFloat(value.replace(/[$,]/g, '') || '0');
};
