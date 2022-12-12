const {expect} = require('chai');
const {ethers} = require('hardhat')

const tokens = (number)=>{
    return ethers.utils.parseUnits(number.toString());
}

describe('Token', ()=>{
    let token
    beforeEach(async()=>{
        //Fetch contract Token from Blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy()
    })
    it('has correct name', async()=>{
        //Check if the name is correct
        expect(await token.name()).to.equal('Dapp token')
    })
    it ('has correct symbol',async()=>{
        expect(await token.symbol()).to.equal('DAPP')
    })
    it ('has correct decimals', async()=>{
        expect(await token.decimals()).to.equal('18');
    })
    it ('has a correct total supply', async()=>{
        expect(await token.totalSupply()).to.equal(tokens(1000000))
    })
})