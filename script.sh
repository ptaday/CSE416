#!/usr/bin/env bash

set -e
set -o pipefail

echo "Installing dependencies for macOS..."
brew install automake libtool boost pkg-config libevent miniupnpc

echo "Cloning modified Bitcoin Core repository..."
git clone https://github.com/Sethu98/bitcoin.git
cd bitcoin
git checkout mod_27_v2

echo "Building Bitcoin Core..."
./autogen.sh
./configure
make -j16

echo "Installing Bitcoin Core..."
sudo make install
echo "Bitcoin Core setup complete."

cd ..

echo "Setting up the .env file in CSE416Project/endpoint_manager..."
ENV_FILE="CSE416Project/endpoint_manager/.env"
cat > "${ENV_FILE}" <<EOF
RPC_URL=http://127.0.0.1:18443
RPC_USER=Shrek
RPC_PASSWORD=Shrek
RUST_LOG=info
EOF
echo ".env file created with required values."

echo "Creating .gitignore file in BackEnd directory..."
GITIGNORE_FILE=".gitignore"
cat > "${GITIGNORE_FILE}" <<EOF
.env
target/
EOF
echo ".gitignore created."

echo "All steps completed successfully."
