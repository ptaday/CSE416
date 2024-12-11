use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use bitcoincore_rpc::Client;
use std::sync::Arc;

use crate::endpoints::wallet;

pub async fn run_http_server(rpc_client: Arc<Client>) -> std::io::Result<()> {
    let rpc_data = web::Data::new(rpc_client);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .wrap(cors)
            .app_data(rpc_data.clone())
            // Register wallet-related endpoint
            .service(wallet::register_wallet)
    })
    .bind(("127.0.0.1", 3001))?
    .run()
    .await
}
