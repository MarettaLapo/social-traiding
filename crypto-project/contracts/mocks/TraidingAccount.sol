// SPDX-License-Identifier: UNLICENSED returns uint
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ITraidingAccount} from "./ITraidingAccount.sol";
import {console} from "hardhat/console.sol";

contract TraidingAccount is ITraidingAccount{

IERC20 USDC;
ITraidingAccount traidingAccount;
address LP;
uint256 public currency = 2000;

constructor( IERC20 _USDC){
USDC = _USDC;
}

receive()payable external{}

function swapUSDCtoETHUniswap(uint amountToken) public override payable{
uint amountETH = (uint256(amountToken) * 1e12) / currency;
USDC.transferFrom(msg.sender, address(this), amountToken);
payable(msg.sender).transfer(amountETH);

}

function swapETHtoUSDCUniswap()public override payable {
uint256 amountUSDC = (uint256(currency) * uint256(msg.value)) / 1e12;
USDC.transfer(msg.sender, amountUSDC);
}

function setCurrency(uint256 value) external {
currency = value;
}
}