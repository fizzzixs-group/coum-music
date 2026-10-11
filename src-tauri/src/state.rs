//! Общее состояние приложения: текущий авторизованный клиент.

use std::sync::Arc;

use tokio::sync::RwLock;

use crate::ym::YmClient;

#[derive(Default)]
pub struct AppState {
    client: RwLock<Option<Arc<YmClient>>>,
}

impl AppState {
    pub async fn set(&self, client: YmClient) {
        *self.client.write().await = Some(Arc::new(client));
    }

    pub async fn clear(&self) {
        *self.client.write().await = None;
    }

    pub async fn get(&self) -> Option<Arc<YmClient>> {
        self.client.read().await.clone()
    }

    pub async fn require(&self) -> Result<Arc<YmClient>, String> {
        self.get().await.ok_or_else(|| "Нужно войти в аккаунт".to_string())
    }
}
