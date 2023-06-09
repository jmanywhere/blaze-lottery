import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter"

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings:{
      optimizer:{
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter:{
    currency: "USD",
    token: "ETH"
  }
};

export default config;
