package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"
	"net/http"
	"io/ioutil"
	"os/user"
	"strconv"
	"path/filepath"
	//"encoding/hex"
	"os/signal"
    "syscall"
	"github.com/gorilla/mux"
	"github.com/ipfs/go-cid"
	"github.com/libp2p/go-libp2p"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	record "github.com/libp2p/go-libp2p-record"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/relay"
	"github.com/multiformats/go-multiaddr"
	"github.com/multiformats/go-multihash"
)

var (
	node_id             = "114573476"
	relay_node_addr     = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
	bootstrap_node_addr = "/ip4/130.245.173.222/tcp/61020/p2p/12D3KooWM8uovScE5NPihSCKhXe8sbgdJAi88i2aXT2MmwjGWoSX"
	globalCtx           context.Context
)

func generatePrivateKeyFromSeed(seed []byte) (crypto.PrivKey, error) {
	hash := sha256.Sum256(seed) // Generate deterministic key material
	// Create an Ed25519 private key from the hash
	privKey, _, err := crypto.GenerateEd25519Key(
		bytes.NewReader(hash[:]),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}
	return privKey, nil
}

func createNode() (host.Host, *dht.IpfsDHT, error) {
	ctx := context.Background()
	seed := []byte(node_id)
	customAddr, err := multiaddr.NewMultiaddr("/ip4/0.0.0.0/tcp/0")
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse multiaddr: %w", err)
	}
	privKey, err := generatePrivateKeyFromSeed(seed)
	if err != nil {
		log.Fatal(err)
	}
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Fatalf("Failed to create relay multiaddr: %v", err)
	}

	// Convert the relay multiaddress to AddrInfo
	relayInfo, err := peer.AddrInfoFromP2pAddr(relayAddr)
	if err != nil {
		log.Fatalf("Failed to create AddrInfo from relay multiaddr: %v", err)
	}

	node, err := libp2p.New(
		libp2p.ListenAddrs(customAddr),
		libp2p.Identity(privKey),
		libp2p.NATPortMap(),
		libp2p.EnableNATService(),
		libp2p.EnableAutoRelayWithStaticRelays([]peer.AddrInfo{*relayInfo}),
		libp2p.EnableRelayService(),
		libp2p.EnableHolePunching(),
	)

	if err != nil {
		return nil, nil, err
	}
	_, err = relay.New(node)
	if err != nil {
		log.Printf("Failed to instantiate the relay: %v", err)
	}

	dhtRouting, err := dht.New(ctx, node, dht.Mode(dht.ModeClient))
	if err != nil {
		return nil, nil, err
	}
	namespacedValidator := record.NamespacedValidator{
		"orcanet": &CustomValidator{}, // Add a custom validator for the "orcanet" namespace
	}

	dhtRouting.Validator = namespacedValidator // Configure the DHT to use the custom validator

	err = dhtRouting.Bootstrap(ctx)
	if err != nil {
		return nil, nil, err
	}
	fmt.Println("DHT bootstrap complete.")

	// Set up notifications for new connections
	node.Network().Notify(&network.NotifyBundle{
		ConnectedF: func(n network.Network, conn network.Conn) {
			fmt.Printf("Notification: New peer connected %s\n", conn.RemotePeer().String())
		},
	})

	return node, dhtRouting, nil
}

func connectToPeer(node host.Host, peerAddr string) {
	addr, err := multiaddr.NewMultiaddr(peerAddr)
	if err != nil {
		log.Printf("Failed to parse peer address: %s", err)
		return
	}

	info, err := peer.AddrInfoFromP2pAddr(addr)
	if err != nil {
		log.Printf("Failed to get AddrInfo from address: %s", err)
		return
	}

	node.Peerstore().AddAddrs(info.ID, info.Addrs, peerstore.PermanentAddrTTL)
	err = node.Connect(context.Background(), *info)
	if err != nil {
		log.Printf("Failed to connect to peer: %s", err)
		return
	}

	fmt.Println("Connected to:", info.ID)
}

func connectToPeerUsingRelay(node host.Host, targetPeerID string) {
	ctx := globalCtx
	targetPeerID = strings.TrimSpace(targetPeerID)
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	relayedAddrInfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Println("Failed to get relayed AddrInfo: %w", err)
		return
	}
	// Connect to the peer through the relay
	err = node.Connect(ctx, *relayedAddrInfo)
	if err != nil {
		log.Println("Failed to connect to peer through relay: %w", err)
		return
	}

	fmt.Printf("Connected to peer via relay: %s\n", targetPeerID)
}

// Code TO BE TESTED

func receiveDataFromPeer(node host.Host) {
	// Set a stream handler to listen for incoming streams on the "/senddata/p2p" protocol
	node.SetStreamHandler("/senddata/p2p", func(s network.Stream) {
		defer s.Close()

		// Step 1: Read the data (peerID and CID) from the stream
		buf := bufio.NewReader(s)
		data, err := buf.ReadBytes('\n') // Reads until a newline character
		if err != nil {
			if err == io.EOF {
				log.Printf("Stream closed by peer: %s", s.Conn().RemotePeer())
			} else {
				log.Printf("Error reading from stream: %v", err)
			}
			return
		}

		// Step 2: Parse the received data (peerID and CID)
		parts := strings.Split(string(data), ",")
		if len(parts) != 2 {
			log.Printf("Invalid data format received: %v", string(data))
			return
		}
		peerID := strings.TrimSpace(parts[0])
		cid := strings.TrimSpace(parts[1])

		log.Printf("Received request from Peer %s for file with CID: %s", peerID, cid)

		// Step 3: Find the file associated with the CID (from metadata)
		// For simplicity, assuming a function 'findFilePathByCID' to retrieve the file path
		filepath := findFilePathByCID(cid)
		if filepath == "" {
			log.Printf("File for CID %s not found.", cid)
			return
		}

		// Step 4: Send the file to Peer A
		sendFileToPeer(s, filepath)
	})
}

func sendFileToPeer(s network.Stream, filepath string) { // used by the other peer
	// Open the file to send
	file, err := os.Open(filepath)
	if err != nil {
		log.Printf("Failed to open file '%s': %v", filepath, err)
		return
	}
	defer file.Close()

	// Copy the file content into the stream
	_, err = io.Copy(s, file)
	if err != nil {
		log.Printf("Failed to send file data: %v", err)
		return
	}

	log.Printf("File '%s' sent successfully.", filepath)
}

func (h *dhtHandler) sendDataToPeer(w http.ResponseWriter, r *http.Request) { // CID is the file hash that Peer (SEEMS TO BE CORRECT) // This might need to be a handler() for http 
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173") // Change to your frontend's URL
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight OPTIONS request
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	targetPeerID := r.URL.Query().Get("targetPeerID")
	cid := r.URL.Query().Get("cid")

	var ctx = context.Background()
	targetPeerID = strings.TrimSpace(targetPeerID)
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	peerinfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Fatalf("Failed to parse peer address: %s", err)
	}
	if err := h.node.Connect(ctx, *peerinfo); err != nil {
		log.Printf("Failed to connect to peer %s via relay: %v", peerinfo.ID, err)
		return
	}
	s, err := h.node.NewStream(network.WithAllowLimitedConn(ctx, "/senddata/p2p"), peerinfo.ID, "/senddata/p2p")
	if err != nil {
		log.Printf("Failed to open stream to %s: %s", peerinfo.ID, err)
		return
	}
	defer s.Close()

	// Step 1: Send the peerID and CID to Peer B
	peerID := h.node.ID().String()
	request := fmt.Sprintf("%s,%s\n", peerID, cid)
	_, err = s.Write([]byte(request))
	if err != nil {
		log.Printf("Failed to send request to Peer B: %s", err)
		return
	}

	log.Printf("Sent request to Peer B for file with CID: %s", cid)

	// Step 2: Receive the file from Peer B
	downloadPath, err := getDownloadPath()
	outputFileName := downloadPath + "/" + cid // Save the file with the CID as the name
	file, err := os.Create(outputFileName)
	if err != nil {
		log.Printf("Failed to create output file: %v", err)
		return
	}
	defer file.Close()

	// Copy the received file data from the stream into the file
	written, err := io.Copy(file, s)
	if err != nil {
		log.Printf("Failed to write file data: %v", err)
		return
	}

	w.Write([]byte("Successfully File Sent!"))

	log.Printf("File received and saved as '%s' (%d bytes)", outputFileName, written)

}

// RECEIVE FILE FROM PEER WHICH IS A HANDLER FOR A NEW STREAM THAT IS SPECIALIZED FOR RECEIVING A FILE FROM ANOTHER PEER USING ANOTHER PROTOCOL

func findFilePathByCID(cid string) string { // logic seems to be correct
    // Read metadata from the file
    existingMetadata, err := readMetadataFromFile(node_id)
    if err != nil {
        log.Printf("Failed to read existing metadata: %v", err)
        return ""
    }

    // Step 2: Search for the CID in the metadata list
    for _, entry := range existingMetadata {
        if entry.CID == cid {
            log.Printf("Found file for CID %s: %s", cid, entry.FilePath)
            log.Printf(entry.FilePath)

            return entry.FilePath
        }
    }

    // If no match is found
    log.Printf("No file found for CID %s", cid)
    return ""
}

// Code TO BE TESTED

func handlePeerExchange(node host.Host) {
	relayInfo, _ := peer.AddrInfoFromString(relay_node_addr)
	node.SetStreamHandler("/orcanet/p2p", func(s network.Stream) {
		defer s.Close()

		buf := bufio.NewReader(s)
		peerAddr, err := buf.ReadString('\n')
		if err != nil {
			if err != io.EOF {
				fmt.Printf("error reading from stream: %v", err)
			}
		}
		peerAddr = strings.TrimSpace(peerAddr)
		var data map[string]interface{}
		err = json.Unmarshal([]byte(peerAddr), &data)
		if err != nil {
			fmt.Printf("error unmarshaling JSON: %v", err)
		}
		if knownPeers, ok := data["known_peers"].([]interface{}); ok {
			for _, peer := range knownPeers {
				fmt.Println("Peer:")
				if peerMap, ok := peer.(map[string]interface{}); ok {
					if peerID, ok := peerMap["peer_id"].(string); ok {
						if string(peerID) != string(relayInfo.ID) {
							connectToPeerUsingRelay(node, peerID)
						}
					}
				}
			}
		}
	})
}

// CustomHandler holds shared resources like Kademlia DHT
type dhtHandler struct {
	kadDHT *dht.IpfsDHT
	node host.Host
}

func readMetadataFromFile(node_id string) ([]FileMetadata, error) {
	// Open the JSON file

	downloadPath, err := getDownloadPath()
	jsonPath := downloadPath + "/" + node_id

	file, err := os.Open(jsonPath)
	if err != nil {
		if os.IsNotExist(err) {
			// If the file does not exist, return an empty slice (no metadata yet)
			return []FileMetadata{}, nil
		}
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Read the file contents
	data, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Parse the JSON data into a slice of FileMetadata
	var metadata []FileMetadata
	err = json.Unmarshal(data, &metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	return metadata, nil
}

// String method for FileMetadata to customize its string representation
func (f FileMetadata) String() string {
	return fmt.Sprintf("cid: %s, description: %s, price: %f\n", f.CID, f.FileDescription, f.Price)
}

// String method for an array or slice of FileMetadata
func String(fms []FileMetadata) string {
	var result string
	for _, fm := range fms {
		result += fm.String() + "\n"
	}
	return result
}

// 	CHECK IF THERE IS ANOTHER EXTRY FOR THE SAME CID IF YES THEN THINK ABOUT WHAT TO DO!
func writeMetadataToFile(username string, newMetadata FileMetadata) error { //username = node_id
    // Read existing metadata from the file
    downloadPath, err := getDownloadPath()
    jsonPath := downloadPath + "/" + username

    existingMetadata, err := readMetadataFromFile(username)
    if err != nil {
        return fmt.Errorf("failed to read existing metadata: %w", err)
    }

	// Debugging: Check the content of existingMetadata before marshaling
	fmt.Printf("Existing Metadata: %+v\n", existingMetadata)

	// Check for duplicate CIDs in the existing metadata
    duplicateFound := false
    for _, metadata := range existingMetadata {
        if metadata.CID == newMetadata.CID {
            duplicateFound = true

            break
        }
    }

    // If a duplicate is found, do not append the new metadata
    if duplicateFound {
        log.Println("Duplicate CID found. Skipping the addition of new metadata.")
        return nil
    }

    // Append the new metadata entry
	existingMetadata = append(existingMetadata, newMetadata)

	// Convert the entire updated metadata slice back to JSON
	data, err := json.MarshalIndent(existingMetadata, "", " ")
	if err != nil {
	return fmt.Errorf("failed to encode JSON: %w", err)
	}

	// Debugging: Print the marshaled JSON before writing
	fmt.Println("Marshaled JSON:", string(data))

	// Write the updated JSON data back to the file
	err = ioutil.WriteFile(jsonPath, data, 0644)
	if err != nil {
	return fmt.Errorf("failed to write to file: %w", err)
	}
	log.Println("New metadata added successfully!")
	return nil

}

// Function to get the download path for the current user
func getDownloadPath() (string, error) {
	// Get the current user
	currentUser, err := user.Current()
	if err != nil {
		return "", fmt.Errorf("failed to get current user: %w", err)
	}

	// Construct the download path (typically ~/Downloads)
	downloadPath := filepath.Join(currentUser.HomeDir, "Downloads")

	// Check if the Downloads directory exists
	if _, err := os.Stat(downloadPath); os.IsNotExist(err) {
		return "", fmt.Errorf("downloads directory does not exist: %s", downloadPath)
	}

	return downloadPath, nil
}

func createCIDFromFile(content []byte) cid.Cid {
	// Hash the file content using SHA-256
	hash := sha256.Sum256(content)

	// Encode the hash into a multihash
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		log.Fatalf("Error encoding multihash: %v", err)
	}

	// Create a CID from the multihash
	c := cid.NewCidV1(cid.Raw, mh)

	// Return the CID as a string
	return c
}


// Function to open a file and hash it using SHA-256
func hashFileSHA256(filePath string) (cid.Cid, error) {
	// Open the file
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Fatalf("Failed to read file: %v", err)
	}

	cid := createCIDFromFile(content)
	fmt.Printf("Generated CID: %s\n", cid.String())

	return cid, err
}

// Handler to advertise provider and store metadata in local JSON
func (h *dhtHandler) advertiseHandler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173") // Change to your frontend's URL
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight OPTIONS request
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.Write([]byte("Hello World!2.0"))

	filepath := r.URL.Query().Get("filepath")
	price := r.URL.Query().Get("price")
	file_description := r.URL.Query().Get("description")
	walletaddress := r.URL.Query().Get("walletaddress") 

    // Parse CID from string //POTENTIALLY CID DEBUG NEEDED
    c, err := hashFileSHA256(filepath)
    if err != nil {
        http.Error(w, "Invalid CID", http.StatusBadRequest)
        return
    }

    // Simulate storing provider in DHT using putProvider()
    err = h.kadDHT.Provide(context.Background(), c, true)
    if err != nil {
        fmt.Fprintf(w, "err: , %s", err)
        return
    }

    // Simulate storing metadata locally in JSON (you can enhance this part)

    cidStr, err := hashFileSHA256(filepath) //get the file using the IO Functions and use SHA-256 to get the filehash; CURRENTY THIS IMPLEMENTATION IS WRONG!!!

    // ADD ERROR HANDLING HERE BY CHECKING THE 'err' VARIABLE

    // Convert the string price to an integer
    price_int, err := strconv.ParseFloat(price, 64)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    metadata := FileMetadata{
        CID: cidStr.String(),
        FileDescription: file_description,
        Price: price_int,
        FilePath: filepath,
        WalletAddress: walletaddress,
    }
    
    err = writeMetadataToFile(node_id, metadata)
    if err != nil {
        log.Printf("%s\n", err)
    }

    log.Printf("Successfully advertised as provider for CID: %s\n", cidStr.String())

}

// Pushkar's Code

type FileMetadata struct {
    CID string `json:"cid"`
    FileDescription string `json:"fileDescription"`
    Price float64 `json:"price"`
    FilePath string `json:"filepath"`
    WalletAddress string `json:"walletaddress"`
}


func setupCIDQueryHandler(node host.Host) {
	// Handle incoming streams for CID queries
	node.SetStreamHandler("/cid-get/1.0.0", func(s network.Stream) {
		defer s.Close()

		// Read the requested CID from the stream
		buf := bufio.NewReader(s)
		requestedCID, err := buf.ReadString('\n')
		if err != nil {
			log.Printf("Error reading CID from stream: %v", err)
			return
		}
		requestedCID = strings.TrimSpace(requestedCID)
		log.Printf("Received CID query: %s", requestedCID)

		// Check local metadata file for the CID
		localMetadata, err := readMetadataFromFile(node_id)
		if err != nil {
			log.Printf("Error reading local metadata: %v", err)
			return
		}

		var matchingMetadata []FileMetadata
		for _, metadata := range localMetadata {
			if metadata.CID == requestedCID {
				matchingMetadata = append(matchingMetadata, metadata)
			}
		}

		// Create response structure with peerID and node information
		response := struct {
			PeerID   string         `json:"peer_id"`
			NodeInfo string         `json:"node_info"` // Custom node-specific information
			Metadata []FileMetadata `json:"metadata"`
		}{
			PeerID:   node.ID().String(), // Include responder's peerID
			NodeInfo: "Example Node Info", // Replace with actual node metadata
			Metadata: matchingMetadata,
		}

		// Encode the response as JSON and send it back
		responseBytes, err := json.Marshal(response)
		if err != nil {
			log.Printf("Error encoding metadata response: %v", err)
			return
		}

		_, err = s.Write(responseBytes)
		if err != nil {
			log.Printf("Error writing response to stream: %v", err)
			return
		}

		log.Printf("Sent matching metadata for CID: %s", requestedCID)
	})
}


func queryCIDFromPeers(node host.Host, peers []peer.ID, targetCID string) ([]struct {
	PeerID   string         `json:"peer_id"`
	NodeInfo string         `json:"node_info"`
	Metadata []FileMetadata `json:"metadata"`
}, error) {
	var aggregatedResults []struct {
		PeerID   string         `json:"peer_id"`
		NodeInfo string         `json:"node_info"`
		Metadata []FileMetadata `json:"metadata"`
	}

	for _, peerID := range peers {
		log.Printf("Querying peer: %s for CID: %s", peerID.String(), targetCID)

		// Open a stream to the peer
		s, err := node.NewStream(context.Background(), peerID, "/cid-get/1.0.0")
		if err != nil {
			log.Printf("Failed to open stream to peer %s: %v", peerID, err)
			continue
		}

		// Send the CID query
		_, err = s.Write([]byte(targetCID + "\n"))
		if err != nil {
			log.Printf("Error sending CID query to peer %s: %v", peerID, err)
			s.Close()
			continue
		}

		// Read the response
		responseData, err := io.ReadAll(s)
		if err != nil {
			log.Printf("Error reading response from peer %s: %v", peerID, err)
			s.Close()
			continue
		}
		s.Close()

		// Decode the response into a structured format
		var peerResponse struct {
			PeerID   string         `json:"peer_id"`
			NodeInfo string         `json:"node_info"`
			Metadata []FileMetadata `json:"metadata"`
		}
		err = json.Unmarshal(responseData, &peerResponse)
		if err != nil {
			log.Printf("Error decoding response from peer %s: %v", peerID, err)
			continue
		}

		// Append to the aggregated results
		aggregatedResults = append(aggregatedResults, peerResponse)
	}

	return aggregatedResults, nil
}

type PeerIDs struct {
    PeerID   string         `json:"peer_id"`
	NodeInfo string         `json:"node_info"`
	Metadata []FileMetadata `json:"metadata"`
}

// WRITE THE JSON LIST THROUGH THE RESPONSEWRITER!
func (h *dhtHandler) getProvidersHandler(w http.ResponseWriter, r *http.Request) {

	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173") // Change to your frontend's URL
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight OPTIONS request
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	targetCID := r.URL.Query().Get("targetCID")

	c, err := cid.Decode(targetCID)
	if err != nil {
		http.Error(w, "Invalid CID", http.StatusBadRequest)
        return
	}

	// Find providers for the CID
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()



	providers, err := h.kadDHT.FindProviders(ctx, c)
	if err != nil {
	    log.Printf("Error finding providers: %v", err)
	    http.Error(w, "Error finding providers", http.StatusInternalServerError)
	    return
	}

	// Initialize an empty slice of peer.ID
	peerIDs := []peer.ID{}

	// Iterate over the slice of providers
	for _, p := range providers {
	    if p.ID != "" { // Check if the provider has a valid ID
	        log.Printf("Found provider: %s", p.ID)
	        peerIDs = append(peerIDs, p.ID)
	    } else {
	        log.Println("Provider record with empty peer ID")
	    }
	}

	log.Printf("All providers: %+v", providers)

	cidStr := c.String()

	log.Printf("Found %d peers providing the CID: %s", len(peerIDs), c)



	// Query metadata from each peer
	peerIDMeta, err := queryCIDFromPeers(h.node, peerIDs, cidStr)
	if err != nil {
	    http.Error(w, "Failed to query peers", http.StatusInternalServerError)
	    log.Printf("Error querying peers: %v", err)
	    return
	}

	// Set the Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	err = json.NewEncoder(w).Encode(peerIDMeta)
	if err != nil {
		http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
		log.Printf("Error encoding JSON: %v", err)
	}
}

func main() {

	node, dht, err := createNode()
	if err != nil {
		log.Fatalf("Failed to create node: %s", node)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	globalCtx = ctx

	fmt.Println("Node multiaddresses:", node.Addrs())
	fmt.Println("Node Peer ID:", node.ID())

	connectToPeer(node, relay_node_addr) // connect to relay node
	makeReservation(node)                // make reservation on realy node
	go refreshReservation(node, 10*time.Minute)
	connectToPeer(node, bootstrap_node_addr) // connect to bootstrap node
	go handlePeerExchange(node)
	setupCIDQueryHandler(node)
	receiveDataFromPeer(node)

	// sendDataToPeer(node, "12D3KooWKNWVMpDh5ZWpFf6757SngZfyobsTXA8WzAWqmAjgcdE6") // why does this exist

	defer node.Close()

	handler := &dhtHandler{kadDHT: dht, node: node}

    // Create a new router
    r := mux.NewRouter()

    // Define the home handler
    r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173") // Change to your frontend's URL
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight OPTIONS request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
        w.Write([]byte("Hello World!"))
    })

    // Route to advertise a provider for a specific CID (PUT /advertise/{cid})
	r.HandleFunc("/advertise/", handler.advertiseHandler).Methods("POST")

	// Route to get providers for a specific CID (GET /providers/{cid})
	r.HandleFunc("/providers/", handler.getProvidersHandler).Methods("GET")

	r.HandleFunc("/file-transfer-request/", handler.sendDataToPeer).Methods("POST")

	// r.HandleFunc("/api/proxy", handlePostRequest).Methods("POST")


    // Channel to signal shutdown
    quit := make(chan struct{})

    // Define the shutdown handler
    r.HandleFunc("/shutdown", func(w http.ResponseWriter, r *http.Request) {
	    // Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173") // Change to your frontend's URL
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight OPTIONS request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

        if r.Method == http.MethodPost {
            w.Write([]byte("Server is shutting down..."))
            close(quit) // Signal to shutdown
        } else {
            w.WriteHeader(http.StatusMethodNotAllowed)
        }
    }).Methods("POST")

    // Create the server
    srv := &http.Server{
        Addr:    ":6100",
        Handler: r,
    }

    // Start the server in a goroutine
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Could not listen on %s: %v\n", srv.Addr, err)
        }
    }()
    fmt.Println("Server is ready to handle requests at", srv.Addr)

    // Listen for OS interrupts to also allow graceful shutdown via Ctrl+C
    signalChan := make(chan os.Signal, 1)
    signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)

    // Block until we receive a signal on quit channel or OS interrupt
    select {
    case <-quit:
        log.Println("Shutdown requested via API...")
    case <-signalChan:
        log.Println("Shutdown requested via OS signal...")
    }

    log.Println("Server is shutting down...")

    // Create a deadline for the shutdown process
    ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Attempt graceful shutdown
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("Could not gracefully shutdown the server: %v\n", err)
    }

    log.Println("Server stopped")
}

func provideKey(ctx context.Context, dht *dht.IpfsDHT, key string) error {
	data := []byte(key)
	hash := sha256.Sum256(data)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return fmt.Errorf("error encoding multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)

	// Start providing the key
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}
	return nil
}

func makeReservation(node host.Host) {
	ctx := globalCtx
	relayInfo, err := peer.AddrInfoFromString(relay_node_addr)
	if err != nil {
		log.Fatalf("Failed to create addrInfo from string representation of relay multiaddr: %v", err)
	}
	_, err = client.Reserve(ctx, node, *relayInfo)
	if err != nil {
		log.Fatalf("Failed to make reservation on relay: %v", err)
	}
	fmt.Printf("Reservation successfull \n")
}

func refreshReservation(node host.Host, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			makeReservation(node)
		case <-globalCtx.Done():
			fmt.Println("Context done, stopping reservation refresh.")
			return
		}
	}
}

/*
type ProxyDetails struct {
    PeerID        string `json:"peer_id"`
    Location      string `json:"location"`
    Price         int    `json:"price"`
    WalletAddress string `json:"wallet_address"`
    ip        string     `json:"ip"`
    port      string     `json:"port"`
}

func advertiseLocation(ctx context.Context, dht *dht.IpfsDHT, details ProxyDetails) error {
    
    locationKey := details.Location

    // Convert the location to a CID (content identifier)
    cid, err := dht.CIDFromString(locationKey)
    if err != nil {
        return fmt.Errorf("failed to convert location to CID: %v", err)
    }

    // Advertise this node as a provider for the location key
    err = dht.Provide(ctx, cid, true)
    if err != nil {
        return fmt.Errorf("failed to advertise location: %v", err)
    }

    recordKey := fmt.Sprintf("proxy:%s", details.PeerID)

    value, err := json.Marshal(details)
    if err != nil {
        return fmt.Errorf("error serializing proxy details for PeerID %s: %v", details.PeerID, err)
    }

    err = dht.PutValue(ctx, recordKey, value)
    if err != nil {
        return fmt.Errorf("error storing proxy details for PeerID %s: %v", details.PeerID, err)
    }

    log.Printf("Stored proxy details for PeerID %s\n", details.PeerID)

    log.Printf("Node %s advertised as provider for location %s\n", details.PeerID, locationKey)
    return nil
}
func (h *dhtHandler) advertiseLocationHandler(w http.ResponseWriter, r *http.Request) {
    
    var details ProxyDetails
    if err := json.NewDecoder(r.Body).Decode(&details); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    
    if err := advertiseLocation(r.Context(), h.dht, details); err != nil {
        http.Error(w, fmt.Sprintf("Failed to advertise location: %v", err), http.StatusInternalServerError)
        return
    }

    // Return a success response
    w.WriteHeader(http.StatusOK)
    fmt.Fprintf(w, "Node %s successfully advertised as a provider for location %s\n", details.PeerID, details.Location)
}

func getLocation(ctx context.Context, dht *dht.IpfsDHT, location string) ([]ProxyDetails, error) {
    // Convert the location to a CID
    cid, err := dht.CIDFromString(location)
    if err != nil {
        return nil, fmt.Errorf("failed to convert location to CID: %v", err)
    }

    // Find providers for the location key
    providers := dht.FindProviders(ctx, cid)
    matchedProxies := []ProxyDetails{} // Slice to store matching proxies

    for provider := range providers {
        // Construct the record key for the provider
        recordKey := fmt.Sprintf("proxy:%s", provider.ID.String())

        // Get the value from the DHT
        value, err := dht.GetValue(ctx, recordKey)
        if err != nil {
            log.Printf("Failed to retrieve proxy details for PeerID %s: %v", provider.ID.String(), err)
            continue // Skip to the next provider if retrieval fails
        }

        // Unmarshal the value into a ProxyDetails struct
        var details ProxyDetails
        if err := json.Unmarshal(value, &details); err != nil {
            log.Printf("Failed to unmarshal proxy details for PeerID %s: %v", provider.ID.String(), err)
            continue // Skip if unmarshaling fails
        }

        // Check if the location matches
        if details.Location == location && details.Price > 0 {
            matchedProxies = append(matchedProxies, details) // Add to results
        
        }
    }

    log.Printf("Found %d providers matching location %s\n", len(matchedProxies), location)
    return matchedProxies, nil
}


func (h *dhtHandler) getLocationHandler(w http.ResponseWriter, r *http.Request) {
    // Parse the location from the query parameters
    location := r.URL.Query().Get("location")
    if location == "" {
        http.Error(w, "Missing 'location' query parameter", http.StatusBadRequest)
        return
    }

    // Use the HTTP request's context for cancellation and timeouts
    ctx := r.Context()

    // Call the getLocation function to fetch matching proxies
    proxies, err := getLocation(ctx, h.dht, location, limit)
    if err != nil {
        http.Error(w, fmt.Sprintf("Failed to fetch providers for location: %v", err), http.StatusInternalServerError)
        return
    }

    // Respond with the matched proxies as a JSON array
    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(proxies); err != nil {
        http.Error(w, "Failed to encode response", http.StatusInternalServerError)
    }
}*/
