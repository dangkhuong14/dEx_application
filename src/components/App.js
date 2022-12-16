import '../App.css';
import config from '../config.json'
import TOKEN_ABI from '../abis/Token.json'
// import Exchange from '../abis/Exchange.json'
import {useEffect} from 'react'
import {ethers} from 'ethers'


function App() {
  
  //Metamask injects a global API into website visited, which called window.ethereum 

  //Fetch accounts from metamask wallet
  const loadBlockchainData = async () => {
    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})
    console.log(accounts[0]);

    //Connect ethers to blockchain
    //Connect provider to external provider(window.ethereum)
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    //Get the network of provider
    const {chainId} = await provider.getNetwork( window.ethereum )
    console.log(chainId);

    //Connect to token smart contract
    const token = new ethers.Contract(config[chainId].DApp.address, TOKEN_ABI, provider)
    console.log(token.address);
    const name = await token.name()
    console.log(name);
  }

  useEffect(()=>{
    loadBlockchainData();
  })

  return (
    <div>

      {/* Navbar */}

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          {/* Markets */}

          {/* Balance */}

          {/* Order */}

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;
