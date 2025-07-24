// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { Token } from './Token.sol';

// getters require gas for read on-chain, so unless some extra logic is required, using the auto-generated getters suffice
// immutables can only be set once, so it would be mostly about providing a better API / interface to consumers, not really security

contract Factory {
	uint256 public constant TOTAL_SUPPLY = 1_000_000 ether;

	/** fee */
	uint256 public immutable fee;
    /** the deployer */
    address public immutable owner;

	mapping(address => Token) private tokens;
    address[] private tokenKeys;

	event Created(address indexed token);
    event Bought(address indexed token, uint256 amount);

    constructor(uint256 _fee) {
		owner = msg.sender;
        fee = _fee;
    }

	function getTokenKeys() public view returns (address[] memory) {
		return tokenKeys;
	}
	
    function getTokenKey(uint idx) public view returns (address) {
        return tokenKeys[idx];
    }

	/**
	 * more gas efficient to return the length of the array than to store it in a variable, as i've seen some code online
	 * mostly because the other variable would need to be updated whenever pushing or poping an element, even though reading is the same
	*/
    function getTokensLength() public view returns (uint) {
        return tokenKeys.length;
    }

    function getTokenByKeyIdx(
        uint _idx
    ) public view returns (Token) {
        return tokens[tokenKeys[_idx]];
    }

    function getToken(
        address addr
    ) public view returns (Token) {
        return tokens[addr];
    }

    function create(
        string calldata _name,
        string calldata _symbol
    ) external payable returns (address) {
        // make sure fee is covered
        require(msg.value >= fee, string(abi.encodePacked('Fee is low, it needs to be equal or greater than ', fee)));

		// the creator of the token
        address _creator = msg.sender;

		// total supply - could eventually be set by the creator
		uint256 _totalSupply = TOTAL_SUPPLY;

		// @gas: using values directly instead of saving it to temporary variable would decrease gas cost (eg. _creator/msg.sender)
        // create a new token
        Token _token = new Token(_creator, _name, _symbol, _totalSupply);
        address _tokenAddress = address(_token);

        // save the token
        tokenKeys.push(_tokenAddress);
        tokens[_tokenAddress] = _token;

        emit Created(_tokenAddress);

		return _tokenAddress;
    }

    function buy(
		address _tokenAddress,
		uint256 _amount
	) external payable {
        Token _token = tokens[_tokenAddress];

        // check conditions
        require(_token.isAvailable(), 'This token has reached its goal, its not available anymore');
        require(_amount >= 1 ether, 'Amount too low, it needs to be equal or greater than 1');
        require(_amount < 10 ether, 'Amount too high, it needs to be lower than 10');

        uint256 _price = _token.getCost() * (_amount / 1 ether);

        // make sure enough eth is sent
        require(msg.value >= _price, string(abi.encodePacked('Not enough ETH, it needs to be at least ', _price)));

        // update sale
		_token.increaseSold(_amount);
        _token.increaseRaised(msg.value);

        // make sure raised goal nor sold goal arent met
        if (_token.getSold() >= _token.SOLD_GOAL() || _token.getRaised() >= _token.RAISED_GOAL()) {
            _token.setAvailable(false);
        }

		// transfer tokens
		_token.transfer(msg.sender, _amount);

        // @gas: if i didnt have the _token variable created, i could simply do the following and save the _token's allocation gas cost
		// Token(_tokenAddress).transfer(msg.sender, _amount);

        // emit an event
		emit Bought(_tokenAddress, _amount);
    }

	function deposit(
		address _tokenAddress
	) external payable {
		// the remaining token balance and the ETH raised would go into a liquidity pool like Uniswap V3
		// for simplicity, we will just transfer remaining tokens and ETH raised to the creator
		Token _token = tokens[_tokenAddress];

		// check if its still available
		require(!_token.isAvailable(), 'Target not reached yet');

		// transfer tokens
        _token.transfer(_token.creator(), _token.balanceOf(address(this)));

		// transfer eth raised
		(bool _success, ) = payable(_token.creator()).call{value: _token.getRaised()}('');
		require(_success, 'ETH deposit failed');
	}

	function withdraw(
		uint256 _amount
	) external payable {
		// check owner
		require(msg.sender == owner, 'You cannot withdraw');

		// transfer eth raised
		(bool _success, ) = payable(owner).call{value: _amount}('');
		require(_success, 'ETH withdraw failed');
	}
}
