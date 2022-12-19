async function main() {
  console.log('Preparing deployment...');
  
  //Fetch contract to deploy
  const Token = await hre.ethers.getContractFactory('Token')
  const Exchange = await hre.ethers.getContractFactory('Exchange')

  //Fetch accounts
  const accounts = await ethers.getSigners()

  console.log(`Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}`);

  //Deploy the contract
  const dapp = await Token.deploy('Dapp token', 'DAPP', 1000000);
  await dapp.deployed();
  console.log(`DAPP is deployed at address: ${dapp.address}`);

  const mETH = await Token.deploy('mETH', 'mETH', 1000000);
  await mETH.deployed();
  console.log(`mETH is deployed at address: ${mETH.address}`);

  const mDAI = await Token.deploy('mDAI', 'mDAI', 1000000);
  await mDAI.deployed();
  console.log(`mDAI is deployed at address: ${mDAI.address}`);

//account[0]: deployer of exchange contract, account[1]: fee account
  const exchange = await Exchange.deploy(accounts[1].address, 10)
  await exchange.deployed()
  console.log(`Exchange deployed to: ${exchange.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
