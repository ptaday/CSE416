use bitcoincore_rpc::{Auth, Client};
use log::{error, info};
use std::env;
use std::sync::Arc;

pub fn initialize_rpc_client() -> Arc<Client> {
    let rpc_url = env::var("RPC_URL").expect("RPC_URL must be set in .env");
    let rpc_user = env::var("RPC_USER").expect("RPC_USER must be set in .env");
    let rpc_password = env::var("RPC_PASSWORD").expect("RPC_PASSWORD must be set in .env");

    info!("RPC_URL: {}", rpc_url);
    info!("RPC_USER: {}", rpc_user);

    let rpc_client = match Client::new(&rpc_url, Auth::UserPass(rpc_user, rpc_password)) {
        Ok(client) => {
            info!("Connected to Bitcoin RPC at {}", rpc_url);
            client
        }
        Err(e) => {
            error!("Error creating RPC client: {:?}", e);
            std::process::exit(1);
        }
    };

    Arc::new(rpc_client)
}
