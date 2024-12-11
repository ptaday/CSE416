use actix_web::{post, web, HttpResponse, Responder};
use bitcoincore_rpc::{Client, RpcApi};
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{error, info};
use std::sync::Arc;

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
    rpc: web::Data<Arc<Client>>,
    request: web::Json<RegisterRequest>,
) -> impl Responder {
    let passphrase = &request.passphrase;
    info!("Received registration request with passphrase: {}", passphrase);

    let wallet_dirs = match rpc.list_wallet_dir() {
        Ok(dirs) => dirs,
        Err(e) => {
            error!("Errr listing wallet directories: {:?}", e);
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to list wallet directories."}));
        }
    };

    let wallet_exists = wallet_dirs.iter().any(|w| w == passphrase);

    if wallet_exists {
        info!("Wallet'{}' already exists.", passphrase);

        let loaded_wallets = match rpc.list_wallets() {
            Ok(wallets) => wallets,
            Err(e) => {
                error!("Error listing loaded wallets: {:?}", e);
                return HttpResponse::InternalServerError()
                    .json(json!({"error": "Failed to list loaded wallets."}));
            }
        };

        if !loaded_wallets.iter().any(|w| w == passphrase) {
            match rpc.load_wallet(passphrase) {
                Ok(_) => info!("Wallet '{}' loaded successfully.", passphrase),
                Err(e) => {
                    error!("Error loading wallet '{}': {:?}", passphrase, e);
                    return HttpResponse::InternalServerError()
                        .json(json!({"error": "Failed to load wallet."}));
                }
            }
        }
        let address = match rpc.get_new_address(Some(passphrase), None) {
            Ok(addr) => format!("{:?}", addr), 
            Err(e) => {
                error!("Error generating new address for wallet '{}': {:?}", passphrase, e);
                return HttpResponse::InternalServerError()
                    .json(json!({"error": "Failed to generate new address."}));
            }
        };
        return HttpResponse::Ok().json(RegisterResponse { wallet_id: address });
    }

    match rpc.create_wallet(passphrase, None, None, Some(passphrase.as_str()), None) {
        Ok(_) => info!("Wallet '{}' created successfully.", passphrase),
        Err(e) => {
            error!("Error creating wallet '{}': {:?}", passphrase, e);

            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to create wallet."}));
        }
    }
    let address = match rpc.get_new_address(Some(passphrase), None) {
        Ok(addr) => format!("{:?}", addr), 
        Err(e) => {
            error!("Error generating a new address for wallet '{}': {:?}", passphrase, e);
            return HttpResponse::InternalServerError()
                .json(json!({"error": "Failed to generate new address."}));
        }
    };

    HttpResponse::Ok().json(RegisterResponse { wallet_id: address })
}
