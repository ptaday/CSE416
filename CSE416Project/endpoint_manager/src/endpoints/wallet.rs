use actix_web::{post, web, HttpResponse, Responder};
use bitcoincore_rpc::{Client, RpcApi};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, info};
use std::sync::Arc;
use bitcoin::network::constants::Network;
use bitcoin::util::address::Address;
use bitcoin::transaction::Transaction;
use std::collections::HashMap;
use std::sync::Mutex;
use std::error::Error;

#[derive(Clone)]
pub struct RpcHandler {
    rpc_client: Client,
}

impl RpcHandler {
    pub fn new(rpc_client: Client) -> Self {
        RpcHandler { rpc_client }
    }

    pub fn check_block_count(&self) {
        let block_count = self
            .rpc_client
            .get_block_count()
            .expect("Failed to get block count");
        println!("Current block count: {}", block_count);
    }

    pub fn check_balance(&self) {
        let balance = self
            .rpc_client
            .get_balance(None, None)
            .expect("Failed to get balance");
        println!("Current balance: {}", balance);
    }

    /// Generate a single block with the given address as the coinbase recipient
    pub fn generate_to_address(&self, address_string: &str) -> Result<String, Box<dyn Error>> {
        let recipient_address = Address::from_str(address_string)?.assume_checked();
        let hashes = self.rpc_client.generate_to_address(1, &recipient_address)?;
        Ok(format!("{:?}", hashes[0]))
    }

    pub fn get_client(&self) -> &Client {
        &self.rpc_client
    }
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub passphrase: String,
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub wallet_id: String,
}

#[post("/api/register")]
pub async fn register_wallet(
    rpc: web::Data<RpcHandler>,
    request: web::Json<RegisterRequest>,
) -> impl Responder {
    let passphrase = &request.passphrase;
    info!("Received registration request with passphrase: {}", passphrase);

    let wallet_dirs = match rpc.get_client().list_wallet_dir() {
        Ok(dirs) => dirs,
        Err(e) => {
            error!("Error listing wallet directories: {:?}", e);
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to list wallet directories."}));
        }
    };

    let wallet_exists = wallet_dirs.iter().any(|w| w == passphrase);

    if wallet_exists {
        info!("Wallet '{}' already exists.", passphrase);

        let loaded_wallets = match rpc.get_client().list_wallets() {
            Ok(wallets) => wallets,
            Err(e) => {
                error!("Error listing loaded wallets: {:?}", e);
                return HttpResponse::InternalServerError()
                    .json(json!({"error": "Failed to list loaded wallets."}));
            }
        };

        if !loaded_wallets.iter().any(|w| w == passphrase) {
            match rpc.get_client().load_wallet(passphrase) {
                Ok(_) => info!("Wallet '{}' loaded successfully.", passphrase),
                Err(e) => {
                    error!("Error loading wallet '{}': {:?}", passphrase, e);
                    return HttpResponse::InternalServerError()
                        .json(json!({"error": "Failed to load wallet."}));
                }
            }
        }

        let address = match rpc.get_client().get_new_address(Some(passphrase), None) {
            Ok(addr) => format!("{:?}", addr),
            Err(e) => {
                error!("Error generating new address for wallet '{}': {:?}", passphrase, e);
                return HttpResponse::InternalServerError()
                    .json(json!({"error": "Failed to generate new address."}));
            }
        };

        return HttpResponse::Ok().json(RegisterResponse { wallet_id: address });
    }

    match rpc.get_client().create_wallet(passphrase, None, None, Some(passphrase.as_str()), None) {
        Ok(_) => info!("Wallet '{}' created successfully.", passphrase),
        Err(e) => {
            error!("Error creating wallet '{}': {:?}", passphrase, e);
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to create wallet."}));
        }
    }

    let address = match rpc.get_client().get_new_address(Some(passphrase), None) {
        Ok(addr) => format!("{:?}", addr),
        Err(e) => {
            error!("Error generating a new address for wallet '{}': {:?}", passphrase, e);
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to generate new address."}));
        }
    };

    HttpResponse::Ok().json(RegisterResponse { wallet_id: address })
}

#[derive(Serialize, Deserialize)]
struct WalletResponse {
    address: String,
    balance: f64,
}

#[derive(Serialize, Deserialize)]
struct TransactionRequest {
    from_address: String,
    to_address: String,
    amount: f64,
}

#[derive(Serialize, Deserialize)]
struct BlockResponse {
    block_hash: String,
    miner_address: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct TransactionInfo {
    tx_id: String,
    from_address: String,
    to_address: String,
    amount: f64,
}

struct AppState {
    transactions: Mutex<HashMap<String, TransactionInfo>>,
}

#[derive(Deserialize)]
struct MineRequest {
    num_blocks: u32,
    miner_address: String,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let rpc_client = Client::new("http://localhost:8332", "user", "password").unwrap(); // Replace with actual credentials
    let rpc_handler = RpcHandler::new(rpc_client);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(AppState {
                transactions: Mutex::new(HashMap::new()),
            }))
            .app_data(web::Data::new(rpc_handler.clone()))
            .route("/api/wallet/balance/{address}", web::get().to(get_balance))
            .route("/api/transaction", web::post().to(create_transaction))
            .route("/api/transactions", web::get().to(list_transactions))
            .route("/api/transaction/{tx_id}", web::get().to(get_transaction))
            // .route("/api/mine", web::post().to(mine_block))
            .route("/api/register", web::post().to(register_wallet))
            .route("/api/block_count", web::get().to(check_block_count))  
            .route("/api/check_balance", web::get().to(check_balance))   
           .route("/api/generate_block", web::post().to(generate_block))   
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

async fn check_block_count(rpc: web::Data<RpcHandler>) -> impl Responder {
    rpc.check_block_count();
    HttpResponse::Ok().body("Block count checked.")
}

async fn check_balance(rpc: web::Data<RpcHandler>) -> impl Responder {
    rpc.check_balance();
    HttpResponse::Ok().body("Balance checked.")
}

async fn generate_block(
    rpc: web::Data<RpcHandler>,
    address: web::Json<String>,
) -> impl Responder {
    match rpc.generate_to_address(&address.into_inner()) {
        Ok(block_hash) => HttpResponse::Ok().json(json!({ "block_hash": block_hash })),
        Err(e) => {
            error!("Error generating block: {:?}", e);
            HttpResponse::InternalServerError().json(json!({ "error": "Failed to generate block." }))
        }
    }
}

async fn get_balance(address: web::Path<String>) -> impl Responder {
    let balance = 0.5;  // Example balance in BTC
    HttpResponse::Ok().json(WalletResponse {
        address: address.into_inner(),
        balance,
    })
}

async fn create_transaction(
    tx_request: web::Json<TransactionRequest>,
    data: web::Data<AppState>,
) -> impl Responder {
    let tx_in = bitcoin::blockdata::transaction::TxIn {
        previous_output: Default::default(),
        script_sig: Default::default(),
        sequence: Default::default(),
        witness: Default::default(),
    };

    let tx_out = bitcoin::blockdata::transaction::TxOut {
        value: (tx_request.amount * 100_000_000.0) as u64,
        script_pubkey: Address::from_str(&tx_request.to_address).unwrap().script_pubkey(),
    };

    let tx = Transaction {
        version: 1,
        lock_time: 0,
        input: vec![tx_in],
        output: vec![tx_out],
    };

    let tx_id = "fake_tx_id_123".to_string();

    let transaction_info = TransactionInfo {
        tx_id: tx_id.clone(),
        from_address: tx_request.from_address.clone(),
        to_address: tx_request.to_address.clone(),
        amount: tx_request.amount,
    };

    let mut transactions = data.transactions.lock().unwrap();
    transactions.insert(tx_id.clone(), transaction_info);

    HttpResponse::Ok().body(format!("Transaction broadcasted successfully with ID: {}", tx_id))
}

async fn list_transactions(data: web::Data<AppState>) -> impl Responder {
    let transactions = data.transactions.lock().unwrap();
    let transaction_list: Vec<TransactionInfo> = transactions.values().cloned().collect();
    HttpResponse::Ok().json(transaction_list)
}

async fn get_transaction(
    tx_id: web::Path<String>,
    data: web::Data<AppState>,
) -> impl Responder {
    let transactions = data.transactions.lock().unwrap();
    match transactions.get(&tx_id.into_inner()) {
        Some(transaction) => HttpResponse::Ok().json(transaction),
        None => HttpResponse::NotFound().body("Transaction not found"),
    }
}

// async fn mine_block(req: web::Json<MineRequest>) -> impl Responder {
//     let num_blocks = req.num_blocks;
//     let miner_add = req.miner_address.clone();

//     let mut block_hashes = Vec::new();
//     let miner_address = miner_add;  // Placeholder miner address

//     for i in 0..num_blocks {
//         let block_hash = format!("0000000000000000000d77f6842c8ec8696b042e08d2f0c8ecfce0592cf8a674_{}", i);
//         block_hashes.push(block_hash);
//     }

//     HttpResponse::Ok().json(BlockResponse {
//         block_hash: block_hashes.join(", "),
//         miner_address: miner_address.to_string(),
//     })
// }
