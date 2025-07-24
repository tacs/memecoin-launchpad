// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Poll {
    string name;
    uint startDate;
    mapping(address => Voter) voters;

    struct Voter {
        address user;
        string name;
        uint age;
        bool voted;
    }

    event Log(string message);
    event Voted(address indexed _user, uint timestamp);

    constructor(string memory _name, uint _startDate) {
        name = _name;
        startDate = _startDate;
    }

    /*modifier onlyOwner {
		require(msg.sender == owner, 'Only the voter himself can express his/her vote');
		_;
	}*/

    modifier hasPollStarted() {
        require(block.timestamp >= startDate, "Polls have not started yet!");
        _;
    }

    function addVoter(address _address, string memory _name, uint _age) public {
        voters[_address] = Voter(_address, _name, _age, false);
        emit Log(string.concat("Added: ", addressToString(_address)));
    }

    function getVoter(address _address) public view returns (Voter memory) {
        Voter storage voter = voters[_address];
        return (voter);
    }

    function vote(address _address) public hasPollStarted {
        voters[_address].voted = true;
        emit Voted(msg.sender, block.timestamp);
		emit Log(string.concat("Voted: ", addressToString(_address)));
    }







    receive() external payable {}

    function checkBalance() public view returns (uint) {
        return address(this).balance;
    }

    function transfer(address payable _to) public payable {
        (bool sent, ) = _to.call{value: msg.value}("");
        require(sent, "Failed");
    }

    function getBlockInfo()
        public
        view
        returns (uint, address, uint, uint, uint, uint)
    {
        return (
            block.chainid,
            block.coinbase,
            //block.difficulty,
            block.prevrandao,
            block.gaslimit,
            block.number,
            block.timestamp
        );
    }

    function setName(string memory _name) public {
        name = _name;
    }

    function getName() public view returns (string memory) {
        return name;
    }

    function pay(address payable _to, uint256 _value) public payable {
        // msg, tx, block
        _to.transfer(_value);
    }

    function addressToString(
        address _address
    ) internal pure returns (string memory) {
        bytes32 _bytes = bytes32(uint256(uint160(_address)));
        bytes memory HEX = "0123456789abcdef";
        bytes memory _string = new bytes(42);
        _string[0] = "0";
        _string[1] = "x";
        for (uint i = 0; i < 20; i++) {
            _string[2 + i * 2] = HEX[uint8(_bytes[i + 12] >> 4)];
            _string[3 + i * 2] = HEX[uint8(_bytes[i + 12] & 0x0f)];
        }
        return string(_string);
    }
}
