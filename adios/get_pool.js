const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const factoryAddress = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"; // Uniswap V3 Factory on Base
  const factoryAbi = ["function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"];
  const factory = new ethers.Contract(factoryAddress, factoryAbi, provider);

  const WETH = "0x4200000000000000000000000000000000000006";
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const fee = 500; // 0.05%

  const poolAddress = await factory.getPool(WETH, USDC, fee);
  console.log("Pool Address:", poolAddress);
}

main().catch(console.error);
