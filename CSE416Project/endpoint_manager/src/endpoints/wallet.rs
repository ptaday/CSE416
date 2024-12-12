use actix_web::{post, get, web, HttpResponse, Responder};
use bitcoincore_rpc::RpcApi;
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, info};
use std::sync::Arc;
// use bitcoincore_rpc::{Client, RpcApi};



#[derive(Deserialize)]
pub struct RegisterRequest {
    pub wallet_name: String,
    pub passphrase: String,
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub wallet_id: String,
}

#[post("/api/register")]
pub async fn register_wallet(
    rpc: web::Data<Arc<crate::rpc_client::RpcClientData>>,
    request: web::Json<RegisterRequest>,
) -> impl Responder {
    let wallet_name = &request.wallet_name;
    let _passphrase = &request.passphrase; // Underscore to silence unused variable warning if needed.
    info!("Received registration request for wallet '{}'", wallet_name);

    let wallet_exists = match rpc.list_wallet_dir() {
        Ok(dirs) => dirs.iter().any(|w| w == wallet_name),
        Err(e) => {
            error!("Error listing wallet directories: {:?}", e);
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to list wallet directories."}));
        }
    };

    if wallet_exists {
        info!("Wallet '{}' already exists.", wallet_name);

        let loaded_wallets = match rpc.list_wallets() {
            Ok(wallets) => wallets,
            Err(e) => {
                error!("Error listing loaded wallets: {:?}", e);
                return HttpResponse::InternalServerError()
                    .json(json!({"error": "Failed to list loaded wallets."}));
            }
        };

        if !loaded_wallets.iter().any(|w| w == wallet_name) {
            match rpc.load_wallet(wallet_name) {
                Ok(_) => info!("Wallet '{}' loaded successfully.", wallet_name),
                Err(e) => {
                    error!("Error loading wallet '{}': {:?}", wallet_name, e);
                    return HttpResponse::InternalServerError()
                        .json(json!({"error": "Failed to load wallet."}));
                }
            }
        }

        let wallet_client = match rpc.new_client_for_wallet(wallet_name) {
            Ok(client) => Arc::new(client),
            Err(e) => {
                error!("Error creating wallet-specific RPC client: {:?}", e);
                return HttpResponse::InternalServerError()
                    .json(json!({"error": "Failed to create wallet RPC client."}));
            }
        };

        let address = match wallet_client.get_new_address(None, None) {
            Ok(addr) => format!("{:?}", addr).trim_matches('"').to_string(), // Clean address format
            Err(e) => {
                error!("Error generating new address for wallet '{}': {:?}", wallet_name, e);
                return HttpResponse::InternalServerError()
                    .json(json!({"error": "Failed to generate new address."}));
            }
        };

        return HttpResponse::Ok().json(RegisterResponse { wallet_id: address });
    }

    // Wallet does not exist, create it
    match rpc.create_wallet(wallet_name, None, None, Some(wallet_name.as_str()), None) {
        Ok(_) => info!("Wallet '{}' created successfully.", wallet_name),
        Err(e) => {
            error!("Error creating wallet '{}': {:?}", wallet_name, e);
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to create wallet."}));
        }
    }

    let wallet_client = match rpc.new_client_for_wallet(wallet_name) {
        Ok(client) => Arc::new(client),
        Err(e) => {
            error!("Error creating wallet-specific RPC client: {:?}", e);
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to create wallet RPC client."}));
        }
    };

    let address = match wallet_client.get_new_address(None, None) {
        Ok(addr) => format!("{:?}", addr).trim_matches('"').to_string(), // Clean address format
        Err(e) => {
            error!("Error generating a new address for wallet '{}': {:?}", wallet_name, e);
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to generate new address."}));
        }
    };

    HttpResponse::Ok().json(RegisterResponse { wallet_id: address })
}


#[get("/balance/{wallet_name}")]
pub async fn get_balance(
    rpc: web::Data<Arc<crate::rpc_client::RpcClientData>>,
    wallet_name: web::Path<String>
) -> impl Responder {
    let wallet_name = wallet_name.into_inner();

    let wallet_client = match rpc.new_client_for_wallet(&wallet_name) {
        Ok(client) => client,
        Err(e) => {
            error!("Error creating wallet-specific RPC client: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "status": "error", 
                "message": "Failed to create wallet RPC client"
            }));
        }
    };

    match wallet_client.get_balance(None, None) {
        Ok(balance) => HttpResponse::Ok().json(json!({
            "status": "success",
            "wallet": wallet_name,
            "balance": balance.to_string()
        })),
        Err(e) => {
            error!("Error getting balance for wallet '{}': {:?}", wallet_name, e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error", 
                "message": format!("Error getting balance for wallet {}: {:?}", wallet_name, e)
            }))
        }
    }
}

use bitcoin::{Address, Network};
use bitcoin::address::NetworkUnchecked;

use bitcoincore_rpc::{
    bitcoin::amount::Amount, 
    json::EstimateMode
};

#[derive(Deserialize)]
pub struct SendToAddressRequest {
    pub address: String,
    pub amount: f64,
    pub comment: Option<String>,
}

#[post("/api/send")]
pub async fn send_to_address(
    rpc: web::Data<Arc<crate::rpc_client::RpcClientData>>,
    request: web::Json<SendToAddressRequest>
) -> impl Responder {
    // Validate address
    let address = match request.address.parse::<Address<NetworkUnchecked>>() {
        Ok(addr) => match addr.require_network(Network::Maintest) {
            Ok(checked_addr) => checked_addr,
            Err(_) => {
                return HttpResponse::BadRequest().json(json!({
                    "status": "error", 
                    "message": "Invalid network for address"
                }));
            }
        },
        Err(_) => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error", 
                "message": "Invalid Bitcoin address"
            }));
        }
    };

    // Validate amount
    let amount = match Amount::from_btc(request.amount) {
        Ok(amt) => amt,
        Err(_) => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error", 
                "message": "Invalid amount"
            }));
        }
    };

    // Create wallet client
    let wallet_client = match rpc.new_client_for_wallet("default") {
        Ok(client) => client,
        Err(e) => {
            error!("RPC client error: {:?}", e);
            return HttpResponse::InternalServerError().json(json!({
                "status": "error", 
                "message": "Failed to create wallet client"
            }));
        }
    };

    // Send transaction
    match wallet_client.send_to_address(
        &address,  
        amount,    
        request.comment.as_deref(),  
        None,      
        None,      
        None,      
        None,      
        Some(EstimateMode::Unset)  
    ) {
        Ok(txid) => HttpResponse::Ok().json(json!({
            "status": "success",
            "transaction_id": txid.to_string()
        })),
        Err(e) => {
            error!("Send transaction error: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error", 
                "message": format!("Transaction failed: {:?}", e)
            }))
        }
    }
}
