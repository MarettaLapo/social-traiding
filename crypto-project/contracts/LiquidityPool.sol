// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ITraidingAccount} from "./mocks/ITraidingAccount.sol";

contract LiquidityPool{
    
    //bool startFundraise = false;
    // uint256 withdrawStartTime; // когда начнется 24 часа на вывод
    // uint256 withdrawStopTime;// когда закончится 24 часа на вывод

    uint public perfomanseFee = 5;
    uint public balance = 0;//баланс, который занесли нам инвесторы
    uint public finalbalance = 0;//баланс, который после торговли
    bool public canTraiding = false;
    uint256 public fundrisingStopTime;//когда закончится время на ввод денег
    uint256 public timeForWithdraw; //24 часа на вывод 
    uint256 public timeForStopTraiding; // 30 дней на торговлю
    address public managerAddress;
    uint public managerFee;
    IERC20 USDC;
    ITraidingAccount traidingAccount;

    mapping (address => uint) ownerTokenCount;


    event ownerProvidedToken(address indexed owner, uint amountToken);
    event ownerWithDrawToken(address indexed owner, uint amountToken);
    event managerfeeCalculated(address indexed owner, uint managerFee);

    constructor(address manager, IERC20 _USDC, uint256 fundrisingDuration, uint256 timeForTraiding, ITraidingAccount traidAc){
        require(manager != address(0) );
        managerAddress = manager;
        traidingAccount = traidAc;
        USDC = _USDC;
        fundrisingStopTime = block.timestamp + fundrisingDuration;
        timeForStopTraiding = fundrisingStopTime + timeForTraiding;
        // timeForWithdraw = _timeForWithdraw;
    }

    receive() payable external{}

    function provide(uint amountToken) public{
       require(block.timestamp < fundrisingStopTime, "fundrising was finished");
       ownerTokenCount[msg.sender] += amountToken; 
       balance += amountToken;
       USDC.transferFrom(msg.sender, address(this), amountToken);

       emit ownerProvidedToken(msg.sender, amountToken);
    }

    function withdraw() public {
        // require(block.timestamp >  withdrawStartTime, "time for vyvod escho ne nastalo");
        // require(block.timestamp <  withdrawStopTime, "time for vyvod yche prochlo");
        require(block.timestamp > timeForStopTraiding, "still phase traiding");
        require(ownerTokenCount[msg.sender] > 0, "you dont have money");
        uint amountLPToken =  finalbalance * ownerTokenCount[msg.sender] /  balance;
        ownerTokenCount[msg.sender] = 0;
        USDC.transfer(msg.sender, amountLPToken);

        emit ownerWithDrawToken(msg.sender, amountLPToken);
    }

    function startTraiding() public{
        require(managerAddress == msg.sender, "you are not manager");
        require(block.timestamp > fundrisingStopTime, "echo nelzuy torgovat");
        require(block.timestamp < timeForStopTraiding, "traiding was finished");
        canTraiding = true;
    }


    function swapUSDCtoETH(uint amountToken) public{
        require(managerAddress == msg.sender, "error usdc to eth");
        require(canTraiding == true, "this is not phase traiding");
        USDC.approve(address(traidingAccount), amountToken);
        traidingAccount.swapUSDCtoETHUniswap(amountToken);
    }

    function swapETHtoUSDC(uint amountToken)public {
        require(managerAddress == msg.sender, "error eth to usdc");
        require(canTraiding == true, "this is not phase traiding");
        traidingAccount.swapETHtoUSDCUniswap{value: amountToken}();
    }


    function calculateManagerFee() public returns(uint){
        if(USDC.balanceOf(address(this)) <= balance){
            managerFee = 0;
            emit managerfeeCalculated(msg.sender, managerFee);
            return managerFee;
        }
        else {
            uint pnl = uint256(USDC.balanceOf(address(this))) - uint256(balance);
            managerFee = pnl * uint256(perfomanseFee) / 100;
            USDC.transfer(managerAddress, managerFee);
            emit managerfeeCalculated(msg.sender, managerFee);
            return managerFee;
        }
    }

    function closeTraiding() public{
        require(block.timestamp > timeForStopTraiding, "still phase traiding");
        traidingAccount.swapETHtoUSDCUniswap{value: address(this).balance}();
        calculateManagerFee();
        finalbalance = USDC.balanceOf(address(this));
        canTraiding = false;
        // withdrawStartTime = block.timestamp;
        // withdrawStopTime = block.timestamp + timeForWithdraw;
    }

    function getOwnerTokenCount(address _address) public view returns (uint){
        return ownerTokenCount[_address];
    }

}
