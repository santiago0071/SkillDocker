use super::*;
use ed25519_dalek::{Signer, SigningKey};

fn signing_key() -> SigningKey {
    SigningKey::from_bytes(&[7u8; 32])
}

fn make_key(sk: &SigningKey, payload: &serde_json::Value) -> String {
    let bytes = serde_json::to_vec(payload).unwrap();
    let sig = sk.sign(&bytes);
    format!(
        "{}.{}",
        URL_SAFE_NO_PAD.encode(&bytes),
        URL_SAFE_NO_PAD.encode(sig.to_bytes())
    )
}

fn payload(expires: Option<&str>, updates: Option<&str>) -> serde_json::Value {
    serde_json::json!({
        "licenseId": "lic-1",
        "email": "a@b.c",
        "tier": "pro",
        "features": ["proGuardPacks", "cloudSync"],
        "issuedAt": "2026-01-01T00:00:00.000Z",
        "expiresAt": expires,
        "updatesUntil": updates,
    })
}

fn t(s: &str) -> DateTime<Utc> {
    parse_time(s, "t").unwrap()
}

#[test]
fn embedded_public_key_parses() {
    public_key().unwrap();
}

/// Signed by scripts/license-tool.mjs with the real issuer key, but already expired, so it
/// proves Node↔Rust format compatibility without being a usable license.
/// Regenerate after rotating the keypair:
/// `node scripts/license-tool.mjs sign --email fixture@example.com --id fixture-expired --expires 2026-01-02 --updates-until 2026-01-02`
const NODE_SIGNED_EXPIRED_FIXTURE: &str = "eyJsaWNlbnNlSWQiOiJmaXh0dXJlLWV4cGlyZWQiLCJlbWFpbCI6ImZpeHR1cmVAZXhhbXBsZS5jb20iLCJ0aWVyIjoicHJvIiwiZmVhdHVyZXMiOlsicHJvR3VhcmRQYWNrcyIsImNsb3VkU3luYyIsImluamVjdG9ySGlzdG9yeSIsImF1dG9TeW5jV2F0Y2giXSwiaXNzdWVkQXQiOiIyMDI2LTEwLTA4VDE0OjUzOjE5LjI3N1oiLCJleHBpcmVzQXQiOiIyMDI2LTAxLTAyVDAwOjAwOjAwLjAwMFoiLCJ1cGRhdGVzVW50aWwiOiIyMDI2LTAxLTAyVDAwOjAwOjAwLjAwMFoifQ.SokVQKDhYAZJIm2zK-lHvY6De1blRr_JfIgYWkGP_5rZJ0aEOuhZwdSa-lrp8GoUQ2ueBPfa6vT2SnxQAsjIBQ";

#[test]
fn node_signed_fixture_verifies_against_embedded_key() {
    let vk = public_key().unwrap();
    let payload = verify_signature(NODE_SIGNED_EXPIRED_FIXTURE, &vk).unwrap();
    assert_eq!(payload.license_id, "fixture-expired");
    let st = evaluate(NODE_SIGNED_EXPIRED_FIXTURE, &vk, Utc::now(), build_time());
    assert!(!st.active);
    assert_eq!(st.state, "expired");
}

/// Manual check of a real issued key against the embedded public key:
/// `SKILLDOCKER_TEST_LICENSE=<key> cargo test --lib -- --ignored license_from_env`
#[test]
#[ignore]
fn license_from_env() {
    let key = std::env::var("SKILLDOCKER_TEST_LICENSE").expect("set SKILLDOCKER_TEST_LICENSE");
    let st = evaluate(&key, &public_key().unwrap(), Utc::now(), build_time());
    assert!(st.active, "{:?} {:?}", st.state, st.message);
    assert!(!st.dev);
}

#[test]
fn accepts_valid_signed_license() {
    let sk = signing_key();
    let key = make_key(&sk, &payload(None, Some("2027-01-01T00:00:00Z")));
    let st = evaluate(
        &key,
        &sk.verifying_key(),
        t("2026-06-01T00:00:00Z"),
        t("2026-06-01T00:00:00Z"),
    );
    assert!(st.active, "{:?}", st.message);
    assert_eq!(st.state, "valid");
    assert_eq!(
        st.payload.unwrap().features,
        vec!["proGuardPacks", "cloudSync"]
    );
}

#[test]
fn rejects_tampered_payload() {
    let sk = signing_key();
    let key = make_key(&sk, &payload(None, None));
    let (_, sig) = key.split_once('.').unwrap();
    let mut forged = payload(None, None);
    forged["tier"] = "enterprise".into();
    let forged_key = format!(
        "{}.{}",
        URL_SAFE_NO_PAD.encode(serde_json::to_vec(&forged).unwrap()),
        sig
    );
    let st = evaluate(&forged_key, &sk.verifying_key(), Utc::now(), Utc::now());
    assert!(!st.active);
    assert_eq!(st.state, "invalid");
}

#[test]
fn rejects_wrong_signer_and_unsigned_keys() {
    let sk = signing_key();
    let other = SigningKey::from_bytes(&[9u8; 32]);
    let key = make_key(&other, &payload(None, None));
    assert!(!evaluate(&key, &sk.verifying_key(), Utc::now(), Utc::now()).active);

    let unsigned = URL_SAFE_NO_PAD.encode(serde_json::to_vec(&payload(None, None)).unwrap());
    assert!(!evaluate(&unsigned, &sk.verifying_key(), Utc::now(), Utc::now()).active);
    assert!(
        !evaluate(
            "SKILLDOCK-PRO-anything",
            &sk.verifying_key(),
            Utc::now(),
            Utc::now()
        )
        .active
    );
    assert!(!evaluate("", &sk.verifying_key(), Utc::now(), Utc::now()).active);
}

#[test]
fn expired_and_update_window() {
    let sk = signing_key();
    let vk = sk.verifying_key();
    let expired = make_key(&sk, &payload(Some("2026-02-01T00:00:00Z"), None));
    assert_eq!(
        evaluate(
            &expired,
            &vk,
            t("2026-03-01T00:00:00Z"),
            t("2026-01-15T00:00:00Z")
        )
        .state,
        "expired"
    );

    let updates = make_key(&sk, &payload(None, Some("2026-02-01T00:00:00Z")));
    // Old build released inside the window keeps working forever.
    assert!(
        evaluate(
            &updates,
            &vk,
            t("2030-01-01T00:00:00Z"),
            t("2026-01-15T00:00:00Z")
        )
        .active
    );
    // A build released after the window does not unlock.
    assert_eq!(
        evaluate(
            &updates,
            &vk,
            t("2026-03-01T00:00:00Z"),
            t("2026-03-01T00:00:00Z")
        )
        .state,
        "updates_expired"
    );
}

#[test]
fn stored_file_is_reverified() {
    let sk = signing_key();
    let vk = sk.verifying_key();
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join(LICENSE_FILE);
    assert_eq!(read_status_from(&path, &vk).state, "none");
    fs::write(&path, "garbage.garbage").unwrap();
    assert!(!read_status_from(&path, &vk).active);
    fs::write(&path, make_key(&sk, &payload(None, None))).unwrap();
    assert!(read_status_from(&path, &vk).active);
}

#[test]
fn test_open_browser_rejects_non_https() {
    assert!(open_browser_url("http://example.com").is_err());
    assert!(open_browser_url("file:///etc/passwd").is_err());
    assert!(open_browser_url("javascript:alert(1)").is_err());
    assert!(open_browser_url("https://www.skilldocker.com/buy|calc").is_err());
}

#[test]
fn test_validate_checkout_url_strict_security() {
    // 1. Rejects dangerous injection characters
    assert!(validate_checkout_url("https://www.skilldocker.com/buy?a=1&b=2").is_err());
    assert!(validate_checkout_url("https://www.skilldocker.com/buy|whoami").is_err());
    assert!(validate_checkout_url("https://www.skilldocker.com/buy%20cmd").is_err());
    assert!(validate_checkout_url("https://www.skilldocker.com/buy^whoami").is_err());

    // 2. Rejects whitespace, quotes, newlines
    assert!(validate_checkout_url("https://www.skilldocker.com/buy test").is_err());
    assert!(validate_checkout_url("https://www.skilldocker.com/buy\ttest").is_err());
    assert!(validate_checkout_url("https://www.skilldocker.com/buy\ntest").is_err());
    assert!(validate_checkout_url("https://www.skilldocker.com/buy\rtest").is_err());
    assert!(validate_checkout_url("https://www.skilldocker.com/\"buy\"").is_err());
    assert!(validate_checkout_url("https://www.skilldocker.com/'buy'").is_err());

    // 3. Rejects non-https schemes
    assert!(validate_checkout_url("http://www.skilldocker.com/buy").is_err());
    assert!(validate_checkout_url("file:///etc/passwd").is_err());
    assert!(validate_checkout_url("javascript:alert(1)").is_err());
    assert!(validate_checkout_url("data:text/html,<h1>hi</h1>").is_err());

    // 4. Rejects hosts not in whitelist (including old placeholder domains)
    assert!(validate_checkout_url("https://evil.com/buy").is_err());
    assert!(validate_checkout_url("https://example.com/buy").is_err());
    assert!(validate_checkout_url("https://sub.skilldocker.com/buy").is_err());
    assert!(validate_checkout_url("https://skilldocker.example/buy").is_err());
    assert!(validate_checkout_url("https://skilldocker.app/pricing").is_err());

    // 5. Rejects userinfo spoofing attempts
    assert!(validate_checkout_url("https://www.skilldocker.com@evil.com/buy").is_err());
    assert!(validate_checkout_url("https://user:pass@www.skilldocker.com/buy").is_err());
    assert!(validate_checkout_url("https://attacker@www.skilldocker.com/buy").is_err());

    // 6. Accepts valid whitelisted URLs
    assert!(validate_checkout_url("https://www.skilldocker.com/buy").is_ok());
    assert_eq!(
        validate_checkout_url(CHECKOUT_URL).unwrap().as_str(),
        "https://www.skilldocker.com/buy"
    );
}

#[test]
fn test_dev_status_evaluation() {
    let vk = public_key().unwrap();
    let st = evaluate("PRO-DEV-local-tester", &vk, Utc::now(), build_time());
    assert!(st.active);
    assert!(st.dev);
    assert_eq!(st.state, "valid");
    assert_eq!(st.payload.unwrap().tier, "pro");
}

#[test]
fn test_malformed_key_handling() {
    let vk = public_key().unwrap();
    assert_eq!(
        evaluate("no-dots-in-key", &vk, Utc::now(), build_time()).state,
        "invalid"
    );
    assert_eq!(
        evaluate("a.b.c.d", &vk, Utc::now(), build_time()).state,
        "invalid"
    );
    assert_eq!(
        evaluate("bad_b64.bad_b64", &vk, Utc::now(), build_time()).state,
        "invalid"
    );

    let long_key = "a".repeat(9000);
    assert_eq!(
        evaluate(&long_key, &vk, Utc::now(), build_time()).state,
        "invalid"
    );
}

#[test]
fn test_unknown_tier_rejection() {
    let sk = signing_key();
    let mut bad_payload = payload(None, None);
    bad_payload["tier"] = "megapro".into();
    let key = make_key(&sk, &bad_payload);
    let st = evaluate(&key, &sk.verifying_key(), Utc::now(), build_time());
    assert!(!st.active);
    assert_eq!(st.state, "invalid");
}

#[test]
fn test_malformed_dates_in_payload() {
    let sk = signing_key();
    let bad_exp = payload(Some("not-a-date"), None);
    let key1 = make_key(&sk, &bad_exp);
    let st1 = evaluate(&key1, &sk.verifying_key(), Utc::now(), build_time());
    assert_eq!(st1.state, "invalid");

    let bad_upt = payload(None, Some("invalid-update-date"));
    let key2 = make_key(&sk, &bad_upt);
    let st2 = evaluate(&key2, &sk.verifying_key(), Utc::now(), build_time());
    assert_eq!(st2.state, "invalid");
}

#[test]
fn test_activate_and_deactivate_license_file() {
    let sk = signing_key();
    let temp = tempfile::tempdir().unwrap();
    let lic_file = temp.path().join("sub").join(LICENSE_FILE);

    // 1. Activate invalid key -> fails
    assert!(activate_license_file_with_key(&lic_file, "garbage", &sk.verifying_key()).is_err());
    assert!(!lic_file.exists());

    // 2. Activate valid key with future expires_at and updates_until -> succeeds
    let key = make_key(
        &sk,
        &payload(Some("2099-01-01T00:00:00Z"), Some("2099-01-01T00:00:00Z")),
    );
    let st = activate_license_file_with_key(&lic_file, &key, &sk.verifying_key()).unwrap();
    assert!(st.active);
    assert_eq!(st.state, "valid");
    assert!(lic_file.exists());
    assert_eq!(fs::read_to_string(&lic_file).unwrap(), key);

    // 3. Activate developer key via activate_license_file (debug build)
    let dev_lic = temp.path().join("dev").join(LICENSE_FILE);
    let dev_st = activate_license_file(&dev_lic, "PRO-DEV-test-device").unwrap();
    assert!(dev_st.active);
    assert!(dev_st.dev);
    assert!(dev_lic.exists());

    // 4. Deactivate -> removes file
    assert!(deactivate_license_file(&lic_file).is_ok());
    assert!(!lic_file.exists());

    // 5. Deactivate already non-existent file -> Ok
    assert!(deactivate_license_file(&lic_file).is_ok());
}

#[test]
fn test_validate_and_open_url_launcher() {
    let mut launched = false;
    let res = validate_and_open_url("https://www.skilldocker.com/buy", |_| {
        launched = true;
        Ok(())
    });
    assert!(res.is_ok());
    assert!(launched);

    let res_err = validate_and_open_url("http://insecure.org", |_| Ok(()));
    assert!(res_err.is_err());
}

#[test]
fn test_command_runners_with_logging() {
    let temp = tempfile::tempdir().unwrap();
    let lic_file = temp.path().join("runner").join(LICENSE_FILE);

    // Initial status -> none
    let st0 = get_license_status_path(&lic_file).unwrap();
    assert_eq!(st0.state, "none");

    // Activate invalid -> error and logged
    assert!(activate_license_path(&lic_file, "invalid-key").is_err());

    // Activate dev -> ok and logged
    let st1 = activate_license_path(&lic_file, "PRO-DEV-cmd-runner").unwrap();
    assert!(st1.active);
    assert_eq!(st1.state, "valid");

    // Status now -> valid
    let st2 = get_license_status_path(&lic_file).unwrap();
    assert!(st2.active);

    // Deactivate -> ok and logged
    assert!(deactivate_license_path(&lic_file).is_ok());
    let st3 = get_license_status_path(&lic_file).unwrap();
    assert_eq!(st3.state, "none");

    // Open checkout URL with launcher -> ok and err paths logged
    assert!(open_checkout_url_with_launcher(|_| Ok(())).is_ok());
    assert!(open_checkout_url_with_launcher(|_| Err("launch failed".to_string())).is_err());
}
