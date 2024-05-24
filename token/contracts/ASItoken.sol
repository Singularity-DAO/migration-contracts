// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "./Token.sol";

/**
 * @title Artificial Super Intelligence alliance ASI token
 * @notice ability to grant MINTER_ROLE to trusted bridges
 */
contract ASItoken is Token {

    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `MINTER_ROLE` to the
     * account that deploys the contract.
     *
     */
    constructor() Token('Artificial Super Intelligence', 'ASI') {
    }

}
