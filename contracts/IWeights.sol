// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

/// @title IWeights
/// @notice Interface for an abstract weights contract
interface IWeights {
    /**
     * @notice Calculates the weights (wtao balances) for the currently registered miners
     * @return dests Array of destination UIDs
     * @return weights Array of corresponding weights based on WTAO balances
     */
    function getWeights()
        external
        view
        returns (uint16[] memory dests, uint256[] memory weights);

    /**
     * @notice Returns normalized weights for the miners
     * @return dests Array of destination UIDs
     * @return weights Array of normalized weights
     */
    function getNormalizedWeights()
        external
        view
        returns (uint16[] memory dests, uint16[] memory weights);

    /**
     * @notice Returns the netuid
     * @return The netuid value
     */
    function getNetuid() external view returns (uint16);
}
