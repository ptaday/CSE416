
use bitcoincore_rpc::{Auth, Client, RpcApi};
use log::info;
use std::env;
use std::sync::Arc;
use url::Url;

pub struct RpcClientData {
    base_url: Url,
    auth: Auth,
}

impl RpcClientData {
    pub fn new(base_url: Url, auth: Auth) -> Self {
        RpcClientData { base_url, auth }
    }

    pub fn new_client_for_wallet(&self, wallet_name: &str) -> Result<Client, bitcoincore_rpc::Error> {
        let mut wallet_url = self.base_url.clone();
        wallet_url.set_path(&format!("/wallet/{}", wallet_name));
        Client::new(wallet_url.as_str(), self.auth.clone())
    }

    pub fn list_wallet_dir(&self) -> Result<Vec<String>, bitcoincore_rpc::Error> {
        let client = Client::new(self.base_url.as_str(), self.auth.clone())?;
        client.list_wallet_dir()
    }

    pub fn list_wallets(&self) -> Result<Vec<String>, bitcoincore_rpc::Error> {
        let client = Client::new(self.base_url.as_str(), self.auth.clone())?;
        client.list_wallets()
    }

    pub fn load_wallet(&self, wallet_name: &str) -> Result<(), bitcoincore_rpc::Error> {
        let client = Client::new(self.base_url.as_str(), self.auth.clone())?;
        client.load_wallet(wallet_name).map(|_| ())
    }

    pub fn create_wallet(
        &self,
        wallet_name: &str,
        disable_private_keys: Option<bool>,
        blank: Option<bool>,
        passphrase: Option<&str>,
        avoid_reuse: Option<bool>,
    ) -> Result<(), bitcoincore_rpc::Error> {
        let client = Client::new(self.base_url.as_str(), self.auth.clone())?;
        client
            .create_wallet(
                wallet_name,
                disable_private_keys,
                blank,
                passphrase,
                avoid_reuse,
            )
            .map(|_| ())
    }
}

pub fn initialize_rpc_client() -> Arc<RpcClientData> {
    let rpc_url = env::var("RPC_URL").expect("RPC_URL must be set in .env");
    let rpc_user = env::var("RPC_USER").expect("RPC_USER must be set in .env");
    let rpc_password = env::var("RPC_PASSWORD").expect("RPC_PASSWORD must be set in .env");

    let base_url = Url::parse(&rpc_url).expect("Invalid RPC_URL format");
    let auth = Auth::UserPass(rpc_user, rpc_password);

    info!("RPC_URL: {}", base_url);
    info!(
        "RPC_USER: {}",
        match &auth {
            Auth::UserPass(user, _) => user,
            _ => "Anonymous",
        }
    );

    let rpc_data = RpcClientData::new(base_url, auth);
    Arc::new(rpc_data)
}
