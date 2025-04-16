// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "../metagraph.sol";

contract MockMetagraph is IMetagraph {
    // --- State Variables ---

    // Mapping: netuid -> uid_count
    mapping(uint16 => uint16) private _uidCounts;

    // Mapping: netuid -> uid -> hotkey
    mapping(uint16 => mapping(uint16 => bytes32)) private _hotkeys;

    // Mapping: netuid -> uid -> stake
    mapping(uint16 => mapping(uint16 => uint64)) private _stakes;

    // --- Mock Setup Functions ---

    function setUidCount(uint16 netuid, uint16 count) external {
        _uidCounts[netuid] = count;
    }

    function setHotkey(uint16 netuid, uint16 uid, bytes32 hotkey) external {
        _hotkeys[netuid][uid] = hotkey;
        // Ensure uidCount is at least uid + 1 if setting a hotkey
        if (_uidCounts[netuid] <= uid) {
            _uidCounts[netuid] = uid + 1;
        }
    }

    function setStake(uint16 netuid, uint16 uid, uint64 stake) external {
        _stakes[netuid][uid] = stake;
    }

    // --- IMetagraph Implementation ---

    function getUidCount(
        uint16 netuid
    ) external view override returns (uint16) {
        return _uidCounts[netuid];
    }

    function getHotkey(
        uint16 netuid,
        uint16 uid
    ) external view override returns (bytes32) {
        return _hotkeys[netuid][uid];
    }

    function getStake(
        uint16 netuid,
        uint16 uid
    ) external view override returns (uint64) {
        return _stakes[netuid][uid];
    }

    // --- Default Implementations for unused functions (return 0 or false) ---

    function getRank(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (uint16) {
        return 0;
    }

    function getTrust(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (uint16) {
        return 0;
    }

    function getConsensus(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (uint16) {
        return 0;
    }

    function getIncentive(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (uint16) {
        return 0;
    }

    function getDividends(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (uint16) {
        return 0;
    }

    function getEmission(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (uint64) {
        return 0;
    }

    function getVtrust(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (uint16) {
        return 0;
    }

    function getValidatorStatus(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (bool) {
        return false;
    }

    function getLastUpdate(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (uint64) {
        return 0;
    }

    function getIsActive(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (bool) {
        // Default to true, assuming UIDs used in tests are active unless specified otherwise
        return true;
    }

    function getAxon(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (AxonInfo memory) {
        // Return an empty AxonInfo struct
        return AxonInfo(0, 0, 0, 0, 0, 0);
    }

    function getColdkey(
        uint16 /* netuid */,
        uint16 /* uid */
    ) external pure override returns (bytes32) {
        return bytes32(0);
    }
}
