<div align="center">

# [🌪️ TAONADO.CASH 🌀](https://taonado.cash)

</div>

# A Privacy Preserving TAO Mixer on Bittensor

**Taonado** is a zero knowledge (ZK) based token mixer for the Bittensor ($TAO) ecosystem, inspired by the privacy principles of Tornado Cash.
It enables users to deposit and withdraw TAO tokens with complete anonymity, severing the onchain link between sender and receiver addresses.
Built to align with Bittensor's incentivized network, Taonado rewards participants for contributing to network privacy and security.

## 🚀 Features

- **Zero Knowledge Privacy**: Leverage zk-SNARKs to anonymize TAO transactions.
- **Flexible Deposit Pools**: Deposit 0.1, 1, 10, 100, or 1000 TAO into shielded pools.
- **Incentivized Participation**: Earn rewards for depositing TAO, enhancing network security.
- **Permissionless Withdrawals**: Withdraw TAO to any address without revealing prior activity.
- **Bittensor Integration**: Seamlessly interact with TAO subnets and the broader ecosystem.

## 📖 How It Works

For a detailed technical overview of the system architecture, including contract interactions and security considerations, see [ARCHITECTURE.md](./ARCHITECTURE.md).

### Deposit
1. **Select a Pool**: Choose a deposit size (0.1, 1, 10, 100, or 1000 $TAO).
2. **Generate Secret**: Create a cryptographic secret (note) to later claim your deposit.
3. **Submit Transaction**: Deposit $TAO into the Taonado smart contract.

### Withdraw
1. **Input Secret**: Use your saved secret to generate a withdrawal proof.
2. **Submit Proof**: The contract verifies the proof without revealing your original deposit.
3. **Receive TAO**: Withdraw the deposited amount to any address of your choice.

## 🛠️ Getting Started

### Prerequisites
- $TAO in a compatible wallet (bittensor cli wallet)
- Comfortable with bittensor EVM and moving funds between ss58 and H160 addresses
- Basic understanding of zk-SNARKs and Bittensor subnets.

### Installation
```bash
git clone https://github.com/taonado/taonado-cash
cd taonado-cash && pnpm i
cp config-example.ts config.ts #fill in with details
pnpm download-keys # get prebuilt keys and built circuit
pnpm build:substrate
```

If you don't already have `pnpm` installed: [pnpm install docs](https://pnpm.io/installation)

It's recommended to manage `nodejs` through pnpm.

If you run into issues installing (errors with permissions on pulling from the *github.com repos), you need to ensure ssh auth is configured as anon git is sometimes blocked by github (depends on IP address)... Guide [here](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

### Tests
Run the tests and report results. (must also complete the installation steps above)

```bash
pnpm build:ethereum
pnpm test
```

### Miners
Carefully read the instructions and script in [scripts/miner.ts](scripts/miner.ts)

### Validators
Carefully read the instructions and script in [scripts/vali.ts](scripts/vali.ts)

**🚀We've Gone Validatorless!**

Unlike traditional subnets that require dedicated validators, Taonado uses a decentralized validation approach where any EVM wallet can contribute to weight setting and earn TAO bounties. This eliminates the need for traditional validator infrastructure while maintaining network security through incentivized participation.

Phase 1 is live!

### Usage
1. Deposit TAO:
```bash
pnpm cli
```
Follow the interactive prompts to wrap TAO and make a deposit!

### 🚨 Important: You must keep this secret phrase secure. There is no way to withdraw funds without it.

2. Withdraw TAO:
```bash
pnpm cli
```

Follow the interactive prompts to claim your note from earlier and receive your deposit back.

## 💡 Incentives

Bittensor's decentralized network rewards developers and users who contribute value. Taonado extends this model by:

- **Liquidity Rewards**: A portion of subnet emissions is distributed to users who lock TAO in the mixer, proportional to deposit size and duration. Miners prove their deposits remain in the pools using Proof-of-Liquidity
- **Network Security**: Larger deposits strengthen the anonymity set, improving privacy for all users. Contributors earn "privacy points" redeemable for TAO rewards.

## 🗝️ Key Terms

### 🌑 Anonymous Incentive (AI)
Taonado introduces Anonymous Incentive (AI), a novel mechanism enabling Bittensor miners to anonymize their earnings across subnets while maintaining compliance with subnet specific rules. This empowers miners and holders to:

- Private Earnings: Convert subnet rewards into anonymized TAO via zk-proofs, breaking the public link between mining activity and wallet addresses.

- Cross Subnet Privacy: Aggregate earnings from multiple subnets into a single shielded balance, obfuscating participation in specific subnets.

### 💧 Anti-Monitoring Liquidity (AML)
Taonado introduces AML (Anti Monitoring Liquidity), a novel mechanism that enhances privacy for Bittensor transactions while maintaining seamless liquidity. Mixer Liquidity (ML) quantifies the total TAO held in Taonado's shielded pools. Higher ML enhances privacy guarantees by creating larger anonymity sets while enabling seamless withdrawals.

- Pool Depth Tracking: Realtime display of TAO in 0.1/1/10/100/1000 pools.

- Anonymity Multiplier: Larger pools = stronger privacy.

- Dynamic Rewards: Earn bonus TAO for contributing to under liquidated pools.

- Stealth Timing AI: Machine learning predicts optimal fund retention periods to prevent withdrawal address linkage.

#### Key Features:

- Anti-Traceability Design: Break transactional footprints while complying with subnet audit requirements.

- Liquidity Camouflage: Mask participation across pools through adaptive deposit strategies.

- Privacy Yield Farming: Generate returns by contributing to the network's anonymity infrastructure.

### 🕵️‍♀️ Fujita Privacy Scale:

#### A Risk model to quantify privacy loss:

- F0: Your grandma could trace this tx
- F1: ZachXBT just made a thread about you

...
- F4: Yuma RAO sent you a discord friend request
- F5: Even Satoshi's ghost is confused

## 🗺️ Roadmap Phases

### 0. 💦 Liquidity Bootstrap

- Miners are rewarded for depositing TAO to our smart contract.
- TAO can be removed at any time.

### 1. ✅ TAO Core Pools

- Standard pools (0.1/1/10/100/1000 TAO) enabled with basic deposit/withdraw.

- Miners move liquidity into the core pools.

### 2. 🚧 Incentivized ML Operations

- Miners earn SN tokens for contributing to Mixer Liquidity.

- Integrated with Bittensor's incentive distribution.

### 3. ⏳ Proof of Liquidity (PoL)

- ZK proofs verify miners' liquidity commitment without revealing amounts.

- PoL grants access to high yield subnet rewards.

### 4. 🌍 Subnet Token Pools

- Enable pools across all subnet tokens

### 5. Monetization & Access

- Users must burn SN tokens or hold a minimum quantity to make deposits.

## 🔒 Security
Taonado is experimental software. While we use audited zk-SNARK libraries, the codebase has not undergone formal audits. Use at your own risk.

Audits: Pending community funding. Interim audit has been completed: [audit/](/audit/Hashlock%20-%20Audit%20Report%20(250826).pdf)

Bug Bounty: Report vulnerabilities to taonado@proton.me for rewards.

## 👤 Taonado's Privacy Policy
Our privacy design ensures:

- We don't know who you are and want to keep it that way 🕶️

- We don't know where your TAO came from

- We don't know why you're wearing that Hawaiian shirt in your profile picture

The only thing we do know:
- How to keep your transactions untraceable.

(Disclaimer: We also know how to make bad jokes. Use at your own risk.)

## Benefits to Bittensor
- 🛡️ Reduces Sybil Attacks: Makes it harder to correlate miner identities across subnets.
- 🌱 Encourages Experimentation: Miners can freely test subnets without reputation risks.
- 🔄 Capital Fluidity: Privately move TAO between subnets to optimize incentives.

## FAQs
- Can I mine as a validator?
  - Sure, why not.
- Do miners need to run anything?
  - Nope, all activities take place within the EVM.
- What are you doing with the deposited TAO?
  - Nothing. It's in your custody at all times.
- Why don't you use the uid-lookup precompile in place of the DepositTracker contract?
  - Unfortunately there is no way to set the association through the EVM, defeating it's purpose.
Since there is no SDK currently any miner/vali would have to use the polkdot web UI which is a blocker - many (if not most) will not have their coldkey in a browser compatible wallet
Maybe one day :)
- Why are the EVM precompile addresses for BN128 different from the original contracts?
  - Unfortunately the BN128 precompiles were not included in the original Bittensor EVM release and were added later in a different order than on ethereum.

## Contract Verification
See [verify-contract](./verify-contract.md)

## 📜 License
Taonado is MIT licensed. See [LICENSE](LICENSE)

## ⚠️ Disclaimer
Taonado is a privacy tool, not a mixer for illicit activity. Compliance with local regulations is the user's responsibility. Use of this software is entirely at your own risk.
___

<em>"Stay anonymous, stay angry, and always mix toward the vortex"</em> - Yuma RAO
