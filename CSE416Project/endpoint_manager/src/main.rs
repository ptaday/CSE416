mod http_server;
mod rpc_client;
mod endpoints;

use dotenv::dotenv;
use env_logger::init;
use rpc_client::initialize_rpc_client;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    init();

    // Initialize RPC client data
    let rpc_client_data = initialize_rpc_client();

    // Start HTTP server
    http_server::run_http_server(rpc_client_data).await
}
