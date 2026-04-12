export type PopularInstrument = {
  symbol: string; // ticker symbol (mostly US)
  name: string;
};

// ETFs: highly recognizable, liquid, mostly US-listed so Finnhub covers them well.
export const POPULAR_ETFS: PopularInstrument[] = [
  { symbol: 'SPY', name: 'SPDR S&P 500' },
  { symbol: 'IVV', name: 'iShares Core S&P 500' },
  { symbol: 'VOO', name: 'Vanguard S&P 500' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market' },
  { symbol: 'QQQ', name: 'Invesco QQQ' },
  { symbol: 'IWM', name: 'iShares Russell 2000' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average' },
  { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets' },
  { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets' },
  { symbol: 'EFA', name: 'iShares MSCI EAFE' },
  { symbol: 'EEM', name: 'iShares MSCI Emerging Markets' },
  { symbol: 'ACWI', name: 'iShares MSCI ACWI' },
  { symbol: 'VT', name: 'Vanguard Total World' },
  { symbol: 'SCHD', name: 'Schwab U.S. Dividend Equity' },
  { symbol: 'DGRO', name: 'iShares Core Dividend Growth' },
  { symbol: 'VIG', name: 'Vanguard Dividend Appreciation' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR' },
  { symbol: 'XLV', name: 'Health Care Select Sector SPDR' },
  { symbol: 'XLY', name: 'Consumer Discretionary Select Sector SPDR' },
  { symbol: 'XLP', name: 'Consumer Staples Select Sector SPDR' },
  { symbol: 'XLI', name: 'Industrial Select Sector SPDR' },
  { symbol: 'XLC', name: 'Communication Services Select Sector SPDR' },
  { symbol: 'XLU', name: 'Utilities Select Sector SPDR' },
  { symbol: 'VNQ', name: 'Vanguard Real Estate' },
  { symbol: 'IYR', name: 'iShares U.S. Real Estate' },
  { symbol: 'ARKK', name: 'ARK Innovation' },
  { symbol: 'SOXX', name: 'iShares Semiconductor' },
  { symbol: 'SMH', name: 'VanEck Semiconductor' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond' },
  { symbol: 'IEF', name: 'iShares 7-10 Year Treasury Bond' },
  { symbol: 'SHY', name: 'iShares 1-3 Year Treasury Bond' },
  { symbol: 'BND', name: 'Vanguard Total Bond Market' },
  { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond' },
  { symbol: 'LQD', name: 'iShares iBoxx $ Investment Grade Corporate Bond' },
  { symbol: 'HYG', name: 'iShares iBoxx $ High Yield Corporate Bond' },
  { symbol: 'TIP', name: 'iShares TIPS Bond' },
  { symbol: 'GLD', name: 'SPDR Gold Shares' },
  { symbol: 'SLV', name: 'iShares Silver Trust' },
  { symbol: 'USO', name: 'United States Oil Fund' },
  { symbol: 'DBC', name: 'Invesco DB Commodity Index' },
  { symbol: 'UUP', name: 'Invesco DB US Dollar Index Bullish' }
];

// Bond-focused picks (many are ETFs, but keep in "Bonos" UX).
export const POPULAR_BOND_ETFS: PopularInstrument[] = [
  { symbol: 'BND', name: 'Vanguard Total Bond Market' },
  { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond' },
  { symbol: 'IEF', name: 'iShares 7-10 Year Treasury Bond' },
  { symbol: 'SHY', name: 'iShares 1-3 Year Treasury Bond' },
  { symbol: 'TIP', name: 'iShares TIPS Bond' },
  { symbol: 'LQD', name: 'iShares Investment Grade Corporate Bond' },
  { symbol: 'HYG', name: 'iShares High Yield Corporate Bond' },
  { symbol: 'JNK', name: 'SPDR High Yield Bond' },
  { symbol: 'BIL', name: 'SPDR Bloomberg 1-3 Month T-Bill' },
  { symbol: 'VGIT', name: 'Vanguard Intermediate-Term Treasury' },
  { symbol: 'VGLT', name: 'Vanguard Long-Term Treasury' },
  { symbol: 'MUB', name: 'iShares National Muni Bond' }
];

// "Fondos": treat as broad funds. Many users mean index funds; in public markets these are usually ETFs.
export const POPULAR_FUNDS: PopularInstrument[] = [
  { symbol: 'VTI', name: 'Vanguard Total Stock Market' },
  { symbol: 'VOO', name: 'Vanguard S&P 500' },
  { symbol: 'VT', name: 'Vanguard Total World' },
  { symbol: 'VEA', name: 'Vanguard Developed Markets' },
  { symbol: 'VWO', name: 'Vanguard Emerging Markets' },
  { symbol: 'BND', name: 'Vanguard Total Bond Market' },
  { symbol: 'VNQ', name: 'Vanguard Real Estate' },
  { symbol: 'SCHB', name: 'Schwab U.S. Broad Market' },
  { symbol: 'SCHX', name: 'Schwab U.S. Large-Cap' },
  { symbol: 'SCHG', name: 'Schwab U.S. Large-Cap Growth' }
];

export type PopularCrypto = { id: string; label: string };

// For CoinGecko provider
export const POPULAR_COINGECKO: PopularCrypto[] = [
  { id: 'bitcoin', label: 'Bitcoin' },
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'tether', label: 'Tether (USDT)' },
  { id: 'usd-coin', label: 'USD Coin (USDC)' },
  { id: 'euro-coin', label: 'Euro Coin (EURC)' },
  { id: 'dai', label: 'Dai (DAI)' },
  { id: 'binancecoin', label: 'BNB' },
  { id: 'solana', label: 'Solana (SOL)' },
  { id: 'xrp', label: 'XRP' },
  { id: 'cardano', label: 'Cardano (ADA)' },
  { id: 'dogecoin', label: 'Dogecoin (DOGE)' },
  { id: 'tron', label: 'TRON (TRX)' },
  { id: 'polkadot', label: 'Polkadot (DOT)' },
  { id: 'chainlink', label: 'Chainlink (LINK)' },
  { id: 'avalanche-2', label: 'Avalanche (AVAX)' },
  { id: 'matic-network', label: 'Polygon (POL/MATIC)' },
  { id: 'litecoin', label: 'Litecoin (LTC)' },
  { id: 'bitcoin-cash', label: 'Bitcoin Cash (BCH)' },
  { id: 'stellar', label: 'Stellar (XLM)' },
  { id: 'uniswap', label: 'Uniswap (UNI)' },
  { id: 'aave', label: 'Aave (AAVE)' },
  { id: 'near', label: 'NEAR (NEAR)' },
  { id: 'sui', label: 'Sui (SUI)' },
  { id: 'shiba-inu', label: 'Shiba Inu (SHIB)' },
  { id: 'pepe', label: 'Pepe (PEPE)' },
  { id: 'cosmos', label: 'Cosmos (ATOM)' }
];

// For Coinbase provider (product ids)
export const POPULAR_COINBASE_PAIRS: PopularCrypto[] = [
  { id: 'BTC-EUR', label: 'Bitcoin (EUR)' },
  { id: 'BTC-USD', label: 'Bitcoin (USD)' },
  { id: 'ETH-EUR', label: 'Ethereum (EUR)' },
  { id: 'ETH-USD', label: 'Ethereum (USD)' },
  { id: 'USDC-EUR', label: 'USD Coin (EUR)' },
  { id: 'USDC-USD', label: 'USD Coin (USD)' },
  { id: 'USDT-EUR', label: 'Tether (EUR)' },
  { id: 'USDT-USD', label: 'Tether (USD)' },
  { id: 'EURC-EUR', label: 'Euro Coin (EUR)' },
  { id: 'EURC-USD', label: 'Euro Coin (USD)' },
  { id: 'DAI-EUR', label: 'Dai (EUR)' },
  { id: 'DAI-USD', label: 'Dai (USD)' },
  { id: 'SOL-EUR', label: 'Solana (EUR)' },
  { id: 'SOL-USD', label: 'Solana (USD)' },
  { id: 'XRP-EUR', label: 'XRP (EUR)' },
  { id: 'XRP-USD', label: 'XRP (USD)' },
  { id: 'ADA-EUR', label: 'Cardano (EUR)' },
  { id: 'ADA-USD', label: 'Cardano (USD)' },
  { id: 'DOGE-EUR', label: 'Dogecoin (EUR)' },
  { id: 'DOGE-USD', label: 'Dogecoin (USD)' },
  { id: 'LTC-EUR', label: 'Litecoin (EUR)' },
  { id: 'DOT-EUR', label: 'Polkadot (EUR)' },
  { id: 'LINK-EUR', label: 'Chainlink (EUR)' },
  { id: 'AVAX-EUR', label: 'Avalanche (EUR)' },
  { id: 'POL-EUR', label: 'Polygon (EUR)' },
  { id: 'BCH-EUR', label: 'Bitcoin Cash (EUR)' },
  { id: 'XLM-EUR', label: 'Stellar (EUR)' },
  { id: 'UNI-EUR', label: 'Uniswap (EUR)' },
  { id: 'AAVE-EUR', label: 'Aave (EUR)' },
  { id: 'SUI-EUR', label: 'Sui (EUR)' },
  { id: 'NEAR-EUR', label: 'NEAR (EUR)' },
  { id: 'SHIB-EUR', label: 'Shiba Inu (EUR)' },
  { id: 'PEPE-EUR', label: 'Pepe (EUR)' },
  { id: 'TRX-EUR', label: 'TRON (EUR)' },
  { id: 'ATOM-EUR', label: 'Cosmos (EUR)' }
];

// For Binance provider (symbols)
export const POPULAR_BINANCE_SYMBOLS: PopularCrypto[] = [
  { id: 'BTCUSDT', label: 'Bitcoin (USDT)' },
  { id: 'BTCEUR', label: 'Bitcoin (EUR)' },
  { id: 'ETHUSDT', label: 'Ethereum (USDT)' },
  { id: 'ETHEUR', label: 'Ethereum (EUR)' },
  { id: 'SOLUSDT', label: 'Solana (USDT)' },
  { id: 'SOLEUR', label: 'Solana (EUR)' },
  { id: 'XRPUSDT', label: 'XRP (USDT)' },
  { id: 'XRPEUR', label: 'XRP (EUR)' },
  { id: 'ADAUSDT', label: 'Cardano (USDT)' },
  { id: 'ADAEUR', label: 'Cardano (EUR)' },
  { id: 'USDCUSDT', label: 'USD Coin (USDT)' },
  { id: 'TUSDUSDT', label: 'TrueUSD (USDT)' },
  { id: 'FDUSDUSDT', label: 'FDUSD (USDT)' },
  { id: 'EURUSDT', label: 'EUR/USDT' }
];
