const KEYRING_SERVICE: &str = "skilldocker";

#[tauri::command]
pub fn set_api_key(provider: String, key: String) -> Result<(), String> {
    let res = (|| {
        let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
            .map_err(|e| format!("Keyring init error: {}", e))?;
        entry
            .set_password(&key)
            .map_err(|e| format!("Failed to store key in system keyring: {}", e))
    })();
    crate::logging::log_command(
        "set_api_key",
        res.is_ok(),
        Some(&format!("provider: {}", provider)),
    );
    res
}

#[tauri::command]
pub fn has_api_key(provider: String) -> Result<bool, String> {
    let res = (|| {
        let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
            .map_err(|e| format!("Keyring init error: {}", e))?;
        match entry.get_password() {
            Ok(k) => Ok(!k.trim().is_empty()),
            Err(_) => Ok(false),
        }
    })();
    crate::logging::log_command(
        "has_api_key",
        res.is_ok(),
        Some(&format!("provider: {}", provider)),
    );
    res
}

#[tauri::command]
pub fn delete_api_key(provider: String) -> Result<(), String> {
    let res = (|| {
        let entry = keyring::Entry::new(KEYRING_SERVICE, &provider)
            .map_err(|e| format!("Keyring init error: {}", e))?;
        let _ = entry.delete_credential();
        Ok(())
    })();
    crate::logging::log_command(
        "delete_api_key",
        res.is_ok(),
        Some(&format!("provider: {}", provider)),
    );
    res
}

pub fn get_internal_api_key(provider: &str) -> Result<String, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, provider)
        .map_err(|e| format!("Keyring init error: {}", e))?;
    entry.get_password().map_err(|_| {
        format!(
            "未在系统钥匙串中找到 {} 的 API Key，请先在设置中填写",
            provider
        )
    })
}

pub fn resolve_provider_endpoint(
    provider: &str,
    model: &str,
    base_url: Option<&str>,
) -> Result<String, String> {
    match provider {
        "claude" => Ok("https://api.anthropic.com/v1/messages".to_string()),
        "gemini" => Ok(format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
            model
        )),
        "openai" => Ok("https://api.openai.com/v1/chat/completions".to_string()),
        "deepseek" => Ok("https://api.deepseek.com/v1/chat/completions".to_string()),
        "openrouter" => Ok("https://openrouter.ai/api/v1/chat/completions".to_string()),
        "minimax" => Ok("https://api.minimaxi.com/v1/chat/completions".to_string()),
        "custom" => {
            let base = base_url
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .unwrap_or("http://localhost:11434/v1")
                .trim_end_matches('/');
            Ok(format!("{}/chat/completions", base))
        }
        _ => Err(format!("Unsupported AI provider: {}", provider)),
    }
}

/// Sanitize AI error string by exact replacement of used key and general regex redaction
pub fn sanitize_ai_error(err_msg: &str, key: &str) -> String {
    let trimmed_key = key.trim();
    let mut sanitized = err_msg.to_string();
    if !trimmed_key.is_empty() {
        sanitized = sanitized.replace(trimmed_key, "[REDACTED]");
    }
    crate::logging::sanitize_log_message(&sanitized)
}

#[tauri::command]
pub async fn ai_generate(
    provider: String,
    model: Option<String>,
    system_prompt: Option<String>,
    prompt: String,
    base_url: Option<String>,
) -> Result<String, String> {
    let start = std::time::Instant::now();
    let client = reqwest::Client::new();
    let model_tag = model.clone().unwrap_or_else(|| match provider.as_str() {
        "claude" => "claude-sonnet-5-5".to_string(),
        "gemini" => "gemini-3.8-flash".to_string(),
        _ => "gpt-6.1-sol".to_string(),
    });

    let res = match provider.as_str() {
        "claude" => {
            let key = get_internal_api_key("claude").map_err(|e| sanitize_ai_error(&e, ""))?;
            let model_name = model.unwrap_or_else(|| "claude-sonnet-5-5".to_string());
            let url = resolve_provider_endpoint("claude", &model_name, None)
                .map_err(|e| sanitize_ai_error(&e, &key))?;

            let mut body = serde_json::json!({
                "model": model_name,
                "max_tokens": 4096,
                "messages": [{
                    "role": "user",
                    "content": prompt
                }]
            });
            if let Some(sys) = system_prompt {
                body["system"] = serde_json::json!(sys);
            }

            let res = client
                .post(&url)
                .header("Content-Type", "application/json")
                .header("x-api-key", &key)
                .header("anthropic-version", "2023-06-01")
                .json(&body)
                .send()
                .await
                .map_err(|e| sanitize_ai_error(&format!("Claude request error: {}", e), &key))?;

            let res_json: serde_json::Value = res
                .json()
                .await
                .map_err(|e| sanitize_ai_error(&format!("Claude JSON parse error: {}", e), &key))?;

            if let Some(err_obj) = res_json.get("error") {
                let msg = err_obj
                    .get("message")
                    .and_then(|m| m.as_str())
                    .unwrap_or("Claude API error");
                return Err(sanitize_ai_error(
                    &format!("Claude API Error: {}", msg),
                    &key,
                ));
            }

            if let Some(content) = res_json.get("content").and_then(|c| c.as_array()) {
                if let Some(first_block) = content.first() {
                    if let Some(text) = first_block.get("text").and_then(|t| t.as_str()) {
                        return Ok(text.to_string());
                    }
                }
            }
            Err(sanitize_ai_error("Claude returned empty response", &key))
        }
        "gemini" => {
            let key = get_internal_api_key("gemini").map_err(|e| sanitize_ai_error(&e, ""))?;
            let model_name = model.unwrap_or_else(|| "gemini-3.8-flash".to_string());
            let url = resolve_provider_endpoint("gemini", &model_name, None)
                .map_err(|e| sanitize_ai_error(&e, &key))?;

            let mut body = serde_json::json!({
                "contents": [{
                    "parts": [{ "text": prompt }]
                }]
            });
            if let Some(sys) = system_prompt {
                body["systemInstruction"] = serde_json::json!({
                    "parts": [{ "text": sys }]
                });
            }

            let res = client
                .post(&url)
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", &key)
                .json(&body)
                .send()
                .await
                .map_err(|e| sanitize_ai_error(&format!("Gemini request error: {}", e), &key))?;

            let res_json: serde_json::Value = res
                .json()
                .await
                .map_err(|e| sanitize_ai_error(&format!("Gemini JSON parse error: {}", e), &key))?;

            if let Some(err_obj) = res_json.get("error") {
                let msg = err_obj
                    .get("message")
                    .and_then(|m| m.as_str())
                    .unwrap_or("Gemini API error");
                return Err(sanitize_ai_error(
                    &format!("Gemini API Error: {}", msg),
                    &key,
                ));
            }

            if let Some(candidates) = res_json.get("candidates").and_then(|c| c.as_array()) {
                if let Some(first) = candidates.first() {
                    if let Some(parts) = first
                        .get("content")
                        .and_then(|c| c.get("parts"))
                        .and_then(|p| p.as_array())
                    {
                        if let Some(first_part) = parts.first() {
                            if let Some(text) = first_part.get("text").and_then(|t| t.as_str()) {
                                return Ok(text.to_string());
                            }
                        }
                    }
                }
            }
            Err(sanitize_ai_error("Gemini returned empty response", &key))
        }
        _ => {
            let model_name = model.unwrap_or_else(|| "gpt-6.1-sol".to_string());
            let key = match provider.as_str() {
                "custom" => get_internal_api_key("custom").unwrap_or_default(),
                _ => get_internal_api_key(&provider).map_err(|e| sanitize_ai_error(&e, ""))?,
            };
            let url =
                resolve_provider_endpoint(provider.as_str(), &model_name, base_url.as_deref())
                    .map_err(|e| sanitize_ai_error(&e, &key))?;

            let mut messages = Vec::new();
            if let Some(sys) = system_prompt {
                messages.push(serde_json::json!({ "role": "system", "content": sys }));
            }
            messages.push(serde_json::json!({ "role": "user", "content": prompt }));

            let body = serde_json::json!({
                "model": model_name,
                "messages": messages
            });

            let mut req = client.post(&url).header("Content-Type", "application/json");
            if !key.is_empty() {
                req = req.header("Authorization", format!("Bearer {}", key));
            }

            let res = req.json(&body).send().await.map_err(|e| {
                sanitize_ai_error(&format!("{} request error: {}", provider, e), &key)
            })?;

            let res_json: serde_json::Value = res.json().await.map_err(|e| {
                sanitize_ai_error(&format!("{} JSON parse error: {}", provider, e), &key)
            })?;

            if let Some(err_obj) = res_json.get("error") {
                let msg = err_obj
                    .get("message")
                    .and_then(|m| m.as_str())
                    .unwrap_or("API error");
                return Err(sanitize_ai_error(
                    &format!("{} Error: {}", provider, msg),
                    &key,
                ));
            }

            if let Some(choices) = res_json.get("choices").and_then(|c| c.as_array()) {
                if let Some(first) = choices.first() {
                    if let Some(content) = first
                        .get("message")
                        .and_then(|m| m.get("content"))
                        .and_then(|c| c.as_str())
                    {
                        return Ok(content.to_string());
                    }
                }
            }
            Err(sanitize_ai_error(
                &format!("{} returned empty response", provider),
                &key,
            ))
        }
    };

    let duration_ms = start.elapsed().as_millis();
    crate::logging::log_command(
        "ai_generate",
        res.is_ok(),
        Some(&format!(
            "provider: {}, model: {}, duration: {}ms",
            provider, model_tag, duration_ms
        )),
    );

    res
}

#[cfg(test)]
#[path = "ai/tests.rs"]
mod tests;
