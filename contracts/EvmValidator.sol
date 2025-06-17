// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.24;

import "./neuron.sol";
import "./IWeights.sol";
import "./metagraph.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// @dev This contract is used to set the weights for a validator.
// Deploy this contract and then set it's address as the validator hotkey.
contract EvmValidator is Ownable, ReentrancyGuard {
    IWeights public weights;
    IMetagraph public metagraph = IMetagraph(IMetagraph_ADDRESS);
    INeuron public neuron = INeuron(INeuron_ADDRESS);

    // If the caller is present in the metagraph, boost them with a little bit of weight!
    uint16 public metagraph_boost_value;

    // The bounty for setting weights, in RAO.
    uint256 public setWeightsBounty;

    // The subnet ID
    uint16 public netuid;
    // The version key for the weights
    uint64 public versionKey;

    uint256 public lastSetWeightsBlock;
    // The minimum interval in blocks between set weight calls
    uint256 public setWeightsBlockInterval;

    constructor(
        uint16 _netuid,
        uint64 _versionKey,
        address _weights
    ) Ownable(msg.sender) {
        netuid = _netuid;
        versionKey = _versionKey;
        weights = IWeights(_weights);
    }

    function setWeights(bytes32 hotkey) public setWeightsIntervalPassed nonReentrant {
        (uint16[] memory dests, uint16[] memory weightsArray) = _getWeights();
        if (metagraph_boost_value > 0 && hotkey != bytes32(0)) {
            for (uint16 i = 1; i < metagraph.getUidCount(netuid); i++) {
                if (metagraph.getHotkey(netuid, i) == hotkey) {
                    weightsArray[i] += metagraph_boost_value;
                    break;
                }
            }
        }
        _setWeights(dests, weightsArray);
        _processBounty();
    }

    function operatorSetWeights() external onlyOwner {
        (uint16[] memory dests, uint16[] memory weightsArray) = _getWeights();
        _setWeights(dests, weightsArray);
    }

    // *** Internal Functions *** //

    function _processBounty() internal {
        require(address(this).balance >= setWeightsBounty, "Insufficient balance, contact the owner");
        if (setWeightsBounty > 0) {
            if (msg.sender != owner()) {
                payable(msg.sender).transfer(setWeightsBounty);
            }
        }
    }

    function _getWeights()
        internal
        view
        returns (uint16[] memory, uint16[] memory)
    {
        (uint16[] memory dests, uint16[] memory weightsArray) = weights
            .getNormalizedWeights();
        return (dests, weightsArray);
    }

    function _setWeights(
        uint16[] memory dests,
        uint16[] memory weightsArray
    ) internal {
        try neuron.setWeights(netuid, dests, weightsArray, versionKey) {
            lastSetWeightsBlock = block.number;
        } catch {
            revert("neuron.setWeights failed");
        }
    }

    // *** Owner Management Functions *** //

    function setMetagraphBoostValue(
        uint16 _metagraph_boost_value
    ) public onlyOwner {
        metagraph_boost_value = _metagraph_boost_value;
    }

    function setVersionKey(uint64 _versionKey) public onlyOwner {
        versionKey = _versionKey;
    }

    function setWeightsContract(address _weights) public onlyOwner {
        weights = IWeights(_weights);
    }

    function setSetWeightsBounty(uint256 _setWeightsBounty) public onlyOwner {
        setWeightsBounty = _setWeightsBounty;
    }

    function setSetWeightsBlockInterval(uint256 _setWeightsBlockInterval)
        public
        onlyOwner
    {
        setWeightsBlockInterval = _setWeightsBlockInterval;
    }

    function rescueFunds() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    // @dev Allows the contract to receive TAO
    receive() external payable {
    }

    modifier setWeightsIntervalPassed() {
        require(
            block.number >= lastSetWeightsBlock + setWeightsBlockInterval,
            "Weight set interval has not passed"
        );
        _;
    }
}
