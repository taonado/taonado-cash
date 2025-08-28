// SPDX-License-Identifier: GPL-3.0

// Phase 0 deposit tracker contract.
// This contract is used to associate deposits made by miners back to their hotkeys.
// This contract is isolated from fund storage

pragma solidity ^0.8.24;

interface IDepositTracker {
    function associate(bytes32 hotkey) external returns (bool);

    function associationSetLength(bytes32 hotkey) external view returns (uint);

    function associationSet(
        bytes32 hotkey,
        address addr
    ) external view returns (bool);

    function associations(
        bytes32 hotkey,
        uint index
    ) external view returns (address);
}

contract DepositTracker is IDepositTracker {
    mapping(address => bool) public uniqueDepositors;
    mapping(bytes32 => mapping(address => bool)) public associationSet;
    mapping(bytes32 => address[]) public associations;

    event AddressAssociated(
        address indexed depositor,
        bytes32 indexed hotkey,
        uint256 timestamp
    );

    constructor() {}

    function associate(bytes32 hotkey) public returns (bool) {
        require(
            !associationSet[hotkey][msg.sender] &&
                !uniqueDepositors[msg.sender],
            "Address already associated"
        );
        uniqueDepositors[msg.sender] = true;
        associations[hotkey].push(msg.sender);
        associationSet[hotkey][msg.sender] = true;
        emit AddressAssociated(msg.sender, hotkey, block.timestamp);
        return true;
    }

    function associationSetLength(bytes32 hotkey) public view returns (uint) {
        return associations[hotkey].length;
    }
}
