// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "./Token.sol";

/**
 * @title Singularity Finance SFI token
 * @notice ability to grant MINTER_ROLE to trusted bridges
 */
contract SFItoken is Token {

    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `MINTER_ROLE` to the
     * account that deploys the contract.
     *
     */
    constructor() Token('Singularity Finance', 'SFI') {
    }

}
