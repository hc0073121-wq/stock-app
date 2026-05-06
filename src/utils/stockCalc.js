export const calcInvestment = (stock) =>
  stock.buyPrice * stock.quantity;

export const calcCurrentValue = (stock) =>
  stock.currentPrice * stock.quantity;

export const calcProfit = (stock) =>
  calcCurrentValue(stock) - calcInvestment(stock);

export const calcRate = (stock) =>
  ((calcProfit(stock) / calcInvestment(stock)) * 100).toFixed(2);