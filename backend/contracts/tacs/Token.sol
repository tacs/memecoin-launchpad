// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
	address payable immutable public owner;
	address immutable public creator;

	uint256 public sold = 0;
	uint256 public raised = 0;
	bool public isAvailable = true;

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
}