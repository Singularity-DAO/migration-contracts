// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IBurnableERC20 {
    function burnFrom(address to, uint256 amount) external;
}