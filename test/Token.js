const {expect} = require('chai');
const {ethers} = require('hardhat')

describe('Token', ()=>{
    it('has a name', async()=>{
        //Fetch contract Token from Blockchain
        const Token = await ethers.getContractFactory('Token')
        let token = await Token.deploy()
        //Read Token contract's name
        const name = await token.name()
        //Check if the name is correct
        expect(name).to.equal('My Token')
    })
})