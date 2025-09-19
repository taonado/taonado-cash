## Contract Verification
To verify the source code for a deployed contract on the taostats evm explorer. See [hardhat.config.ts](./hardhat.config.ts) for configuration. This does not require a valid config.ts setup with keys etc..

```bash
pnpm hardhat verify --network taostats 0xDEPLOYED_CONTRACT_ADDRESS "CONSTRUCTOR_PARAM_0" "CONSTRUCTOR_PARAM_1"
```

If you run into issues verifying, it is likely an issue with the `@openzeppelin/hardhat-upgrades` package changes to how contracts are tested before verified. There is a compatibility issue with Blockscout.
In particular, `HardhatError` [HH110: Invalid JSON-RPC response](https://v2.hardhat.org/hardhat-runner/docs/errors#HH110) is possible with `error: "Action not found."`

To fix this, you have to temporarily uninitialize the `@openzeppelin/hardhat-upgrades` just for the purposes of verifying any contract, which will run the expected verify method which works with Blockscout's RPC.
