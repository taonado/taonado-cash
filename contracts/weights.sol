// SPDX-License-Identifier: GNU GPLv3

pragma solidity ^0.8.24;

import "./IWTAO.sol";
import "./deposit.sol";
import "./metagraph.sol";

contract WeightsV1 {
    IWTAO public wtao;
    IMetagraph public metagraph;
    IDepositTracker public depositTracker;

    uint16 public netuid;

    constructor(
        uint16 _netuid,
        address _depositTracker,
        address _wtao,
        address _metagraph
    ) {
        netuid = _netuid;
        wtao = IWTAO(_wtao);
        metagraph = IMetagraph(_metagraph);
        depositTracker = IDepositTracker(_depositTracker);
    }

    /**
     * @dev Calculates the weights (wtao balances) for the currently registered miners
     * @return dests Array of destination UIDs
     * @return weights Array of corresponding weights based on WTAO balances. These weights need to be normalized.
     */
    function getWeights()
        public
        view
        returns (uint16[] memory dests, uint256[] memory weights)
    {
        uint16 uidCount = metagraph.getUidCount(netuid);
        dests = new uint16[](uidCount);
        weights = new uint256[](uidCount);

        for (uint16 uid = 0; uid < uidCount; uid++) {
            dests[uid] = uid;
            bytes32 hotkey = metagraph.getHotkey(netuid, uid);
            for (
                uint256 i = 0;
                i < depositTracker.associationSetLength(hotkey);
                i++
            ) {
                address depositer = depositTracker.associations(hotkey, i);
                weights[uid] += wtao.balanceOf(depositer);
            }
        }
    }

    function getNetuid() public view returns (uint16) {
        return netuid;
    }
}
