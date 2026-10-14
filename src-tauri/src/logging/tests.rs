use super::*;
use tempfile::tempdir;

#[test]
fn test_log_rotation_keeps_max_7_days() {
    let temp = tempdir().unwrap();
    let log_dir = temp.path().join("logs");
    fs::create_dir_all(&log_dir).unwrap();

    // Create 10 mock log files
    for i in 1..=10 {
        let filename = format!("skilldocker-2026-10-{:02}.log", i);
        fs::write(log_dir.join(filename), format!("log content day {}", i)).unwrap();
    }

    assert_eq!(fs::read_dir(&log_dir).unwrap().count(), 10);

    rotate_logs_internal(&log_dir, 7).unwrap();

    let remaining: Vec<String> = fs::read_dir(&log_dir)
        .unwrap()
        .flatten()
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect();

    assert_eq!(remaining.len(), 7);
    // The first 3 (01, 02, 03) must be deleted
    assert!(!remaining.contains(&"skilldocker-2026-10-01.log".to_string()));
    assert!(!remaining.contains(&"skilldocker-2026-10-02.log".to_string()));
    assert!(!remaining.contains(&"skilldocker-2026-10-03.log".to_string()));
    // The latest 7 (04 to 10) must be kept
    assert!(remaining.contains(&"skilldocker-2026-10-04.log".to_string()));
    assert!(remaining.contains(&"skilldocker-2026-10-10.log".to_string()));
}

#[test]
fn test_log_sanitization_removes_api_keys() {
    let temp = tempdir().unwrap();
    let log_dir = temp.path().join("logs");

    let gemini_key = "AIzaSyD-1234567890abcdefghijklmnopqrstuv";
    let claude_key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz12345";
    let openai_key = "sk-proj-1234567890abcdef1234567890";

    let raw_msg = format!(
        "Failed call with key {} and claude {} and openai {}",
        gemini_key, claude_key, openai_key
    );

    append_log_internal(&log_dir, "ERROR", "TEST", &raw_msg).unwrap();

    let (date_str, _) = get_current_datetime();
    let log_file = log_dir.join(format!("skilldocker-{}.log", date_str));
    let content = fs::read_to_string(log_file).unwrap();

    assert!(
        !content.contains(gemini_key),
        "Gemini key must not be logged"
    );
    assert!(
        !content.contains(claude_key),
        "Claude key must not be logged"
    );
    assert!(
        !content.contains(openai_key),
        "OpenAI key must not be logged"
    );
    assert!(content.contains("[REDACTED]"));
}

#[test]
fn test_regex_key_sanitization_comprehensive() {
    // 1. JSON format keys
    let json_input = r#"{"apiKey":"secret_api_key_12345","token":"super_jwt_tok","nested":{"password":"mysecretpwd"}}"#;
    let json_sanitized = sanitize_log_message(json_input);
    assert!(!json_sanitized.contains("secret_api_key_12345"));
    assert!(!json_sanitized.contains("super_jwt_tok"));
    assert!(!json_sanitized.contains("mysecretpwd"));
    assert!(json_sanitized.contains(r#""apiKey":"[REDACTED]""#));
    assert!(json_sanitized.contains(r#""token":"[REDACTED]""#));
    assert!(json_sanitized.contains(r#""password":"[REDACTED]""#));

    // 2. URL parameter format keys
    let url_input = "https://api.example.com/v1/query?key=AIzaSyA1234567890123456789012345678901&token=sec_token_999&auth=ok";
    let url_sanitized = sanitize_log_message(url_input);
    assert!(!url_sanitized.contains("AIzaSyA1234567890123456789012345678901"));
    assert!(!url_sanitized.contains("sec_token_999"));
    assert!(url_sanitized.contains("?key=[REDACTED]"));
    assert!(url_sanitized.contains("&token=[REDACTED]"));

    // 3. Multiple Bearers on the same line
    let bearer_input =
        "Request with Bearer token_one_123456 failed, retried with Bearer token_two_789012";
    let bearer_sanitized = sanitize_log_message(bearer_input);
    assert!(!bearer_sanitized.contains("token_one_123456"));
    assert!(!bearer_sanitized.contains("token_two_789012"));
    assert_eq!(
        bearer_sanitized,
        "Request with Bearer [REDACTED] failed, retried with Bearer [REDACTED]"
    );

    // 4. JWT format token (eyJ...)
    let jwt_input = "User JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c verified";
    let jwt_sanitized = sanitize_log_message(jwt_input);
    assert!(!jwt_sanitized.contains("eyJhbGciOiJIUzI1Ni"));
    assert_eq!(jwt_sanitized, "User JWT: [REDACTED] verified");
}

#[test]
fn test_frontend_error_truncation_8kb() {
    let temp = tempdir().unwrap();
    let log_dir = temp.path().join("logs");

    // Oversized message (12KB) and stack (10KB)
    let huge_msg = "M".repeat(12 * 1024);
    let huge_stack = "S".repeat(10 * 1024);

    log_frontend_error_internal(&log_dir, huge_msg, Some(huge_stack)).unwrap();

    let (date_str, _) = get_current_datetime();
    let file_path = log_dir.join(format!("skilldocker-{}.log", date_str));
    let content = fs::read_to_string(&file_path).unwrap();

    // Must not contain more than 8192 repeated characters
    assert!(!content.contains(&"M".repeat(8193)));
    assert!(!content.contains(&"S".repeat(8193)));

    // Must contain 8192-byte chunks
    assert!(content.contains(&"M".repeat(8192)));
    assert!(content.contains(&"S".repeat(8192)));
}

#[test]
fn test_log_file_5mb_limit_stops_writing() {
    let temp = tempdir().unwrap();
    let log_dir = temp.path().join("logs");
    fs::create_dir_all(&log_dir).unwrap();

    let (date_str, _) = get_current_datetime();
    let file_path = log_dir.join(format!("skilldocker-{}.log", date_str));

    // Pre-fill file to 5MB (MAX_LOG_FILE_BYTES)
    let initial_5mb = vec![b'X'; MAX_LOG_FILE_BYTES as usize];
    fs::write(&file_path, &initial_5mb).unwrap();

    // 1. Next write should hit 5MB limit and append the notice line
    append_log_internal(&log_dir, "INFO", "APP", "payload_dropped_1").unwrap();

    let content = fs::read(&file_path).unwrap();
    assert!(!content
        .windows(b"payload_dropped_1".len())
        .any(|w| w == b"payload_dropped_1"));

    let notice = "日志已达上限";
    let notice_count = content
        .windows(notice.as_bytes().len())
        .filter(|w| *w == notice.as_bytes())
        .count();
    assert_eq!(notice_count, 1, "Exactly one limit notice must be appended");

    // 2. Subsequent write should be completely ignored (no second notice, no payload)
    append_log_internal(&log_dir, "INFO", "APP", "payload_dropped_2").unwrap();

    let content_after = fs::read(&file_path).unwrap();
    assert_eq!(
        content.len(),
        content_after.len(),
        "File size must not grow after limit reached"
    );
}

#[test]
fn test_authorization_and_bearer_leak_prevention() {
    let cases = [
        ("Authorization: Bearer tok_AAAA1111bbbb", "tok_AAAA1111bbbb"),
        ("authorization: Basic dXNlcjpwYXNz", "dXNlcjpwYXNz"),
        (
            "Proxy-Authorization: Bearer proxy_tok_9988",
            "proxy_tok_9988",
        ),
        (
            r#"{"Authorization":"Bearer json_tok_7766"}"#,
            "json_tok_7766",
        ),
        (r#"{"authorization": "Basic dXNlcjpwYXNz"}"#, "dXNlcjpwYXNz"),
    ];
    for (input, token) in cases {
        let sanitized = sanitize_log_message(input);
        assert!(
            !sanitized.contains(token),
            "Input '{}' leaked token '{}'",
            input,
            token
        );
        assert!(sanitized.contains("[REDACTED]"));
    }
}

#[test]
fn test_diagnostic_bundle_and_helpers() {
    let temp = tempdir().unwrap();
    let log_dir = temp.path().join("logs");
    fs::create_dir_all(&log_dir).unwrap();
    fs::write(
        log_dir.join("skilldocker-2026-10-10.log"),
        "sample log line\n",
    )
    .unwrap();

    // 1. Diagnostic bundle
    let bundle =
        build_diagnostic_bundle_internal(&log_dir, "2026-10-10 12:00:00", "0.1.0").unwrap();
    assert!(bundle.contains("sample log line"));
    assert!(bundle.contains("App Version: 0.1.0"));
    assert!(build_diagnostic_bundle_internal(&temp.path().join("missing"), "", "").is_err());

    // 2. Epoch conversion
    let (y, m, d, hh, mm, ss) = epoch_secs_to_datetime(0);
    assert_eq!((y, m, d, hh, mm, ss), (1970, 1, 1, 0, 0, 0));

    // 3. Frontend error without stack
    log_frontend_error_internal(&log_dir, "no_stack_err".into(), None).unwrap();
    let content = fs::read_to_string(log_dir.join("skilldocker-2026-10-10.log")).unwrap();
    assert!(content.contains("sample log line"));

    // 4. Wrapper functions coverage
    log_app_startup("0.1.0");
    log_command("unit_test_cmd", true, Some("ok"));
    log_command("unit_test_cmd_fail", false, None);
    let _ = log_frontend_error("fe_test_msg".into(), Some("fe_test_stack".into()));
    let _ = open_log_directory();
}

#[test]
fn test_compound_key_sanitization_and_token_metric_preservation() {
    // 1. JSON compound key redaction
    let json_compound = r#"{"access_token":"at_sec_111","refresh_token":"rt_sec_222","id_token":"id_sec_333","client_secret":"cs_sec_444","user_password":"pwd_sec_555","admin_passwd":"pwd_sec_666","api_key":"ak_sec_777","my_api_key":"ak_sec_888","app_secret":"app_sec_999"}"#;
    let json_clean = sanitize_log_message(json_compound);
    assert!(!json_clean.contains("at_sec_111"));
    assert!(!json_clean.contains("rt_sec_222"));
    assert!(!json_clean.contains("id_sec_333"));
    assert!(!json_clean.contains("cs_sec_444"));
    assert!(!json_clean.contains("pwd_sec_555"));
    assert!(!json_clean.contains("pwd_sec_666"));
    assert!(!json_clean.contains("ak_sec_777"));
    assert!(!json_clean.contains("ak_sec_888"));
    assert!(!json_clean.contains("app_sec_999"));
    assert!(json_clean.contains(r#""access_token":"[REDACTED]""#));
    assert!(json_clean.contains(r#""refresh_token":"[REDACTED]""#));
    assert!(json_clean.contains(r#""id_token":"[REDACTED]""#));
    assert!(json_clean.contains(r#""client_secret":"[REDACTED]""#));
    assert!(json_clean.contains(r#""user_password":"[REDACTED]""#));
    assert!(json_clean.contains(r#""admin_passwd":"[REDACTED]""#));
    assert!(json_clean.contains(r#""api_key":"[REDACTED]""#));
    assert!(json_clean.contains(r#""my_api_key":"[REDACTED]""#));
    assert!(json_clean.contains(r#""app_secret":"[REDACTED]""#));

    // 2. URL parameter compound key redaction
    let url_compound = "https://auth.internal/oauth/v2?access_token=at_url_111&refresh_token=rt_url_222&client_secret=cs_url_333&id_token=id_url_444&user_password=pwd_url_555&admin_passwd=pwd_url_666&api_key=ak_url_777";
    let url_clean = sanitize_log_message(url_compound);
    assert!(!url_clean.contains("at_url_111"));
    assert!(!url_clean.contains("rt_url_222"));
    assert!(!url_clean.contains("cs_url_333"));
    assert!(!url_clean.contains("id_url_444"));
    assert!(!url_clean.contains("pwd_url_555"));
    assert!(!url_clean.contains("pwd_url_666"));
    assert!(!url_clean.contains("ak_url_777"));
    assert!(url_clean.contains("?access_token=[REDACTED]"));
    assert!(url_clean.contains("&refresh_token=[REDACTED]"));
    assert!(url_clean.contains("&client_secret=[REDACTED]"));
    assert!(url_clean.contains("&id_token=[REDACTED]"));
    assert!(url_clean.contains("&user_password=[REDACTED]"));
    assert!(url_clean.contains("&admin_passwd=[REDACTED]"));
    assert!(url_clean.contains("&api_key=[REDACTED]"));

    // 3. Defend against false positives: tokens count metrics MUST remain untouched
    let metrics_text = "Generation complete. tokens: 1822, max_tokens: 4096, prompt_tokens: 120, completion_tokens: 1702";
    let metrics_clean = sanitize_log_message(metrics_text);
    assert!(
        metrics_clean.contains("tokens: 1822"),
        "'tokens: 1822' must NOT be redacted"
    );
    assert!(
        metrics_clean.contains("max_tokens: 4096"),
        "'max_tokens: 4096' must NOT be redacted"
    );
    assert_eq!(metrics_clean, metrics_text);

    // 4. JSON format token metrics MUST also remain untouched
    let json_metrics = r#"{"tokens": 1822, "max_tokens": 4096, "status": "ok"}"#;
    let json_metrics_clean = sanitize_log_message(json_metrics);
    assert!(
        json_metrics_clean.contains(r#""tokens": 1822"#),
        "JSON 'tokens' must NOT be redacted"
    );
    assert!(
        json_metrics_clean.contains(r#""max_tokens": 4096"#),
        "JSON 'max_tokens' must NOT be redacted"
    );
}

#[test]
fn test_license_key_sanitization() {
    let cases = [
        (
            r#"{"licenseKey":"pro_lic_12345678"}"#,
            "pro_lic_12345678",
            r#"{"licenseKey":"[REDACTED]"}"#,
        ),
        (
            r#"{"license_key":"sec_lic_abcdef"}"#,
            "sec_lic_abcdef",
            r#"{"license_key":"[REDACTED]"}"#,
        ),
        (
            r#"{"license-key":"sec_lic_999888"}"#,
            "sec_lic_999888",
            r#"{"license-key":"[REDACTED]"}"#,
        ),
        (
            "https://api.example.com/verify?licenseKey=url_lic_111222&other=ok",
            "url_lic_111222",
            "https://api.example.com/verify?licenseKey=[REDACTED]&other=ok",
        ),
        (
            "https://api.example.com/verify?license_key=url_lic_333444",
            "url_lic_333444",
            "https://api.example.com/verify?license_key=[REDACTED]",
        ),
    ];
    for (input, secret, expected) in cases {
        let sanitized = sanitize_log_message(input);
        assert!(!sanitized.contains(secret), "Leaked secret '{}'", secret);
        assert_eq!(sanitized, expected);
    }

    // Open-source license name should remain untouched
    let oss_license = r#"{"name": "test-pkg", "license": "MIT"}"#;
    assert_eq!(sanitize_log_message(oss_license), oss_license);
}
