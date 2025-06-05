import bittensor as bt
import fire

# Only validators which use the EVM to submit weights will need this.
# Honestly if you don't know what this is for, you probably don't need it.

### ------------------------------
### ---- How to use --------------
### ------------------------------

# Call substrate directly to swap your hotkey to an EVM ss58 address
# you cannot do this via btcli as it only supports hotkey swaps for hotkeys in your wallet .. which the EVM addresses cannot be imported.
# Yes I tried to hack it before hand but it's not possible. (don't modify hotkey files directly, it won't work)

# Example Usage:
# python swap-hk.py --wallet_name "my_wallet" --hotkey_name "my_hotkey" --destination_hotkey "5DJ...bCF"

async def __main__(wallet_name: str, hotkey_name: str, destination_hotkey: str):
    wallet = bt.wallet(name=wallet_name, hotkey=hotkey_name)
    subtensor = bt.subtensor(network="finney")
    call = subtensor.substrate.compose_call(
        call_module="SubtensorModule",
        call_function="swap_hotkey",
        call_params={
            "hotkey": wallet.hotkey.ss58_address,
            "new_hotkey": destination_hotkey,
        },
    )
    success, err_msg = subtensor.sign_and_send_extrinsic(call, wallet)
    if success:
        bt.logging.success(f"Swap successful {success}")
    else:
        bt.logging.error(f"Swap failed: {err_msg}")


if __name__ == "__main__":
    fire.Fire(__main__)
