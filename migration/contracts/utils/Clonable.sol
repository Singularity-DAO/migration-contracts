// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract Clonable {
    address private _owner;

    event Cloned(address newInstance);

    /*
     * @notice marked the constructor function as payable, because it costs less gas to execute,
     * since the compiler does not have to add extra checks to ensure that a payment wasn't provided.
     * A constructor can safely be marked as payable, since only the deployer would be able to pass funds, 
     * and the project itself would not pass any funds.
     */
    constructor() payable {
        _owner = msg.sender;
    }
    
    function owner() external view returns(address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "ERR_OWNER");
        _;
    }

    function setOwnerAfterClone(address initialOwner) external {
        require(_owner == address(0), "ERR_REINIT");
        _owner = initialOwner;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ERR_ZERO");
        _owner = newOwner;
    }

    function clone(address newOwner) public returns (address newInstance){
        // Copied from https://github.com/optionality/clone-factory/blob/master/contracts/CloneFactory.sol
        bytes20 addressBytes = bytes20(address(this));
        assembly {
            // EIP-1167 bytecode
            let clone_code := mload(0x40)
            mstore(clone_code, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone_code, 0x14), addressBytes)
            mstore(add(clone_code, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            newInstance := create(0, clone_code, 0x37)
        }
        emit Cloned(newInstance);
        Clonable(newInstance).setOwnerAfterClone(newOwner);
    }
    
    function getClone() external returns (address) {
        return clone(msg.sender);
    }
}

