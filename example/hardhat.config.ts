import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";


const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    mainnet: {
      url: "https://eth-mainnet.g.alchemy.com/v2/FU0ujCat3OQd5hIqpddJ94SngVaeSxad",
      chainId: 1,
      accounts: [`${PRIVATE_KEY}`],
    },
    polygon: {
      url: "https://polygon-mainnet.g.alchemy.com/v2/-MLinGy2l91vLVZWXmRfNYf9DavMxaEA",
      chainId: 137,
      accounts: [`${PRIVATE_KEY}`],
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/H43zK7UnIN2v7u2ZoTbizIPnXkylKIZl",
      chainId: 11155111,
      accounts: [`${PRIVATE_KEY}`],
    },
  }
};

export default config;
