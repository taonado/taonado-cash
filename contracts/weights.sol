// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWTAO.sol";
import "./deposit.sol";
import "./metagraph.sol";

contract WeightsV2 is Ownable {
    IWTAO public wtao;
    IMetagraph public metagraph;
    IDepositTracker public depositTracker;
    uint256 public depositGoal;

    // *should* be 0 as this sn is registered after dTAO
    uint16 public burn_uid;

    uint16 public netuid;
    constructor(
        uint16 _netuid,
        address _depositTracker,
        address _metagraph,
        address _wtao
    ) Ownable(msg.sender) {
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
        uint256 totalAllocated;
        uint16 uidCount = metagraph.getUidCount(netuid);
        dests = new uint16[](uidCount);
        weights = new uint256[](uidCount);

        for (uint16 uid = 1; uid < uidCount; uid++) {
            dests[uid] = uid;
            bytes32 hotkey = metagraph.getHotkey(netuid, uid);
            for (
                uint256 i = 0;
                i < depositTracker.associationSetLength(hotkey);
                i++
            ) {
                address depositer = depositTracker.associations(hotkey, i);
                uint256 depositerBalance = wtao.balanceOf(depositer);
                weights[uid] += depositerBalance;
                totalAllocated += depositerBalance;
            }
        }

        // if the total supply is less than the deposit goal, burn excess miner emissions
        if (totalAllocated < depositGoal) {
            weights[burn_uid] = depositGoal - totalAllocated;
        }
    }

    function getNormalizedWeights()
        public
        view
        returns (uint16[] memory dests, uint16[] memory weights)
    {
        uint256[] memory unnormalizedWeights;
        (dests, unnormalizedWeights) = getWeights();
        weights = new uint16[](unnormalizedWeights.length);

        uint256 totalAllocated;
        for (uint16 i = 1; i < weights.length; i++) {
            totalAllocated += unnormalizedWeights[i];
        }
        uint256 denominator;
        if (totalAllocated < depositGoal) {
            denominator = depositGoal;
        } else {
            denominator = totalAllocated;
        }

        for (uint16 i = 0; i < weights.length; i++) {
            weights[i] = uint16(
                (((unnormalizedWeights[i]) * type(uint16).max) / denominator)
            );
        }

        return (dests, weights);
    }

    function setDepositGoal(uint256 _depositGoal) public onlyOwner {
        depositGoal = _depositGoal;
    }

    function getNetuid() public view returns (uint16) {
        return netuid;
    }
}
