// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "../EvmValidator.sol";

contract MockUpgradedEvmValidator is EvmValidator {
    // New function for upgrade test
    function newFunction() public pure returns (string memory) {
        return "V2 works!";
    }
}
