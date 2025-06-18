// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "../neuron.sol";

contract MockNeuron is INeuron {
    // --- State Variables ---

    // Control whether setWeights should revert
    bool public shouldRevertSetWeights = false;

    // Store the most recent setWeights call
    uint16 public lastNetuid;
    uint16[] public lastDests;
    uint16[] public lastWeights;
    uint64 public lastVersionKey;

    // --- Mock Setup Functions ---

    function setShouldRevertSetWeights(bool shouldRevert) external {
        shouldRevertSetWeights = shouldRevert;
    }

    // --- INeuron Implementation ---
    function setWeights(
        uint16 netuid,
        uint16[] memory dests,
        uint16[] memory weights,
        uint64 versionKey
    ) external payable override {
        if (shouldRevertSetWeights) {
            revert("MockNeuron: setWeights reverted");
        }
        // Store the most recent call
        lastNetuid = netuid;
        lastDests = dests;
        lastWeights = weights;
        lastVersionKey = versionKey;
    }

    // Helper to get the last setWeights state
    function getLastSetWeights()
        external
        view
        returns (
            uint16 netuid,
            uint16[] memory dests,
            uint16[] memory weights,
            uint64 versionKey
        )
    {
        return (lastNetuid, lastDests, lastWeights, lastVersionKey);
    }

    // --- Unused Functions (empty implementations) ---

    function burnedRegister(uint16 netuid, bytes32 hotkey) external payable override {
        // Empty implementation
    }

    function serveAxon(
        uint16 netuid,
        uint32 version,
        uint128 ip,
        uint16 port,
        uint8 ipType,
        uint8 protocol,
        uint8 placeholder1,
        uint8 placeholder2
    ) external payable override {
        // Empty implementation
    }

    function serveAxonTls(
        uint16 netuid,
        uint32 version,
        uint128 ip,
        uint16 port,
        uint8 ipType,
        uint8 protocol,
        uint8 placeholder1,
        uint8 placeholder2,
        bytes memory certificate
    ) external payable override {
        // Empty implementation
    }

    function servePrometheus(
        uint16 netuid,
        uint32 version,
        uint128 ip,
        uint16 port,
        uint8 ipType
    ) external payable override {
        // Empty implementation
    }

    function commitWeights(uint16 netuid, bytes32 commitHash) external payable override {
        // Empty implementation
    }

    function revealWeights(
        uint16 netuid,
        uint16[] memory uids,
        uint16[] memory values,
        uint16[] memory salt,
        uint64 versionKey
    ) external payable override {
        // Empty implementation
    }
} 