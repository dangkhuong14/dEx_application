// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange{
    address public feeAccount;
    uint256 public feePercent;
    uint256 public orderCount;

    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public ordersCancelled;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp);

    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp);

    struct _Order{
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    constructor(address _feeAccount, uint256 _feePercent){
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function depositToken(address _token, uint256 _amount) 
    public {
        // Transfer token to exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        //manage how many token that user deposited in (update balance)
        tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;
        //Emit event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) 
    public {
        //Ensure user have enough deposit tokens to withdraw
        require(tokens[_token][msg.sender] >= _amount);
        //Transfer token to user
        Token(_token).transfer(msg.sender, _amount);
        //Update deposit balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
        //Emit event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    //Check balance of deposit(wrapper function of tokens mapping)
    function balanceOf(address _token, address _user) 
    public
    view
    returns (uint256){
        return tokens[_token][_user];
    }

    //Make and cancel order

    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) 
    public{
        //Require to have enogh deposit balances before making new order
        require(tokens[_tokenGive][msg.sender] >= _amountGive);


        orderCount = orderCount + 1;
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );

        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    }

    function cancelOrder(uint256 _id) public{
        //fetch the order 
        _Order storage _order = orders[_id];
        //Check order id
        require(_order.id == _id);
        //Ensure the caller of cancel function is the owner of that order (coercing data type:address)
        require(address(_order.user) == msg.sender);
        //Cancel order
        ordersCancelled[_id] = true;
        //emit event
        emit Cancel(_id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, _order.timestamp);
    }
}

