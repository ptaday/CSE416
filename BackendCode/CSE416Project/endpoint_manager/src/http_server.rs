use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use std::sync::Arc;

use crate::endpoints::wallet;

///the HTTP server.
pub async fn run_http_server(rpc_client_data: Arc<crate::rpc_client::RpcClientData>) -> std::io::Result<()> {
    let rpc_data = web::Data::new(rpc_client_data.clone());

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .wrap(cors)
            .app_data(rpc_data.clone())
            // Register the `/api/register` endpoint
            .service(wallet::register_wallet)
            .service(wallet::get_balance)
            .service(wallet::send_to_address)



    })
    .bind(("127.0.0.1", 3001))?
    .run()
    .await
}
