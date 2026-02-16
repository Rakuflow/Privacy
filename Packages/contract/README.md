##declare: 
    sncast declare --contract-name <name contract> --network sepolia
##deploy:
    sncast --accounts-file /home/bitlab-pc/.starknet_accounts/starknet_accounts.json --account my_account deploy --class-hash <hash contract> --arguments <address contract> --network sepolia