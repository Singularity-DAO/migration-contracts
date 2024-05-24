// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "../interfaces/IMintableERC20.sol";

/*
 * @title Test token
 * @notice mintable and burnable test token
 */
contract TestToken is IMintableERC20, ERC20Burnable {
    uint8 public immutable tokenDecimals;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) 
        ERC20(_name, _symbol) {
        tokenDecimals = _decimals;
    }
    
    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }

    
    function mint(address _recipient, uint256 _amount) external override {
        _mint(_recipient, _amount);
    }
}