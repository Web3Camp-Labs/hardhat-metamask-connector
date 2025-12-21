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
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    mainnet: {
      url: "https://eth.llamarpc.com",
      chainId: 1,
      accounts: [`${PRIVATE_KEY}`],
    },
    polygon: {
      url: "https://polygon-mainnet.infura.io/v3/50676f4e9b9d4780a34fc8a503ff7f4f",
      chainId: 137,
      // Using MetamaskConnector - no private key needed
      accounts: [`${PRIVATE_KEY}`]
    }
  }
};

export default config;
