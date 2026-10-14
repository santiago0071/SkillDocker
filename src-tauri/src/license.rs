//! Ed25519 offline license verification and feature gating for SkillDocker Pro.
//!
//! Keys are issued with `scripts/license-tool.mjs`; only the public key is embedded here.
//! The raw key is persisted in the app data dir and re-verified on every status read,
//! so editing the stored file cannot grant Pro.

use base64::engine::general_purpose::{STANDARD, URL_SAFE_NO_PAD};
use base64::Engine;
use chrono::{DateTime, Utc};
use ed25519_dalek::{Signature, VerifyingKey};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use url::Url;

/// Issuer public key (raw 32 bytes, standard base64). Print it with
/// `node scripts/license-tool.mjs pubkey`. Can be overridden at compile time with
/// the `SKILLDOCKER_LICENSE_PUBKEY` env var.
const PUBLIC_KEY_B64: &str = "ypZfHzaiW3ugZ7i0TFbeomQqIRudDEr0K2ilyh7mPP8=";

pub const LICENSE_FILE: &str = "license.key";
pub const CHECKOUT_URL: &str = "https://www.skilldocker.com/buy";
pub const ALLOWED_CHECKOUT_HOSTS: &[&str] = &["www.skilldocker.com"];
const MAX_KEY_LEN: usize = 8 * 1024;
const VALID_TIERS: &[&str] = &["pro", "team", "enterprise"];

#[cfg(debug_assertions)]
const DEV_KEY_PREFIX: &str = "PRO-DEV-";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LicensePayload {
    pub license_id: String,
    pub email: String,
    pub tier: String,
    pub features: Vec<String>,
    pub issued_at: String,
    pub expires_at: Option<String>,
    pub updates_until: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub holder_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LicenseStatus {
    /// "none" | "valid" | "expired" | "updates_expired" | "invalid"
    pub state: String,
    pub active: bool,
    pub key: Option<String>,
    pub payload: Option<LicensePayload>,
    pub message: Option<String>,
    /// True when unlocked through the debug-only dev prefix.
    pub dev: bool,
}

impl LicenseStatus {
    pub fn none() -> Self {
        LicenseStatus {
            state: "none".into(),
            active: false,
            key: None,
            payload: None,
            message: None,
            dev: false,
        }
    }
}

pub fn public_key() -> Result<VerifyingKey, String> {
    let b64 = option_env!("SKILLDOCKER_LICENSE_PUBKEY").unwrap_or(PUBLIC_KEY_B64);
    let bytes = STANDARD
        .decode(b64.trim())
        .map_err(|_| "embedded public key is not valid base64".to_string())?;
    let arr: [u8; 32] = bytes
        .try_into()
        .map_err(|_| "embedded public key must be 32 bytes".to_string())?;
    VerifyingKey::from_bytes(&arr).map_err(|_| "embedded public key is invalid".to_string())
}

pub fn decode_b64url(s: &str) -> Result<Vec<u8>, String> {
    URL_SAFE_NO_PAD
        .decode(s.trim_end_matches('='))
        .map_err(|_| "license key is not valid base64url".to_string())
}

pub fn parse_time(s: &str, field: &str) -> Result<DateTime<Utc>, String> {
    DateTime::parse_from_rfc3339(s)
        .map(|d| d.with_timezone(&Utc))
        .map_err(|_| format!("license field {} is not a valid RFC 3339 date", field))
}

/// Verifies the signature and payload shape. Does not check dates.
pub fn verify_signature(key: &str, vk: &VerifyingKey) -> Result<LicensePayload, String> {
    let key = key.trim();
    if key.is_empty() || key.len() > MAX_KEY_LEN {
        return Err("license key is empty or too long".into());
    }
    let mut parts = key.split('.');
    let (Some(p), Some(s), None) = (parts.next(), parts.next(), parts.next()) else {
        return Err("malformed license key (expected <payload>.<signature>)".into());
    };
    let payload_bytes = decode_b64url(p)?;
    let sig_bytes: [u8; 64] = decode_b64url(s)?
        .try_into()
        .map_err(|_| "license signature has the wrong length".to_string())?;
    let sig = Signature::from_bytes(&sig_bytes);
    vk.verify_strict(&payload_bytes, &sig)
        .map_err(|_| "license signature is invalid".to_string())?;

    let payload: LicensePayload = serde_json::from_slice(&payload_bytes)
        .map_err(|e| format!("license payload is malformed: {}", e))?;
    if !VALID_TIERS.contains(&payload.tier.as_str()) {
        return Err(format!("unknown license tier: {}", payload.tier));
    }
    parse_time(&payload.issued_at, "issuedAt")?;
    Ok(payload)
}

/// Full evaluation: signature, expiry and update-window against `build_time`.
pub fn evaluate(
    key: &str,
    vk: &VerifyingKey,
    now: DateTime<Utc>,
    build_time: DateTime<Utc>,
) -> LicenseStatus {
    #[cfg(debug_assertions)]
    if key.trim().starts_with(DEV_KEY_PREFIX) {
        return dev_status(key.trim());
    }

    let payload = match verify_signature(key, vk) {
        Ok(p) => p,
        Err(msg) => {
            return LicenseStatus {
                state: "invalid".into(),
                active: false,
                key: None,
                payload: None,
                message: Some(msg),
                dev: false,
            }
        }
    };

    let mut status = LicenseStatus {
        state: "valid".into(),
        active: true,
        key: Some(key.trim().to_string()),
        payload: Some(payload.clone()),
        message: None,
        dev: false,
    };

    if let Some(exp) = &payload.expires_at {
        match parse_time(exp, "expiresAt") {
            Ok(t) if t < now => {
                status.state = "expired".into();
                status.active = false;
                status.message = Some(format!("license expired on {}", exp));
            }
            Ok(_) => {}
            Err(e) => {
                status.state = "invalid".into();
                status.active = false;
                status.message = Some(e);
            }
        }
    }

    if status.active {
        if let Some(until) = &payload.updates_until {
            match parse_time(until, "updatesUntil") {
                Ok(t) if t < build_time => {
                    status.state = "updates_expired".into();
                    status.active = false;
                    status.message = Some(format!(
                        "this license covers versions released until {}; this build is newer",
                        until
                    ));
                }
                Ok(_) => {}
                Err(e) => {
                    status.state = "invalid".into();
                    status.active = false;
                    status.message = Some(e);
                }
            }
        }
    }

    status
}

#[cfg(debug_assertions)]
fn dev_status(key: &str) -> LicenseStatus {
    let now = Utc::now().to_rfc3339();
    LicenseStatus {
        state: "valid".into(),
        active: true,
        key: Some(key.to_string()),
        payload: Some(LicensePayload {
            license_id: "dev".into(),
            email: "dev@localhost".into(),
            tier: "pro".into(),
            features: vec![
                "proGuardPacks".into(),
                "cloudSync".into(),
                "injectorHistory".into(),
                "autoSyncWatch".into(),
            ],
            issued_at: now,
            expires_at: None,
            updates_until: None,
            holder_name: Some("Developer build".into()),
        }),
        message: Some("debug-build developer license".into()),
        dev: true,
    }
}

/// Timestamp of this build (set by build.rs); used for the "updates until" window.
pub fn build_time() -> DateTime<Utc> {
    env!("SKILLDOCKER_BUILD_TS")
        .parse::<i64>()
        .ok()
        .and_then(|s| DateTime::from_timestamp(s, 0))
        .unwrap_or_else(Utc::now)
}

fn license_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("cannot resolve app data dir: {}", e))?;
    Ok(dir.join(LICENSE_FILE))
}

pub fn read_status_from(path: &Path, vk: &VerifyingKey) -> LicenseStatus {
    match fs::read_to_string(path) {
        Ok(raw) if !raw.trim().is_empty() => evaluate(&raw, vk, Utc::now(), build_time()),
        _ => LicenseStatus::none(),
    }
}

pub fn activate_license_file_with_key(
    path: &Path,
    key: &str,
    vk: &VerifyingKey,
) -> Result<LicenseStatus, String> {
    let status = evaluate(key, vk, Utc::now(), build_time());
    if !status.active {
        return Err(status
            .message
            .unwrap_or_else(|| "license key rejected".into()));
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("cannot create app data dir: {}", e))?;
    }
    fs::write(path, key.trim()).map_err(|e| format!("cannot save license: {}", e))?;
    Ok(status)
}

pub fn activate_license_file(path: &Path, key: &str) -> Result<LicenseStatus, String> {
    let vk = public_key()?;
    activate_license_file_with_key(path, key, &vk)
}

pub fn deactivate_license_file(path: &Path) -> Result<(), String> {
    if path.exists() {
        fs::remove_file(path).map_err(|e| format!("cannot remove license: {}", e))?;
    }
    Ok(())
}

pub fn activate_license_internal(app: &AppHandle, key: &str) -> Result<LicenseStatus, String> {
    let path = license_path(app)?;
    activate_license_file(&path, key)
}

pub fn deactivate_license_internal(app: &AppHandle) -> Result<(), String> {
    let path = license_path(app)?;
    deactivate_license_file(&path)
}

pub fn validate_checkout_url(raw: &str) -> Result<Url, String> {
    const FORBIDDEN_CHARS: &[char] = &['&', '|', '%', '^', ' ', '\t', '\r', '\n', '"', '\''];
    for ch in FORBIDDEN_CHARS {
        if raw.contains(*ch) {
            return Err(format!(
                "checkout URL contains forbidden character: {:?}",
                ch
            ));
        }
    }
    let parsed = Url::parse(raw).map_err(|e| format!("invalid checkout URL: {}", e))?;
    if parsed.scheme() != "https" {
        return Err("checkout URL must use https scheme".into());
    }
    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err("checkout URL must not contain userinfo".into());
    }
    let host = parsed
        .host_str()
        .ok_or_else(|| "checkout URL missing host".to_string())?;
    if !ALLOWED_CHECKOUT_HOSTS.contains(&host) {
        return Err(format!("checkout URL host '{}' is not whitelisted", host));
    }
    Ok(parsed)
}

pub fn validate_and_open_url(
    url: &str,
    launcher: impl FnOnce(&str) -> Result<(), String>,
) -> Result<(), String> {
    validate_checkout_url(url)?;
    launcher(url)
}

pub fn default_browser_launcher(u: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", u])
            .spawn()
            .map(|_| ())
            .map_err(|e| format!("cannot open browser: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(u)
            .spawn()
            .map_err(|e| format!("cannot open browser: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(u)
            .spawn()
            .map_err(|e| format!("cannot open browser: {}", e))?;
    }
    Ok(())
}

pub fn open_browser_url(url: &str) -> Result<(), String> {
    validate_and_open_url(url, default_browser_launcher)
}

pub fn activate_license_path(path: &Path, key: &str) -> Result<LicenseStatus, String> {
    let res = activate_license_file(path, key);
    match &res {
        Ok(_) => crate::logging::log_command("activate_license", true, None),
        Err(_) => crate::logging::log_command(
            "activate_license",
            false,
            Some("license activation failed"),
        ),
    }
    res
}

#[tauri::command]
pub fn activate_license(app: AppHandle, key: String) -> Result<LicenseStatus, String> {
    let path = license_path(&app)?;
    activate_license_path(&path, &key)
}

pub fn get_license_status_path(path: &Path) -> Result<LicenseStatus, String> {
    let res = (|| -> Result<LicenseStatus, String> {
        let vk = public_key()?;
        Ok(read_status_from(path, &vk))
    })();
    match &res {
        Ok(_) => crate::logging::log_command("get_license_status", true, None),
        Err(e) => crate::logging::log_command("get_license_status", false, Some(e)),
    }
    res
}

#[tauri::command]
pub fn get_license_status(app: AppHandle) -> Result<LicenseStatus, String> {
    let path = license_path(&app)?;
    get_license_status_path(&path)
}

pub fn deactivate_license_path(path: &Path) -> Result<(), String> {
    let res = deactivate_license_file(path);
    match &res {
        Ok(_) => crate::logging::log_command("deactivate_license", true, None),
        Err(e) => crate::logging::log_command("deactivate_license", false, Some(e)),
    }
    res
}

#[tauri::command]
pub fn deactivate_license(app: AppHandle) -> Result<(), String> {
    let path = license_path(&app)?;
    deactivate_license_path(&path)
}

pub fn open_checkout_url_with_launcher(
    launcher: impl FnOnce(&str) -> Result<(), String>,
) -> Result<(), String> {
    let res = validate_and_open_url(CHECKOUT_URL, launcher);
    match &res {
        Ok(_) => crate::logging::log_command("open_checkout_url", true, None),
        Err(e) => crate::logging::log_command("open_checkout_url", false, Some(e)),
    }
    res
}

/// Opens the hardcoded checkout / pricing page in the system browser via standard command.
/// Accepts no arguments to eliminate any command injection risk from user input.
#[tauri::command]
pub fn open_checkout_url() -> Result<(), String> {
    open_checkout_url_with_launcher(default_browser_launcher)
}

#[cfg(test)]
#[path = "license/tests.rs"]
mod tests;
