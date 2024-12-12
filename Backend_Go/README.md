For Running the Go Kademlia & LibP2P:

# Install Go

To confirm this install: go version
#expected output: go version go1.23.1 darwin/arm64

# Now, follow these commands in a new terminal:

mkdir <directory-name> #create a new directory for your project
cd <directory-name> # change directory
go mod init main

go get github.com/ipfs/go-cid \
    github.com/libp2p/go-libp2p \
    github.com/libp2p/go-libp2p-kad-dht \
    github.com/libp2p/go-libp2p-record \
    github.com/libp2p/go-libp2p/core/crypto \
    github.com/libp2p/go-libp2p/core/host \
    github.com/libp2p/go-libp2p/core/network \
    github.com/libp2p/go-libp2p/core/peer \
    github.com/libp2p/go-libp2p/core/peerstore \
    github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client \
    github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/relay \
    github.com/multiformats/go-multiaddr \
    github.com/multiformats/go-multihash
    github.com/gorilla/mux
    github.com/ipfs/go-cid
    github.com/libp2p/go-libp2p-core


# Now, replace the main.go file with the provided main.go file & add the validator.go file to the directory under the 'Backend_Go'
