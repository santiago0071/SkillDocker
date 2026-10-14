use super::*;

#[test]
fn test_keyring_storage_and_lifecycle() {
    let test_provider = "test_unit_provider";
    let test_key = "sk-ant-unit-test-123456";

    // 1. Set key
    set_api_key(test_provider.to_string(), test_key.to_string()).unwrap();

    // 2. Check key exists
    assert!(has_api_key(test_provider.to_string()).unwrap());

    // 3. Retrieve internal key
    let retrieved = get_internal_api_key(test_provider).unwrap();
    assert_eq!(retrieved, test_key);

    // 4. Delete key
    delete_api_key(test_provider.to_string()).unwrap();

    // 5. Verify deleted
    assert!(!has_api_key(test_provider.to_string()).unwrap());
}

#[test]
fn test_resolve_provider_endpoint_and_gemini_header() {
    // 1. Claude ignores base_url and uses official endpoint
    let claude_ep =
        resolve_provider_endpoint("claude", "claude-3-5-sonnet", Some("http://evil.com")).unwrap();
    assert_eq!(claude_ep, "https://api.anthropic.com/v1/messages");

    // 2. Gemini ignores base_url, uses official endpoint, does NOT leak key into url query
    let gemini_ep =
        resolve_provider_endpoint("gemini", "gemini-3.8-flash", Some("http://evil.com")).unwrap();
    assert_eq!(
        gemini_ep,
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent"
    );
    assert!(!gemini_ep.contains("?key="));

    // 3. Official OpenAI-compatible providers ignore base_url
    let openai_ep = resolve_provider_endpoint("openai", "gpt-4o", Some("http://evil.com")).unwrap();
    assert_eq!(openai_ep, "https://api.openai.com/v1/chat/completions");

    let deepseek_ep =
        resolve_provider_endpoint("deepseek", "deepseek-chat", Some("http://evil.com")).unwrap();
    assert_eq!(deepseek_ep, "https://api.deepseek.com/v1/chat/completions");

    let openrouter_ep =
        resolve_provider_endpoint("openrouter", "auto", Some("http://evil.com")).unwrap();
    assert_eq!(
        openrouter_ep,
        "https://openrouter.ai/api/v1/chat/completions"
    );

    let minimax_ep =
        resolve_provider_endpoint("minimax", "abab6.5s", Some("http://evil.com")).unwrap();
    assert_eq!(minimax_ep, "https://api.minimaxi.com/v1/chat/completions");

    // 4. Custom provider DOES accept base_url
    let custom_ep = resolve_provider_endpoint(
        "custom",
        "llama3",
        Some("https://my-custom-proxy.internal/v1"),
    )
    .unwrap();
    assert_eq!(
        custom_ep,
        "https://my-custom-proxy.internal/v1/chat/completions"
    );

    // 5. Custom provider falls back to default localhost if base_url is None
    let custom_default = resolve_provider_endpoint("custom", "llama3", None).unwrap();
    assert_eq!(custom_default, "http://localhost:11434/v1/chat/completions");
}

#[test]
fn test_sanitize_error_with_unprefixed_custom_key() {
    let custom_key = "my_custom_random_secret_998877665544";
    let raw_error = format!(
        "Connection refused at https://ai-proxy.corp.internal/v1 with key: {} and header Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.c3Vi",
        custom_key
    );

    let sanitized = sanitize_ai_error(&raw_error, custom_key);

    assert!(
        !sanitized.contains(custom_key),
        "Custom unprefixed key must be redacted"
    );
    assert!(
        !sanitized.contains("eyJhbGciOiJIUzI1Ni"),
        "JWT must be redacted"
    );
    assert!(sanitized.contains("with key: [REDACTED] and header Bearer [REDACTED]"));
}
