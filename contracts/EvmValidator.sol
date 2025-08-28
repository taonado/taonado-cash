// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.24;

import "./neuron.sol";
import "./IWeights.sol";
import "./metagraph.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

// @dev This contract is used to set the weights for a validator.
// Deploy this contract and then set it's address as the validator hotkey.
contract EvmValidator is
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    IWeights public weights;
    IMetagraph public metagraph;

    // If the caller is present in the metagraph, boost them with a little bit of weight!
    uint16 public metagraph_boost_value;

    // The bounty for setting weights, in wei (1e-18 TAO).
    uint256 public setWeightsBounty;

    // The subnet ID
    uint16 public netuid;
    // The version key for the weights
    uint64 public versionKey;

    // Last time the weights were set
    uint256 public lastSetWeightsBlock;
    // The minimum interval in blocks between set weight calls
    uint256 public setWeightsBlockInterval;

    // extra gas to cover refund logic itself; owner can tune this
    uint256 public refundOverhead;

    event BountyPaid(
        address indexed who,
        uint256 gasUsedByCall,
        uint256 weiRefunded,
        uint256 gasUsedByBookkeeping
    );

    modifier refundGas() {
        uint256 gasStart = gasleft();
        _;
        _processBounty(gasStart);
    }

    function initialize(uint16 _netuid, address _weights) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        netuid = _netuid;
        metagraph = IMetagraph(IMetagraph_ADDRESS);
        weights = IWeights(_weights);
        refundOverhead = 15_000;
    }

    function setWeights(
        bytes32 hotkey
    ) public setWeightsIntervalPassed nonReentrant refundGas {
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
    }

    function operatorSetWeights() external onlyOwner {
        (uint16[] memory dests, uint16[] memory weightsArray) = _getWeights();
        _setWeights(dests, weightsArray);
    }

    // *** Internal Functions *** //

    function _processBounty(uint256 gasStart) internal {
        uint256 gasBeforeBookkeeping = gasleft();
        uint256 gasUsed = gasStart - gasleft();
        uint256 refundAmount = (gasUsed + refundOverhead) *
            tx.gasprice +
            setWeightsBounty;

        require(
            address(this).balance >= refundAmount,
            "Insufficient balance, contact the owner"
        );
        if (msg.sender != owner()) {
            (bool ok, ) = msg.sender.call{value: refundAmount}("");
            require(ok, "refund failed");

            uint256 bookkeepingGasUsed = gasBeforeBookkeeping - gasleft();
            emit BountyPaid(
                msg.sender,
                gasUsed,
                refundAmount,
                bookkeepingGasUsed
            );
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
        bytes memory data = abi.encodeWithSelector(
            INeuron.setWeights.selector,
            netuid,
            dests,
            weightsArray,
            versionKey
        );
        uint256 fg = gasleft() - refundOverhead;
        (bool success, ) = INeuron_ADDRESS.call{gas: fg}(data);
        if (!success) {
            revert("neuron.setWeights failed");
        }
        lastSetWeightsBlock = block.number;
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

    function setSetWeightsBlockInterval(
        uint256 _setWeightsBlockInterval
    ) public onlyOwner {
        setWeightsBlockInterval = _setWeightsBlockInterval;
    }

    function rescueFunds() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function setRefundOverhead(uint256 _refundOverhead) public onlyOwner {
        refundOverhead = _refundOverhead;
    }

    receive() external payable {}

    modifier setWeightsIntervalPassed() {
        require(
            block.number >= lastSetWeightsBlock + setWeightsBlockInterval,
            "Weight set interval has not passed"
        );
        _;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
