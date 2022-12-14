const {expect} = require('chai');
const {ethers} = require('hardhat')

const tokens = (number)=>{
    return ethers.utils.parseUnits(number.toString(), 'ether');
}

describe('Token', ()=>{
    let token, accounts, deployer, receiver, exchange

    beforeEach(async()=>{
        //Fetch contract Token from Blockchain
        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Dapp token', 'DAPP', 1000000)
        //Get all account from deployed blockchain network
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
        exchange = accounts[2]
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

    describe('Sending tokens', ()=>{
        let amount, transaction, result
        beforeEach(async()=>{
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

    describe('Approving tokens', ()=>{
        let amount, transaction, result
        beforeEach(async()=>{
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })
        describe('Success', async()=>{
            it('allocate an allowance for delegated token spending', async()=>{
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
            })
            it('Emits Approval event', async()=>{
                const event = result.events[0]
                expect(event.event).to.equal('Approval')
                const args = event.args
                expect(args.owner).to.equal(deployer.address)
                expect(args.spender).to.equal(exchange.address)
                expect(args.value).to.equal(amount)
            })
        })
        describe('Failure', ()=>{
            it('rejects invalid spender', async()=>{
                await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
            })
        })
    })
    describe('Delegated token transfer', ()=>{
        let amount, transaction, result

        beforeEach(async()=>{
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })
        describe('Success', ()=>{
            beforeEach(async()=>{
                transaction = await token.connect(exchange).transferFrom(deployer.address, receiver.address, amount)
                result = await transaction.wait()
            })
            it('Transfer token balances', async()=>{
                expect(await token.balanceOf(deployer.address)).to.equal(tokens('999900'))
                expect(await token.balanceOf(receiver.address)).to.equal(amount)
            })
            it('resets the allowance', async()=>{
                expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)
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
            invalidAmount = tokens(1000)
            it('rejects invalid amount of token', async()=>{  
                await expect(token.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
            })
        })
    })
})