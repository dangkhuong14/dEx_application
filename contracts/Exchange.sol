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
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

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
        address user, /*This is maker(who create order) */
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp);

    event Trade(
        uint256 id,
        address user,/*This is taker(who fill order)*/
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address creator,
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
        //Require to have enough deposit balances before making new order
        require(tokens[_tokenGive][msg.sender] >= _amountGive);


        orderCount++;
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
        orderCancelled[_id] = true;
        //emit event
        emit Cancel(_id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, _order.timestamp);
    }

    //Fill order(executing order)
    function fillOrder(uint256 _id) public {
        //Must be valid order Id
        require(_id <= orderCount && _id >0);
        //Order is already filled
        require(!orderFilled[_id]);
        //Oder can't be cancelled
        require(!orderCancelled[_id]);

        //Fetch order
        _Order storage _order = orders[_id];
        //Swap token
        _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
        //Update to oderFilled mapping
        orderFilled[_order.id] = true;
    }

    function _trade(
        uint256 _orderId, 
        address _user, 
        address _tokenGet, 
        uint256 _amountGet, 
        address _tokenGive, 
        uint256 _amountGive) 
        internal {
        //Calculate fee amount
        //Fee is paid by the user filled order
        //Fee is deducted from amountGet
        uint256 feeAmount = (_amountGet*feePercent) /100;

        //Do trade here
        //Update deposit balance
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender] - (_amountGet + feeAmount);
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user] + _amountGet;
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender] + _amountGive;
        tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive;

        //Charge fee
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount] + feeAmount;

        //Emit Trade event
        emit Trade(_orderId, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, _user, block.timestamp);
    }
}

