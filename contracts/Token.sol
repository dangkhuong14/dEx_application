// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token{
    string public name = "Dapp token";
    string public symbol = "DAPP";
    uint256 public decimals = 18;
    uint256 public totalSupply = 1000000 * (10**decimals); //1,000,000 * 10^18
    mapping (address => uint256) public balanceOf;

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply){
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10**decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public 
    returns (bool success){ 
        //update balance after transfer
        balanceOf[msg.sender] = balanceOf[msg.sender] - _value;
        balanceOf[_to] = balanceOf[_to] + _value;

    }
}

