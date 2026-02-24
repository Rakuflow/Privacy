## Initialize
    scarb fmt  (check code)
    scarb build  (build -> create json)
    scarb clean

## Extract (code json)
require: "jq" -> "sudo install jq" (wsl)
jq '.abi' target/dev/contract_<name contract>.contract_class.json > <name abi>.json

## Declare: 
    sncast declare --contract-name <name contract> --network sepolia

## Deploy:
    sncast --accounts-file /home/<name folder>/.starknet_accounts/starknet_accounts.json --account my_account deploy --class-hash <hash contract> --arguments <address contract> --network sepolia

