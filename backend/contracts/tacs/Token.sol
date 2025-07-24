// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
	address payable immutable public owner;
	address immutable public creator;

	// eventually allow to set this in the constructor, so we could have different amounts according to the token
	uint256 public constant RAISED_GOAL = 3 ether;
    uint256 public constant SOLD_GOAL = 500_000 ether;
	uint256 public constant COST_STEP = 0.0001 ether;

	uint256 private sold = 0;
	uint256 private raised = 0;
	bool private available = true;

	constructor(
		address _creator,
		string memory _name,
		string memory _symbol,
		uint _totalSupply
	) ERC20(_name, _symbol) {
		/** owner of this token - it would be the address of the Factory, since it created this contract */
		owner = payable(msg.sender);
		/** the actual user that created this token */
		creator = _creator;

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
        uint256 _floor = 0.0001 ether;
        uint256 _increment = 10000 ether;

        uint256 _cost = (COST_STEP * (sold / _increment)) + _floor;
        return _cost;
    }
}