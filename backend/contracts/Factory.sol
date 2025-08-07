// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

//import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import './Token.sol';


// getters require gas for read on-chain, so unless some extra logic is required, using the auto-generated getters suffice
// immutables can only be set once, so it would be mostly about providing a better API / interface to consumers, not really security

//contract Factory is Initializable {
contract Factory {
	uint256 public constant MAX_TOTAL_SUPPLY = 1_000_000_000 ether;
	uint256 public constant MIN_TOTAL_SUPPLY = 1_000_000 ether;

	/** fee */
	uint256 public immutable fee;
    /** the deployer */
    address public immutable owner;
	/** all the addresses of the tokens */
    address[] private tokens;

	struct TokenData {
		address addr;
		bool available;
		address creator;
		string name;
		uint256 raised;
		uint256 sold;
		string symbol;
	}
	mapping(address => TokenData) tokenss;

	event Created(address indexed token);
    event Bought(address indexed token, uint256 amount, uint256 value);

    constructor(uint256 _fee) {
		owner = msg.sender;
        fee = _fee;
    }

	/*function initialize() initializer public {
    }*/

	function getTokenn(address addr) public view returns (TokenData memory) {
		return tokenss[addr];
	}
	
    function getToken(uint256 idx) public view returns (address) {
        return tokens[idx];
    }

	/**
	 * more gas efficient to return the length of the array than to store it in a variable, as i've seen a few articles online doing it
	 * mostly because the other variable would need gas to be updated whenever pushing or poping an element, however reading is the same gas
	*/
    function getTokensLength() public view returns (uint) {
        return tokens.length;
    }

    function create(
        string calldata _name,
        string calldata _symbol,
		uint256 _totalSupply
    ) external payable returns (address) {
        // make sure fee is covered
        require(msg.value >= fee, string(abi.encodePacked('Fee is low, it needs to be equal or greater than ', fee)));

		// make sure total supply is between the limits
		require(_totalSupply >= MIN_TOTAL_SUPPLY, string(abi.encodePacked('Total Supply cannot deceed ', MIN_TOTAL_SUPPLY)));
		require(_totalSupply <= MAX_TOTAL_SUPPLY, string(abi.encodePacked('Total Supply cannot exceed ', MAX_TOTAL_SUPPLY)));

		// the creator of the token
        address _creator = msg.sender;

		// @gas: using values directly instead of saving it to temporary variable would decrease gas cost (eg. _creator/msg.sender)
        // create a new token
        Token _token = new Token(_creator, _name, _symbol, _totalSupply);
        address _tokenAddress = address(_token);

        // save the token
        tokens.push(_tokenAddress);

        emit Created(_tokenAddress);

		return _tokenAddress;
    }

    function buy(
		address _tokenAddress,
		uint256 _amount
	) external payable {
        Token _token = Token(_tokenAddress);

        // check conditions
        require(_token.isAvailable(), 'This token has reached its goal, its not available anymore');
        require(_amount >= 1 ether, 'Amount too low, it needs to be equal or greater than 1');
        require(_amount <= 100 ether, 'Amount too high, it needs to be lower than 100');

		uint256 _value = msg.value;
        uint256 _price = _token.getCost() * (_amount / 1 ether);

        // make sure enough eth is sent
        require(_value >= _price, string(abi.encodePacked('Not enough ETH, it needs to be at least ', _price)));

        // update sale
		_token.increaseSold(_amount);
        _token.increaseRaised(_value);

        // make sure raised goal nor sold goal arent met
        if (_token.getSold() >= _token.SOLD_GOAL() || _token.getRaised() >= _token.RAISED_GOAL()) {
            _token.setAvailable(false);
        }

		// transfer tokens
		_token.transfer(msg.sender, _amount);

        // emit an event
		emit Bought(_tokenAddress, _amount, _value);
    }

	function deposit(
		address _tokenAddress
	) external payable {
		// the remaining token balance and the ETH raised would go into a liquidity pool like Uniswap V3
		// for simplicity, we will just transfer remaining tokens and ETH raised to the creator
		Token _token = Token(_tokenAddress);

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
