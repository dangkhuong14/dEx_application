const { slice } = require("lodash");

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const privatekeys = process.env.PRIVATE_KEYS || ''

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  network: {
    localhost:{},
    mumbai: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: privatekeys.split(',')
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: privatekeys.split(",")
    }
  }
};
