// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { Token } from './Token.sol';

// getters require gas for read on-chain, so unless some extra logic is required, using the auto-generated getters suffice
// immutables can only be set once, so it would be mostly about providing a better API / interface to consumers, not really security

contract Factory {
    uint256 public constant MAX_RAISED = 3 ether;
    uint256 public constant MAX_SOLD = 500_000 ether;
    
	/** fee */
	uint256 public immutable fee;
    /** the deployer */
    address public immutable owner;

	mapping(address => TokenSale) private tokens;
    address[] private tokenIdxs;

    struct TokenSale {
        address token;
        uint256 sold;
        uint256 raised;
        bool isAvailable;
    }

	event Created(address indexed token);
    event Bought(address indexed token, uint256 amount);

    constructor(uint256 _fee) {
		owner = msg.sender;
        fee = _fee;
    }

	function getTokens() public view returns (address[] memory) {
		return tokenIdxs;
	}
	
    function getToken(uint idx) public view returns (address) {
        return tokenIdxs[idx];
    }

	/**
	 * more gas efficient to return the length of the array than to store it in a variable, as i've seen some code online
	 * mostly because the other variable would need to be updated whenever pushing or poping an element, even though reading is the same
	*/
    function getTokensLength() public view returns (uint) {
        return tokenIdxs.length;
    }

    function getTokenSaleByIdx(
        uint _idx
    ) public view returns (TokenSale memory) {
        return tokens[tokenIdxs[_idx]];
    }

    function getTokenSaleByAddress(
        address addr
    ) public view returns (TokenSale memory) {
        return tokens[addr];
    }

    function getCost(uint256 _sold) public pure returns (uint256) {
        uint256 floor = 0.0001 ether;
        uint256 step = 0.0001 ether;
        uint256 increment = 10000 ether;

        uint256 cost = (step * (_sold / increment)) + floor;
        return cost;
    }

    function create(
        string calldata _name,
        string calldata _symbol
    ) external payable {
        // make sure fee is correct
        require(msg.value >= fee, 'Fee is not enough');

        address _owner = msg.sender;

        // create a new token
        Token token = new Token(_owner, _name, _symbol, 1_000_000 ether);
        address tokenAddress = address(token);

        // save the token
        tokenIdxs.push(tokenAddress);

        // list the token
        TokenSale memory sale = TokenSale(
            tokenAddress,
            0,
            0,
            true
        );
        tokens[tokenAddress] = sale;

        emit Created(tokenAddress);
    }

    function buy(
		address _token,
		uint256 _amount
	) external payable {
        TokenSale storage sale = tokens[_token];

        // check conditions
        require(sale.isAvailable, 'Buying is closed');
        require(_amount >= 1 ether, 'Amount too low');
        require(_amount <= 10000 ether, 'Amount exceeded');

        // calculate the price of one token based upon total bought
        uint256 cost = getCost(sale.sold);

        uint256 price = cost * (_amount / 10 ** 18);

        // make sure enough eth is sent
        require(msg.value >= price, 'Insufficient ETH received!');

        // update sale
        sale.sold += _amount;
        sale.raised += price;

        // make sure fund raising goal isnt met
        if (sale.sold >= MAX_SOLD || sale.raised >= MAX_RAISED) {
            sale.isAvailable = false;
        }

		// transfer tokens
        Token(_token).transfer(msg.sender, _amount);

        // emit an event
		emit Bought(_token, _amount);
    }

	function deposit(
		address _token
	) external payable {
		// the remaining token balance and the ETH raised would go into a liquidity pool like Uniswap V3
		// for simplicity, we will just transfer remaining tokens and ETH raised to the creator
		Token token = Token(_token);
		TokenSale memory sale = tokens[_token];

		require(!sale.isAvailable, 'Target not reached');

		// transfer tokens
        token.transfer(token.creator, token.balanceOf(address(this)));

		// transfer eth raised
		(bool success, ) = payable(sale.creator).call{value: sale.raised}('');
		require(success, 'Eth deposit failed');
	}

	function withdraw(
		uint256 _amount
	) external payable {
		require(msg.sender == owner, 'Not the owner');

		// transfer eth raised
		(bool success, ) = payable(owner).call{value: _amount}('');
		require(success, 'Eth withdraw failed');
	}
}
