// Helper function to format large numbers with decimals
export const formatAmount = (value: string, decimals: number = 18) => {
  const num = parseFloat(value) / 10 ** decimals;
  return num.toFixed(decimals === 18 ? 4 : 2);
};

// Helper function to format price
export const formatPrice = (value: string, decimals: number = 6) => {
  const num = parseFloat(value) / 10 ** decimals;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper function to calculate total
export const calculateTotal = (price: string, qty: string) => {
  const priceNum = parseFloat(price) / 10 ** 9;
  const qtyNum = parseFloat(qty) / 10 ** 18;
  return (priceNum * qtyNum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
