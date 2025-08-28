Following the audit report from Hashlock on 2025/08/26

A total of 12 issues were noted in the report. This is the response and mitigation from the Taonado Team.

## (2) High Severity Issues

### High - Unrestricted fund drainage through rescueFunds function

This issue is solely in regards to the EvmValidator contract which handles only the assignment of weights to miners.

From the report:

`This creates a significant centralization risk where a compromised owner key or malicious owner could instantly drain all funds meant for gas refunds and bounties, leaving the validator system inoperable.`

This finding is partially true. "instantly drain all funds" does not apply to the shielded pools or any WTAO funds. All funds at risk are put up as bounties by the Taonado team.
Validator centralization risk is already mitigated with the Bittensor Substrate Layer, and a hotkey swap can be initiated at any time in the case of compromised keys.

Adding a time lock as suggested does not add any benefits.

All subnets suffer from issues related to compromised owner keys, thankfully validators may remain in control even if any single validator is compromised.

### High - Denial of Service through unbounded loop in weight calculation 

This issue is related to WeightsV2 and how scores are calculated for miners.
This is a good find and would indeed be annoying to resolve (requiring actions from all miners).
A maximim amount of hotkey associations have been implemented as recommended in the report.
An alternative approach would be to limit this on the DepositTracker side, but this contract is not upgradeable.

A mitigation has been put in place, limiting the number of associations checked per hotkey for scoring purposes.
This will not affect any current miners / configurations.

### Medium - Reentrancy vulnerability in ERC20Taonado withdrawal with ETH (TAO) refunds

This issue is resolved by limiting the gas on _recipient.call() such that an attacker can't abuse re-entrancy

### Medium - Front-running vulnerability in deposit association mechanism

This issue would detrimental for any attacker, the attacker would be attributing their own deposits to another owned hotkey. Go for it, Mr. Attacker!
No change needed.

### Medium - Integer overflow in weight normalization calculation

With only 21,000,000 TAO ever existing, the max here is 1^18 * 2.1 x 10 ^ 7 * uint16.max ~= 1^30 << 2^256 so an overflow is not possible.
No change needed.

### Medium - Unchecked external call success in EvmValidator gas refund

While this is theoretically possible, it will only delay possible validation loop run by 1 block. Additionally the owner can always supercede this validator loop run and ensure validator.setWeights() is still executed.
No change implemented.

### Medium - WTAO withdraw function vulnerable to insufficient balance griefing

WTAO is designed in way that this should not happen, owing to the original WETH design decisions.

### Low - Missing validation of zero denomination in Taonado constructor

Yes in theory any size denomination could be used, but it need not be enforced.
If denomination size is so large (say 1M TAO) then it will not be used. No issues.

### Low - Missing event emission for critical state changes

No harm in adding an event here. Good find, suggested changes have been implemented.

### Low - Precision loss in weight normalization due to premature casting

Higher precision is not needed since the error is at most TOTAL_DEPOSITED_BALANCE / uint16.max.
The error also does not compound considering the addition of the hotkeys deposits is tracked with full precision.
No change implemented, and an additional cast operation would increase gas usage.

### Low - Unprotected ETH receive function creates accounting risks

While this has a low chance of occuring, the trade off of convenience (fund from a non-owner address) out-weighs any benefit from the proposed change.
No change implemented.
