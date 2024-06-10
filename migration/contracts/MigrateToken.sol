// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IBurnableERC20.sol";
import "./interfaces/IMintableERC20.sol";
import "./utils/Clonable.sol";

/*
 * @title a contract to migrate from one token to another using a configurable conversion ratio
 * @notice contract supports mintable tokens or just transfers preminted tokens 
 * @notice contract supports burnable tokens or transfers the old tokens to a configurable burn address
 * @notice contract implements EIP-1167 minimal proxy pattern
 * @notice contract only supports tokens implementing IERC20Metadata
 * @notice contract does not support tokens using Fee-on-transfer
 */
contract MigrateToken is Clonable, Pausable {
    using SafeERC20 for IERC20;

    bytes32 private constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    
    address public oldToken; // old token this migration contract takes as input
    address public newToken; // new token this migration contract returns as output
    uint256 public conversionRatio; // 1 old token converts to an amount of new tokens, this is the conversionRatio
    uint256 public oldTokenPrecision; // precision for 1 old token
    bool public isOldTokenBurnable; // configure to burn or transfer old tokens to burn address
    bool public isNewTokenMintable; // configure to mint or transfer preminted new tokens from contract
    address public burnAddress; // configurable burn address

    event Initialized(address _oldToken,
                      address _newToken,
                      uint256 _conversionRatio,
                      bool _isOldTokenBurnable,
                      bool _isNewTokenMintable,
                      address _burnAddress);
    event Migrated(address indexed user, address old_token, address new_token, uint256 old_amount, uint256 new_amount);
    
    error NotInitialized();
    error AlreadyInitialized();
    error MissingOldToken();
    error MissingNewToken();
    error MissingConversionRatio();
    error MissingBurnAddress();
    error ZeroAmountOut();
    error MissingAllowance(address token, uint256 allowance, uint256 amountNeeded);
    error NotEnoughBalance(address token, uint256 balance, uint256 amountNeeded, address holder);

    /*
     * @dev initialize function to setup cloned instance
     * @notice marked the initialize function as payable, because it costs less gas to execute,
     * since the compiler does not have to add extra checks to ensure that a payment wasn't provided.
     */
    function initialize(
        address _oldToken,
        address _newToken,
        uint256 _conversionRatio,
        bool _isOldTokenBurnable,
        bool _isNewTokenMintable,
        address _burnAddress)
        external payable onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (oldToken != address(0)) revert AlreadyInitialized();
        if (_oldToken == address(0)) revert MissingOldToken();
        if (_newToken == address(0)) revert MissingNewToken();
        if (_conversionRatio == 0) revert MissingConversionRatio();
        if (!_isOldTokenBurnable && _burnAddress == address(0)) revert MissingBurnAddress();
        oldToken = _oldToken;
        newToken = _newToken;
        conversionRatio = _conversionRatio;
        oldTokenPrecision = 10 ** IERC20Metadata(_oldToken).decimals();
        isOldTokenBurnable = _isOldTokenBurnable;
        isNewTokenMintable = _isNewTokenMintable;
        burnAddress = _burnAddress;
        _grantRole(PAUSE_ROLE, msg.sender);
        emit Initialized(_oldToken,
                         _newToken,
                         _conversionRatio,
                         _isOldTokenBurnable,
                         _isNewTokenMintable,
                         _burnAddress);
    }

    /*
     * @dev pause migration
     */
    function pause() external onlyRole(PAUSE_ROLE) {
        _pause();
    }

    /*
     * @dev unpause migration
     */
    function unpause() external onlyRole(PAUSE_ROLE) {
        _unpause();
    }
    
    /*
     * @dev recover preminted tokens locked in migration contract
     */
    function recoverTokens(uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address _newToken = newToken;
        _requireTokenBalance(_newToken, _amount, address(this));
        IERC20(_newToken).safeTransfer(msg.sender, _amount);
    }

    /*
     * @dev external function to migrate full old token balance of caller
     */
    function migrateAllTokens() external {
        _checkInitialization();
        address _oldToken = oldToken;
        uint256 _amount = IERC20(_oldToken).balanceOf(address(msg.sender));
        _requireTokenAllowance(_oldToken, _amount);
        _migrateTokens(_amount);
    }

    /*
     * @dev external function to migrate a specific amount of old tokens
     */
    function migrateTokens(uint256 _amount) external {
        _checkInitialization();
        address _oldToken = oldToken;
        _requireTokenBalance(_oldToken, _amount, msg.sender);
        _requireTokenAllowance(_oldToken, _amount);
        _migrateTokens(_amount);
    }
    
    /*
     * @dev private function to do the actual migration
     */
    function _migrateTokens(uint256 _oldTokenAmount) private whenNotPaused {
        address _oldToken = oldToken;
        if (isOldTokenBurnable) {
            IBurnableERC20(_oldToken).burnFrom(msg.sender, _oldTokenAmount);
        } else {
            IERC20(_oldToken).safeTransferFrom(msg.sender, burnAddress, _oldTokenAmount);
        }
        uint256 _newTokenAmount = _oldTokenAmount * conversionRatio / oldTokenPrecision;
        if (_newTokenAmount == 0) revert ZeroAmountOut();
        address _newToken = newToken;
        if (isNewTokenMintable) {
            IMintableERC20(_newToken).mint(msg.sender, _newTokenAmount);
        } else {
            _requireTokenBalance(_newToken, _newTokenAmount, address(this));
            IERC20(_newToken).safeTransfer(msg.sender, _newTokenAmount);
        }
        emit Migrated(msg.sender, _oldToken, _newToken, _oldTokenAmount, _newTokenAmount);
    }
    
    /*
     * @dev private function to check if contract has been initialized
     */
    function _checkInitialization() private view {
        if (oldToken == address(0)) revert NotInitialized();    
    }

    /*
     * @dev private function to implement gas efficient modifier check for old token allowance
     */
    function _requireTokenAllowance(address _token, uint256 _amount) private view {
        uint256 _allowance = IERC20(_token).allowance(address(msg.sender), address(this));
        if (_allowance < _amount) revert MissingAllowance(_token, _allowance, _amount);
    }

    /*
     * @dev private function to implement gas efficient modifier check for old token balance
     */
    function _requireTokenBalance(address _token, uint256 _amount, address _holder) private view {
        uint256 _balance = IERC20(_token).balanceOf(_holder);
        if (_balance < _amount) revert NotEnoughBalance(_token, _balance, _amount, _holder);
    }

}
