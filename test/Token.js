const {expect} = require('chai');
const {ethers} = require('hardhat')

const tokens = (number)=>{
    return ethers.utils.parseUnits(number.toString(), 'ether');
}

describe('Token', ()=>{
    let token, accounts, deployer, receiver
    beforeEach(async()=>{
        //Fetch contract Token from Blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Dapp token', 'DAPP', 1000000)
        //Get all account from deployed blockchain network
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
    })
    describe('Deployment', async()=>{
        const name = 'Dapp token'
        const symbol = 'DAPP'
        const decimals = '18'
        const totalSupply = tokens(1000000)
        it('has correct name', async()=>{
            expect(await token.name()).to.equal(name)
        })
        it ('has correct symbol',async()=>{
            expect(await token.symbol()).to.equal(symbol)
        })
        it ('has correct decimals', async()=>{
            expect(await token.decimals()).to.equal(decimals);
        })
        it ('has correct total supply', async()=>{
            expect(await token.totalSupply()).to.equal(totalSupply)
        })
        it('assign total supply to deployer', async()=>{
            expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
        })
    })

    describe('Sending token', ()=>{
        let amount, transaction, result
        beforeEach(async()=>{
            receiver = accounts[1]
            amount = tokens(100)
            transaction = await token.connect(deployer).transfer(receiver.address, amount)
            result = await transaction.wait()
        })

        describe('Success', ()=>{
            it('Transfers token balances', async()=>{
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
                expect(await token.balanceOf(receiver.address)).to.equal(amount)
            })
            it('Emits Transfer event', async()=>{
                const event = result.events[0];
                expect(event.event).to.equal('Transfer')
                const args = event.args
                expect(args.from).to.equal(deployer.address)
                expect(args.to).to.equal(receiver.address)
                expect(args.value).to.equal(amount)
            })
        })

        describe('Failure', ()=>{
            it('rejects insufficient balances', async()=>{
                let invalidAmount = tokens(10000000)
                await expect(token.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
            })
            it('rejects invalid recipient', async()=>{
                await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
            })
        })
        
    })
})