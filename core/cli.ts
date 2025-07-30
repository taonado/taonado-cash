#!/usr/bin/env ts-node
// @prettier
import inquirer from "inquirer";
import { logo } from "./logo";
import { ethers } from "hardhat";
import { config } from "../config";
import { balances, wrapTAO, unwrapTAO, depositTAO, claimNote } from "./ops";

const _CLI_VERSION = "0.1.0";

// Types for CLI operations
interface CliArgs {
  privateKey?: string;
  amount?: string;
  recipient?: string;
  note?: string;
}

// Parse command line arguments
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case "--private-key":
        parsed.privateKey = value;
        break;
      case "--amount":
        parsed.amount = value;
        break;
      case "--recipient":
        parsed.recipient = value;
        break;
      case "--note":
        parsed.note = value;
        break;
    }
  }

  return parsed;
}

class TaonadoCLI {
  private wallet: any;
  private args: CliArgs;

  constructor(args: CliArgs) {
    this.args = args;
    const privateKey = args.privateKey || config.ethPrivateKey;
    this.wallet = new ethers.Wallet(privateKey, ethers.provider);
  }

  async start() {
    console.log(logo);
    console.log("\n🌪️  Welcome to Taonado CLI 🌀");
    console.log("=====================================");
    console.log(`Network: testnet`);
    console.log(`EVM Wallet: ${this.wallet.address}`);
    console.log(`Version: ${_CLI_VERSION}`);
    console.log("=====================================\n");

    const { operationType } = await inquirer.prompt([
      {
        type: "list",
        name: "operationType",
        message: "What operation would you like to perform?",
        choices: [
          {
            name: "💰 WTAO Operations",
            value: "basic",
          },
          {
            name: "🕵️  Privacy Operations",
            value: "privacy",
          },
          {
            name: "❌ Exit",
            value: "exit",
          },
        ],
      },
    ]);

    switch (operationType) {
      case "basic":
        await this.handleBasicOperations();
        break;
      case "privacy":
        await this.handlePrivacyOperations();
        break;
      case "exit":
        console.log("Goodbye! 👋");
        process.exit(0);
        break;
    }
  }

  async handleBasicOperations() {
    console.log("\n💰 WTAO Operations");
    console.log("========================\n");

    const { operation } = await inquirer.prompt([
      {
        type: "list",
        name: "operation",
        message: "Choose an operation:",
        choices: [
          {
            name: "👁️  View Balances",
            value: "balance",
          },
          {
            name: "📥 Wrap TAO (TAO → WTAO)",
            value: "deposit",
          },
          {
            name: "📤 Unwrap TAO (WTAO → TAO)",
            value: "withdraw",
          },
          { name: "🔙 Back to main menu", value: "back" },
        ],
      },
    ]);

    switch (operation) {
      case "deposit":
        await this.handleBasicDeposit();
        break;
      case "withdraw":
        await this.handleBasicWithdraw();
        break;
      case "balance":
        await this.handleBasicBalance();
        break;
      case "back":
        await this.start();
        break;
    }
  }

  async handlePrivacyOperations() {
    console.log("\n🕵️  Privacy Operations");
    console.log("=======================\n");

    const { operation } = await inquirer.prompt([
      {
        type: "list",
        name: "operation",
        message: "Choose an operation:",
        choices: [
          {
            name: "🔒 Privacy Deposit (WTAO → Pool)",
            value: "privacy-deposit",
          },
          {
            name: "🔓 Privacy Withdraw (Use Note)",
            value: "privacy-withdraw",
          },
          {
            name: "🔙 Back to main menu",
            value: "back",
          },
        ],
      },
    ]);

    switch (operation) {
      case "privacy-deposit":
        await this.handlePrivacyDeposit();
        break;
      case "privacy-withdraw":
        await this.handlePrivacyWithdraw();
        break;
      case "back":
        await this.start();
        break;
    }
  }

  async handleBasicDeposit() {
    console.log("\n📥 Basic Deposit (TAO → WTAO)");
    console.log("===============================\n");

    let amount = this.args.amount;

    if (!amount) {
      const amountAnswer = await inquirer.prompt({
        type: "input",
        name: "amount",
        message: "Enter amount of TAO to deposit:",
        default: "1",
        validate: (input: string) => {
          const num = parseFloat(input);
          if (isNaN(num) || num <= 0) {
            return "Please enter a valid positive number";
          }
          return true;
        },
      });
      amount = amountAnswer.amount;
    }

    const { confirm } = await inquirer.prompt({
      type: "confirm",
      name: "confirm",
      message: `Deposit ${amount} TAO → WTAO?`,
      default: false,
    });

    if (confirm) {
      console.log("\n⏳ Processing basic deposit...");
      try {
        await this.performBasicDeposit(amount);
        console.log("✅ Basic deposit completed successfully!");
      } catch (error) {
        console.error("❌ Error during basic deposit:", error);
      }
    }

    await this.askContinue();
  }

  async handleBasicWithdraw() {
    console.log("\n📤 Basic Withdraw (WTAO → TAO)");
    console.log("================================\n");

    let amount = this.args.amount;

    if (!amount) {
      const amountAnswer = await inquirer.prompt({
        type: "input",
        name: "amount",
        message: "Enter amount of WTAO to withdraw:",
        default: "1.0",
        validate: (input: string) => {
          const num = parseFloat(input);
          if (isNaN(num) || num <= 0) {
            return "Please enter a valid positive number";
          }
          return true;
        },
      });
      amount = amountAnswer.amount;
    }

    const { confirm } = await inquirer.prompt({
      type: "confirm",
      name: "confirm",
      message: `Withdraw ${amount} WTAO → TAO?`,
      default: false,
    });

    if (confirm) {
      console.log("\n⏳ Processing basic withdraw...");
      try {
        await this.performBasicWithdraw(amount);
        console.log("✅ Basic withdraw completed successfully!");
      } catch (error) {
        console.error("❌ Error during basic withdraw:", error);
      }
    }

    await this.askContinue();
  }

  async handleBasicBalance() {
    console.log("\n👁️  View Balance(s)");
    console.log("=====================\n");

    try {
      await this.performBasicBalance();
      console.log("✅ Balance retrieved successfully!");
    } catch (error) {
      console.error("❌ Error retrieving balance:", error);
    }

    await this.askContinue();
  }

  async handlePrivacyDeposit() {
    console.log("\n🔒 Privacy Deposit (WTAO → Pool)");
    console.log("===================================\n");
    console.log(
      "⚠️  WARNING: You will receive a secret note. SAVE IT SECURELY!"
    );
    console.log("    Without this note, you cannot withdraw your funds!\n");

    let amount = this.args.amount;

    if (!amount) {
      const amountAnswer = await inquirer.prompt({
        type: "list",
        name: "amount",
        message: "Select deposit amount (standard pool sizes):",
        choices: [
          { name: "0.1 TAO (coming soon)", value: "0.1", disabled: true },
          { name: "1 TAO", value: "1" },
          { name: "10 TAO (coming soon)", value: "10", disabled: true },
          { name: "100 TAO (coming soon)", value: "100", disabled: true },
          { name: "1000 TAO (coming soon)", value: "1000", disabled: true },
        ],
      });
      amount = amountAnswer.amount;
    }

    const { confirm } = await inquirer.prompt({
      type: "confirm",
      name: "confirm",
      message: `Create privacy deposit of ${amount} WTAO?`,
      default: false,
    });

    if (confirm) {
      console.log("\n⏳ Processing privacy deposit...");
      console.log("   • Generating secret note...");
      console.log("   • Creating commitment...");
      console.log("   • Submitting to pool...\n");

      try {
        const note = await this.performPrivacyDeposit(amount);
        console.log("✅ Privacy deposit completed successfully!\n");
        console.log("🔑 YOUR SECRET NOTE (SAVE THIS SECURELY):");
        console.log("==========================================");
        console.log(note);
        console.log("==========================================\n");
        console.log(
          "⚠️  IMPORTANT: Without this note, you cannot withdraw your funds!"
        );
        console.log(
          "   Store it in a safe place (password manager, encrypted file, etc.)"
        );
      } catch (error) {
        console.error("❌ Error during privacy deposit:", error);
      }
    }

    await this.askContinue();
  }

  async handlePrivacyWithdraw() {
    console.log("\n🔓 Privacy Withdraw (Use Note)");
    console.log("===============================\n");

    let note = this.args.note;
    let recipient = this.args.recipient;

    if (!note) {
      const noteAnswer = await inquirer.prompt({
        type: "password",
        name: "note",
        message: "Enter your secret note:",
        mask: "*",
        validate: (input: string) => {
          if (!input || input.length < 10) {
            return "Please enter a valid secret note";
          }
          return true;
        },
      });
      note = noteAnswer.note;
    }

    if (!recipient) {
      const recipientAnswer = await inquirer.prompt({
        type: "input",
        name: "recipient",
        message:
          "Enter recipient address (leave empty for your current wallet):",
        default: this.wallet.address,
        validate: (input: string) => {
          if (!ethers.isAddress(input)) {
            return "Please enter a valid Ethereum address";
          }
          return true;
        },
      });
      recipient = recipientAnswer.recipient;
    }

    const { confirm } = await inquirer.prompt({
      type: "confirm",
      name: "confirm",
      message: `Withdraw to ${recipient}?`,
      default: false,
    });

    if (confirm) {
      console.log("\n⏳ Processing privacy withdraw...");
      console.log("   • Parsing secret note...");
      console.log("   • Generating merkle proof...");
      console.log("   • Creating zk-SNARK proof...");
      console.log("   • Submitting withdrawal...\n");

      try {
        await this.performPrivacyWithdraw(note, recipient);
        console.log("✅ Privacy withdraw completed successfully!");
        console.log("🎉 Your funds have been anonymously transferred!");
      } catch (error) {
        console.error("❌ Error during privacy withdraw:", error);
      }
    }

    await this.askContinue();
  }

  async askContinue() {
    console.log("\n");
    const { action } = await inquirer.prompt({
      type: "list",
      name: "action",
      message: "What would you like to do next?",
      choices: [
        { name: "🔄 Perform another operation", value: "continue" },
        { name: "❌ Exit", value: "exit" },
      ],
    });

    if (action === "continue") {
      await this.start();
    } else {
      console.log("Goodbye! 👋");
      process.exit(0);
    }
  }

  // Core function implementations (to be implemented by user)
  async performBasicDeposit(amount: string): Promise<void> {
    const { balance, receipt } = await wrapTAO(this.wallet, amount);

    if (receipt) {
      console.log(`🎉 Deposit successful!`);
      console.log(`💰 New WTAO Balance: ${ethers.formatEther(balance)}`);
    } else {
      console.log("❌ Deposit failed!");
    }
    console.log("\n===============================\n");
  }

  async performBasicWithdraw(amount: string): Promise<void> {
    const { wtaoBalance, taoBalance, tx, contract, receipt } = await unwrapTAO(
      this.wallet,
      amount
    );

    if (receipt) {
      console.log(`🎉 Withdrawal successful!`);
      console.log(`💰 New TAO Balance:  ${ethers.formatEther(taoBalance)}`);
      console.log(`🎁 New WTAO Balance: ${ethers.formatEther(wtaoBalance)}`);
    } else {
      console.log("❌ Withdrawal failed!");
    }
    console.log("\n===============================\n");
  }

  async performBasicBalance(): Promise<void> {
    const { taoBalance, wtaoBalance } = await balances(this.wallet);
    console.log(`💰 TAO Balance: ${ethers.formatEther(taoBalance)}`);
    if (wtaoBalance !== undefined) {
      console.log(`🎁 WTAO Balance: ${ethers.formatEther(wtaoBalance)}`);
    } else {
      console.log("🎁 WTAO Balance: (error)");
    }
    console.log("\n===============================\n");
  }

  async performPrivacyDeposit(amount: string): Promise<string> {
    const { note, tx } = await depositTAO(this.wallet, amount);
    return note;
  }

  async performPrivacyWithdraw(note: string, recipient: string): Promise<void> {
    const tx = await claimNote(this.wallet, note, recipient);
    console.log("✅ Privacy withdraw completed successfully!");
    console.log("🎉 Your funds have been anonymously transferred!");
  }
}

async function main() {
  try {
    const args = parseArgs();
    const cli = new TaonadoCLI(args);
    await cli.start();
  } catch (error) {
    console.error("❌ CLI Error:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Goodbye!");
  process.exit(0);
});

if (require.main === module) {
  main();
}
