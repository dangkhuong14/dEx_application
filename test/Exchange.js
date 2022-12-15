const {expect} = require('chai');
const {ethers} = require('hardhat')

const tokens = (number)=>{
    return ethers.utils.parseUnits(number.toString(), 'ether');
}

describe('Exchange', ()=>{
    let exchange, deployer, feeAccount

    const feePercent = 10

    beforeEach(async()=>{
        const Exchange = await ethers.getContractFactory('Exchange')
        const Token = await ethers.getContractFactory('Token')


        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]

        exchange = await Exchange.deploy(feeAccount.address, feePercent)
        token1 = await Token.deploy('Dapp token', 'DAPP', 1000000)
        //Create token 2
        token2 = await Token.deploy('Mock Dai', 'mDai', 1000000)

        let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
        await transaction.wait()
    })

    describe('Deployment', async()=>{
        it('tracks fee account', async()=>{
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
        it('tracks exchange fee', async()=>{
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })

    describe('Depositing Tokens', ()=>{
        let transaction, result
        let amount = tokens(10)
        
        describe('Success', ()=>{
            beforeEach(async()=>{
                //Approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                //Deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
            })
            it('tracks the token deposit', async()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })
            it('Emits Deposit event', async()=>{
                const event = result.events[1];
                expect(event.event).to.equal('Deposit')
                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(amount)
            })
        })
        describe('Failure', ()=>{
            it('fails when no tokens are approved', async()=>{
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
            })
        })
    })

    describe('Withdrawing Tokens', ()=>{
        let transaction, result
        let amount = tokens(10)
        
        describe('Success', ()=>{
            beforeEach(async()=>{
                //Deposit tokens before withdraw
                //Approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                //Deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
                //Withdraw token
                transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
                result = await transaction.wait()


            })
            it('withdraws token funds', async()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(0)
               expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
               expect(await token1.balanceOf(user1.address)).to.equal(tokens(100))
            })
            it('Emits Withdraw event', async()=>{
                const event = result.events[1];
                expect(event.event).to.equal('Withdraw')
                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(0)
            })
        })
        describe('Failure', ()=>{
            it('fails for insufficient balances', async()=>{
                //Attempt withdraw tokens without depositing
                await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
            })
        })
    })

    describe('Checking deposit balances', ()=>{
        let transaction, result
        let amount = tokens(23)
        
        beforeEach(async()=>{
            //Approve token
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()
            //Deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()
        })

        it('returns user balance', async()=>{
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
        })
    })

    describe('Making orders', ()=>{
        let transaction, result
        let amount = tokens(10)
        
        describe('Success', ()=>{
            beforeEach(async()=>{
                //Deposit tokens before make order
                //Approve token
                transaction = await token1.connect(user1).approve(exchange.address, amount)
                result = await transaction.wait()
                //Deposit token
                transaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await transaction.wait()
                //Make new order
                transaction = await exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))
                result = await transaction.wait()
            })
        
            it('tracks newly created order', async()=>{
                expect(await exchange.orderCount()).to.equal(1)
            })
            it('Emits Order event', async()=>{
                const event = result.events[0];
                expect(event.event).to.equal('Order')
                const args = event.args
                expect(args.id).to.equal(1)
                expect(args.user).to.equal(user1.address)
                expect(args.tokenGet).to.equal(token2.address)
                expect(args.amountGet).to.equal(tokens(1))
                expect(args.tokenGive).to.equal(token1.address)
                expect(args.amountGive).to.equal(tokens(1))
            })
        })

        describe('Failure', async()=>{
            it('rejects if do not have enough balance', async()=>{
                await expect(exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))).to.be.reverted
            })
        })
    })

    describe('Order actions', ()=>{

        let transaction, result
        let amount = tokens(1)
        beforeEach(async()=>{
            //Deposit tokens before make order
            //user1 approve token
            transaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await transaction.wait()
            //user1 deposit token
            transaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await transaction.wait()

            //Give user2 token
            transaction = await token2.connect(deployer).transfer(user2.address, tokens(100))
            result = await transaction.wait()

            //user2 approve token
            transaction = await token2.connect(user2).approve(exchange.address, tokens(2))
            result = await transaction.wait()
            //user2 deposit token
            transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2))
            result = await transaction.wait()

            //user1 make new order
            transaction = await exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))
            result = await transaction.wait()
        })

        describe('Cancelling orders', ()=>{
            describe('Success', async()=>{
                beforeEach(async()=>{
                    transaction = await exchange.connect(user1).cancelOrder(1)
                    result = await transaction.wait()
                })

                it('updates canceles orders', async()=>{
                    expect(await exchange.orderCancelled(1)).to.equal(true)
                })

                it('Emits Cancel event', async()=>{
                    const event = result.events[0];
                    expect(event.event).to.equal('Cancel')
                    const args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.user).to.equal(user1.address)
                    expect(args.tokenGet).to.equal(token2.address)
                    expect(args.amountGet).to.equal(tokens(1))
                    expect(args.tokenGive).to.equal(token1.address)
                    expect(args.amountGive).to.equal(tokens(1))
                })
            })

            describe('Failure', async()=>{
                it('rejects invalid order id', async()=>{
                    await expect(exchange.connect(user1).cancelOrder(3)).to.be.reverted
                })
                it('rejects unauthorized cacelations', async()=>{
                    await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
                })
            })
        })

        describe('Filling orders', ()=>{
            
            describe('Success', ()=>{
                let transaction, result
                beforeEach(async()=>{
                transaction = await exchange.connect(user2).fillOrder(1)
                result = await transaction.wait()
                })

                it('executes and charges fee', async()=>{
                    // Token Give
                    expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(tokens(0))
                    expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1))
                    expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(tokens(0))
                    // Token get
                    expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1))
                    expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9))
                    expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1))
                })

                it('moves order to order filled list', async()=>{
                    expect(await exchange.orderFilled(1)).to.equal(true)
                })

                it('emits a Trade event', async () => {
                    const event = result.events[0]
                    expect(event.event).to.equal('Trade')
             
                    const args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.user).to.equal(user2.address)
                    expect(args.tokenGet).to.equal(token2.address)
                    expect(args.amountGet).to.equal(tokens(1))
                    expect(args.tokenGive).to.equal(token1.address)
                    expect(args.amountGive).to.equal(tokens(1))
                    expect(args.creator).to.equal(user1.address)
                    expect(args.timestamp).to.at.least(1)
                })
            })

            describe('Failure', ()=>{
                it('rejects invalid order id', async()=>{
                    await expect(exchange.connect(user2).fillOrder(2)).to.be.reverted
                })
                    
                it('rejects order that was filled', async()=>{
                    trans = await exchange.connect(user2).fillOrder(1)
                    await trans.wait()
                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                })

                it('rejects order that was cancelled', async()=>{
                    trans = await exchange.connect(user1).cancelOrder(1)
                    await trans.wait()
                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                })
            })

        })

    })

})
