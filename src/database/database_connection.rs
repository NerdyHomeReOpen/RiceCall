use std::env;
use sqlx::mysql::{MySqlPool, MySqlConnectOptions, MySqlPoolOptions};

pub async fn create_pool() -> Result<MySqlPool, sqlx::Error> {
    let host = env::var("DB_HOST").unwrap_or_else(|_| "localhost".to_string());
    let port = env::var("DB_PORT")
        .unwrap_or_else(|_| "3306".to_string())
        .parse()
        .unwrap_or(3306); // 防止 parse 失敗 panic
    let username = env::var("DB_USER").unwrap_or_else(|_| "root".to_string());
    let password = env::var("DB_PASSWORD").unwrap_or_else(|_| "password".to_string());
    let database = env::var("DB_NAME").unwrap_or_else(|_| "chat_app".to_string());
    
    let conn_opts = MySqlConnectOptions::new()
        .host(&host)
        .port(port)
        .username(&username)
        .password(&password)
        .database(&database)
        .charset("utf8mb4_unicode_ci");
    
    let pool = MySqlPoolOptions::new()
    .max_connections(10)
    .connect_with(conn_opts)
    .await?;
    
    return Ok(pool);
}