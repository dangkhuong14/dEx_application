# DEX application project

This project should run on Linux and Mac.

You should add environment variables of your own first.

Try running some of the following commands:

```shell
npm install
npx hardhat node
npx hardhat test test/Token.js
npx hardhat test test/Exchange.js
npx hardhat run --network localhost scripts/1_deploy.js
npx hardhat run --network localhost scripts/2_seed-exchange.js
npm start
```
