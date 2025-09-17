// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
//import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol';

contract Token is ERC20 {
	/** owner of this token - it would be the address of the Factory, since it created this contract */
	address payable immutable public owner;
	/** the actual user that created this token */
	address immutable public creator;
	/** max number of tokens each holder can have */
	uint256 immutable public HOLDER_CAP;

	// 40% for sale, 20% liquidity pool, 15% for marketing, 15% for team, 10% for reserve
	uint256 constant SUPPLY_PERCENTAGE_FOR_SALE = 40;
	uint256 constant SUPPLY_PERCENTAGE_FOR_LP = 20;
	uint256 constant SUPPLY_PERCENTAGE_FOR_MARKETING = 15;
	uint256 constant SUPPLY_PERCENTAGE_FOR_TEAM = 15;
	uint256 constant SUPPLY_PERCENTAGE_FOR_RESERVE = 10;

	// eventually allow to set this in the constructor, so we could have different amounts according to the token
	uint256 public constant RAISED_GOAL = 3 ether;
    uint256 public constant SOLD_GOAL = 500_000 ether;
	uint256 public constant BASE_PRICE = 0.0001 ether;

	uint256 private sold = 0;
	uint256 private raised = 0;
	bool private available = true;

	constructor(
		address _creator,
		string memory _name,
		string memory _symbol,
		uint256 _totalSupply
	) ERC20(_name, _symbol) {
		owner = payable(msg.sender);
		creator = _creator;

		// set the maximum tokens each holder can obtain to prevent whales, even small whales (holding 1%), therefore set to 0.1% of the supply
		uint256 minHolders = 1000;
		HOLDER_CAP = _totalSupply / minHolders;
		
		//uint256 SALE_SUPPLY = _totalSupply * SUPPLY_PERCENTAGE_FOR_SALE;
		_mint(owner, _totalSupply);
	}

	function getSold() public view returns (uint256) {
		return sold;
	}
	function increaseSold(uint256 _amount) public {
		sold += _amount;
	}

	function getRaised() public view returns (uint256) {
		return raised;
	}
	function increaseRaised(uint256 _amount) public {
		raised += _amount;
	}

	function isAvailable() public view returns (bool) {
		return available;
	}
	function setAvailable(bool _available) public {
		available = _available;
	}

	// calculate the price of one token based upon total bought
	function getCost() public view returns (uint256) {
		uint256 _totalSupply = totalSupply();

		// price increases as more tokens are bought - increases every 10% (threshold) sold
		//uint256 thresholdIncrease = 10; 
        //uint256 _cost = BASE_PRICE + (sold * 0.0001 ether) / (_totalSupply / thresholdIncrease);

		// price increases as fewer tokens remain
		uint256 _cost = BASE_PRICE * (_totalSupply / (_totalSupply - sold));

        return _cost;
    }

	// calculate number of tokens
	function getNumberOfTokensLeftToBuy(address _buyer) public view returns (uint256) {
		uint256 _holderBalance = super.balanceOf(_buyer);
		return HOLDER_CAP - _holderBalance;
	}
}