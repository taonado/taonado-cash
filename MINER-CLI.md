# MINER CLI 🌪️
**A CLI tool for easy TAONADO miner operation**

## Why
Easy to use commands for the following scripts: deposit, balance, withdraw, and transfer.
  - NEW: Run `miner deposit --amount 1.0`
  - OLD: Manually add deposit amount to scripts/deposit-cli.ts & run `pnpm tsx scripts/deposit-cli.ts`

## Commands
- `miner deposit --amount <amount>` (deposit to contract)
- `miner balance` (show balances)
- `miner withdraw --amount <amount>` (withdraw from contract to mirror)
- `miner transfer --amount <amount> --destination <ss58_addrss>` (transfer from mirror to TAO wallet)

### Modified & New Files
- **package.json:**
  - Added bin field to make the CLI executable using the keyword "tnd"
- **miner-cli.ts:**
  - Miner CLI entry point, uses commander to handle subcommands with dynamic options
- **get-balance.ts:**
  - Updated to export a reusable getBalance function with handling for undefined balances + easy to read balance formatting (ethers formatEther)
- **transfer.ts:**
  - Updated to export transferTao function with parameters for wallet, destination, and amount
- **withdrawal.ts:**
  - Updated to export withdrawal function accepting wallet and amount parameters

### Dependencies
- `commander` (CLI parsing and subcommands)

### Install
1. Install Commander: `pnpm add commander`
2. Make executable: `chmod +x miner-cli.ts && pnpm link --global`
3. Verify that commands are added: `miner --help` or `pnpm tsx miner-cli.ts --help` (no full rebuild needed)

Builds on standard `pnpm i` and doesn't require extra tools beyond Commander
