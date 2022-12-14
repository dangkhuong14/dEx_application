const {expect} = require('chai');
const {ethers} = require('hardhat')

const tokens = (number)=>{
    return ethers.utils.parseUnits(number.toString(), 'ether');
}

describe('Exchange', ()=>{
    let exchange, deployer, feeAccount

    const feePercent = 10

    beforeEach(async()=>{
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]

        const Exchange = await ethers.getContractFactory('Exchange')
        exchange = await Exchange.deploy(feeAccount.address, feePercent)
    })
    describe('Deployment', async()=>{
        it('tracks fee account', async()=>{
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
        it('tracks fee exchange', async()=>{
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })
})
