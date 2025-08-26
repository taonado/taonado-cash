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
