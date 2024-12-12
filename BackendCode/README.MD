# CSE416

SSH Into Main Branch: 
->git clone git@github.com:ptaday/CSE416.git

CD into BackendCode & Run Script

Give the script executable permissions
->chmod +x script.sh

Run the Script (This will create bitcoin, .env file, and .gitignore)
->./script.sh

---------------------------------------------------------------------------------
find the .conf file: On Mac: CMD+SHIFT+G anywhere on your finder, then go to Application Support 

then add:

server=1
rpcuser=Shrek
rpcpassword=Shrek
daemon=1

# Regtest Network Configuration
[regtest]
rpcallowip=127.0.0.1
rpcbind=127.0.0.1
rpcport=18443
bind=127.0.0.1

# Mainnet Network Configuration (No Section Header)     4566
rpcallowip=127.0.0.1
rpcbind=127.0.0.1
rpcport=8332
addnode=130.245.173.221:8333
-----------------------------------------------------------------
Start BitCoin Core in the BackEnd 
On anywhere in terminal
->bitcoind -regtest -daemon

Need to Run HTTP Server, RPC Auth (Start to listen for incoming requests)
->cd CSE416Project/endpoint_manager
->cargo run

This will set up the backend server to listen and handle API calls

