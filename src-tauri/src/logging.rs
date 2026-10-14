use regex::Regex;
use std::fs::{self, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use tauri::AppHandle;

static GOOGLE_KEY_REGEX: OnceLock<Regex> = OnceLock::new();
static SK_KEY_REGEX: OnceLock<Regex> = OnceLock::new();
static BEARER_REGEX: OnceLock<Regex> = OnceLock::new();
static JWT_REGEX: OnceLock<Regex> = OnceLock::new();
static JSON_SECRET_REGEX: OnceLock<Regex> = OnceLock::new();
static URL_PARAM_SECRET_REGEX: OnceLock<Regex> = OnceLock::new();
static AUTH_HEADER_REGEX: OnceLock<Regex> = OnceLock::new();

/// Convert epoch seconds into (Year, Month, Day, Hour, Minute, Second) in UTC
pub fn epoch_secs_to_datetime(secs: u64) -> (i32, u32, u32, u32, u32, u32) {
    let days = (secs / 86400) as i64;
    let rem_secs = (secs % 86400) as u32;
    let hour = rem_secs / 3600;
    let min = (rem_secs % 3600) / 60;
    let sec = rem_secs % 60;

    let z = days + 719468;
    let era = (if z >= 0 { z } else { z - 146096 }) / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = (yoe as i64) + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let final_y = if m <= 2 { y + 1 } else { y };

    (final_y as i32, m, d, hour, min, sec)
}

pub fn get_current_datetime() -> (String, String) {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let (y, m, d, hh, mm, ss) = epoch_secs_to_datetime(secs);
    let date_str = format!("{:04}-{:02}-{:02}", y, m, d);
    let time_str = format!("{:04}-{:02}-{:02} {:02}:{:02}:{:02}", y, m, d, hh, mm, ss);
    (date_str, time_str)
}

pub fn default_log_dir() -> PathBuf {
    crate::paths::skilldock_app_root().join("logs")
}

/// Determine if a key name is sensitive (e.g., access_token, client_secret, password, api_key),
/// while strictly excluding token metrics such as `tokens`, `max_tokens`, `prompt_tokens`.
pub fn is_sensitive_key_name(key: &str) -> bool {
    let k = key.to_ascii_lowercase();

    // 1. Defend against false positives: token count metrics must never be redacted
    if k.contains("tokens") || k.contains("token_count") || k.contains("token_usage") {
        return false;
    }

    // 2. Sensitive keywords: match exact or as suffix / independent segment
    let sensitive_words = [
        "token",
        "secret",
        "password",
        "passwd",
        "api_key",
        "apikey",
        "license_key",
        "licensekey",
        "license-key",
    ];
    for w in &sensitive_words {
        if k == *w || k.ends_with(w) {
            return true;
        }
        if let Some(idx) = k.find(w) {
            let before_delim = idx == 0 || matches!(k.as_bytes()[idx - 1], b'_' | b'-' | b'.');
            let after_idx = idx + w.len();
            let after_delim =
                after_idx == k.len() || matches!(k.as_bytes()[after_idx], b'_' | b'-' | b'.');
            if before_delim && after_delim {
                return true;
            }
        }
    }

    // 3. Fallback for exact 'key', or '_key'/'-key' suffix (e.g. key, app_key)
    if k == "key" || k.ends_with("_key") || k.ends_with("-key") {
        return true;
    }

    // 4. Authorization headers
    if k == "authorization" || k == "proxy-authorization" {
        return true;
    }

    false
}

/// Redact sensitive secrets from log strings (API keys, tokens, etc.) using regex without relying on whitespace splitting
pub fn sanitize_log_message(msg: &str) -> String {
    let bearer_re =
        BEARER_REGEX.get_or_init(|| Regex::new(r#"(?i)(bearer\s+)[^\s"';,}]+"#).unwrap());
    let auth_re = AUTH_HEADER_REGEX.get_or_init(|| {
        Regex::new(r#"(?i)((?:["']|\b)(?:proxy-)?authorization(?:["']|\b)\s*[:=]\s*["']?)([^"'\r\n,;}]+)(["']?)"#).unwrap()
    });
    let google_re =
        GOOGLE_KEY_REGEX.get_or_init(|| Regex::new(r"\bAIza[0-9A-Za-z\-_]{20,}\b").unwrap());
    let sk_re = SK_KEY_REGEX.get_or_init(|| Regex::new(r"\bsk-[0-9A-Za-z\-_]{8,}\b").unwrap());
    let jwt_re = JWT_REGEX.get_or_init(|| {
        Regex::new(r"\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b").unwrap()
    });
    let json_re = JSON_SECRET_REGEX.get_or_init(|| {
        Regex::new(r#"(?i)(["']?)([a-z0-9_\-\.]*(?:token|secret|password|passwd|api_?key|apikey|key|authorization)[a-z0-9_\-\.]*)(["']?\s*:\s*["']?)([^"'\s,}]+)(["']?)"#).unwrap()
    });
    let url_re = URL_PARAM_SECRET_REGEX.get_or_init(|| {
        Regex::new(r#"(?i)([\?&;]|\b)([a-z0-9_\-\.]*(?:token|secret|password|passwd|api_?key|apikey|key|authorization)[a-z0-9_\-\.]*)(\s*=\s*["']?)([^"'\s&#]+)(["']?)"#).unwrap()
    });

    let mut out = msg.to_string();

    // 1. Bearer tokens FIRST (replaces all occurrences before key name rules can strip "Bearer")
    out = bearer_re.replace_all(&out, "${1}[REDACTED]").to_string();

    // 2. Authorization header / key-value (matches to next delimiter or end of line)
    out = auth_re.replace_all(&out, "${1}[REDACTED]${3}").to_string();

    // 3. Other JSON secrets (including compound keys: access_token, client_secret, etc.)
    out = json_re
        .replace_all(&out, |caps: &regex::Captures| {
            let key = &caps[2];
            if is_sensitive_key_name(key) {
                format!("{}{}{}[REDACTED]{}", &caps[1], &caps[2], &caps[3], &caps[5])
            } else {
                caps[0].to_string()
            }
        })
        .to_string();

    // 4. URL parameters & key=value (including compound keys: ?access_token=..., &client_secret=...)
    out = url_re
        .replace_all(&out, |caps: &regex::Captures| {
            let key = &caps[2];
            if is_sensitive_key_name(key) {
                format!("{}{}{}[REDACTED]{}", &caps[1], &caps[2], &caps[3], &caps[5])
            } else {
                caps[0].to_string()
            }
        })
        .to_string();

    // 5. JWT format tokens: eyJ...
    out = jwt_re.replace_all(&out, "[REDACTED]").to_string();

    // 6. Google AIza keys: AIza...
    out = google_re.replace_all(&out, "[REDACTED]").to_string();

    // 7. OpenAI/Claude/etc sk- keys: sk-ant-, sk-proj-, sk-or-, sk-...
    out = sk_re.replace_all(&out, "[REDACTED]").to_string();

    out
}

/// Rotate logs to retain at most `keep_days` (default 7 days)
pub fn rotate_logs_internal(log_dir: &Path, keep_days: usize) -> Result<(), String> {
    if !log_dir.exists() {
        return Ok(());
    }
    let entries = fs::read_dir(log_dir).map_err(|e| e.to_string())?;
    let mut log_files: Vec<(String, PathBuf)> = entries
        .flatten()
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            if name.starts_with("skilldocker-") && name.ends_with(".log") {
                Some((name, e.path()))
            } else {
                None
            }
        })
        .collect();

    // Sort ascending by filename (lexicographical sorting on YYYY-MM-DD matches chronological order)
    log_files.sort_by(|a, b| a.0.cmp(&b.0));

    if log_files.len() > keep_days {
        let to_remove = log_files.len() - keep_days;
        for (_, p) in log_files.into_iter().take(to_remove) {
            let _ = fs::remove_file(p);
        }
    }

    Ok(())
}

pub const MAX_LOG_FILE_BYTES: u64 = 5 * 1024 * 1024; // 5MB

fn file_has_limit_notice(file_path: &Path, file_len: u64) -> bool {
    let read_len = (file_len as usize).min(256);
    if let Ok(mut f) = fs::File::open(file_path) {
        if f.seek(SeekFrom::End(-(read_len as i64))).is_ok() {
            let mut buf = vec![0u8; read_len];
            if f.read_exact(&mut buf).is_ok() {
                return String::from_utf8_lossy(&buf).contains("日志已达上限");
            }
        }
    }
    false
}

pub fn truncate_utf8(s: &str, max_bytes: usize) -> &str {
    if s.len() <= max_bytes {
        return s;
    }
    let mut boundary = max_bytes;
    while boundary > 0 && !s.is_char_boundary(boundary) {
        boundary -= 1;
    }
    &s[..boundary]
}

pub fn append_log_internal(
    log_dir: &Path,
    level: &str,
    tag: &str,
    message: &str,
) -> Result<(), String> {
    let _ = fs::create_dir_all(log_dir);
    let (date_str, timestamp_str) = get_current_datetime();
    let file_path = log_dir.join(format!("skilldocker-{}.log", date_str));

    if file_path.exists() {
        if let Ok(meta) = fs::metadata(&file_path) {
            if meta.len() >= MAX_LOG_FILE_BYTES {
                if !file_has_limit_notice(&file_path, meta.len()) {
                    let notice = format!("[{}] [WARN] [SYSTEM] 日志已达上限\n", timestamp_str);
                    if let Ok(mut f) = OpenOptions::new().append(true).open(&file_path) {
                        let _ = f.write_all(notice.as_bytes());
                    }
                }
                return Ok(());
            }
        }
    }

    let sanitized = sanitize_log_message(message);
    let log_line = format!("[{}] [{}] [{}] {}\n", timestamp_str, level, tag, sanitized);

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file_path)
        .map_err(|e| format!("Failed to open log file {}: {}", file_path.display(), e))?;

    file.write_all(log_line.as_bytes())
        .map_err(|e| format!("Failed to write to log file: {}", e))?;

    let _ = rotate_logs_internal(log_dir, 7);
    Ok(())
}

pub fn log_app_startup(version: &str) {
    let _ = append_log_internal(
        &default_log_dir(),
        "INFO",
        "APP",
        &format!(
            "SkillDocker v{} starting up (local diagnostics only)",
            version
        ),
    );
}

pub fn log_command(cmd_name: &str, success: bool, details: Option<&str>) {
    let status = if success { "SUCCESS" } else { "FAILED" };
    let msg = match details {
        Some(d) => format!("Command '{}' -> {} | {}", cmd_name, status, d),
        None => format!("Command '{}' -> {}", cmd_name, status),
    };
    let level = if success { "INFO" } else { "ERROR" };
    let _ = append_log_internal(&default_log_dir(), level, "COMMAND", &msg);
}

pub fn log_frontend_error_internal(
    log_dir: &Path,
    message: String,
    stack: Option<String>,
) -> Result<(), String> {
    let truncated_msg = truncate_utf8(&message, 8192);
    let details = match &stack {
        Some(s) => {
            let truncated_stk = truncate_utf8(s, 8192);
            format!("{}\nComponent Stack: {}", truncated_msg, truncated_stk)
        }
        None => truncated_msg.to_string(),
    };
    append_log_internal(log_dir, "ERROR", "FRONTEND", &details)
}

#[tauri::command]
pub fn log_frontend_error(message: String, stack: Option<String>) -> Result<(), String> {
    log_frontend_error_internal(&default_log_dir(), message, stack)
}

#[tauri::command]
pub fn open_log_directory() -> Result<(), String> {
    let dir = default_log_dir();
    let _ = fs::create_dir_all(&dir);

    #[cfg(target_os = "windows")]
    let res = std::process::Command::new("explorer")
        .arg(&dir)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Failed to open explorer: {}", e));
    #[cfg(target_os = "macos")]
    let res = std::process::Command::new("open")
        .arg(&dir)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Failed to open finder: {}", e));
    #[cfg(target_os = "linux")]
    let res = std::process::Command::new("xdg-open")
        .arg(&dir)
        .spawn()
        .map(|_| ())
        .map_err(|e| format!("Failed to open file manager: {}", e));

    log_command(
        "open_log_directory",
        res.is_ok(),
        Some(&dir.to_string_lossy()),
    );
    res
}

pub fn build_diagnostic_bundle_internal(
    dir: &Path,
    timestamp_str: &str,
    pkg_version: &str,
) -> Result<String, String> {
    if !dir.exists() {
        return Err("No log directory found".to_string());
    }
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    let mut log_files: Vec<(String, PathBuf)> = entries
        .flatten()
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            if name.starts_with("skilldocker-") && name.ends_with(".log") {
                Some((name, e.path()))
            } else {
                None
            }
        })
        .collect();
    log_files.sort_by(|a, b| a.0.cmp(&b.0));

    let mut bundle = String::new();
    bundle.push_str(
        "================================================================================\n",
    );
    bundle.push_str("SkillDocker Local Diagnostic Package (Last 7 Days)\n");
    bundle.push_str(&format!(
        "Generated: {} (UTC)\nApp Version: {}\n",
        timestamp_str, pkg_version
    ));
    bundle.push_str("Note: Confidential data (API keys, skill content) strictly excluded.\n");
    bundle.push_str(
        "================================================================================\n\n",
    );

    for (name, path) in log_files {
        bundle.push_str(&format!("--- BEGIN LOG FILE: {} ---\n", name));
        if let Ok(content) = fs::read_to_string(path) {
            bundle.push_str(&content);
        }
        bundle.push_str(&format!("--- END LOG FILE: {} ---\n\n", name));
    }
    Ok(bundle)
}

#[tauri::command]
pub async fn export_diagnostic_package(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let dir = default_log_dir();
    let (date_str, timestamp_str) = get_current_datetime();
    let bundle = build_diagnostic_bundle_internal(&dir, &timestamp_str, env!("CARGO_PKG_VERSION"))?;
    let default_file_name = format!("skilldocker-diagnostics-{}.log", date_str);
    let picked = app
        .dialog()
        .file()
        .set_file_name(&default_file_name)
        .blocking_save_file();
    if let Some(file_path) = picked {
        let dest = file_path
            .into_path()
            .map_err(|e| format!("Invalid path: {:?}", e))?;
        fs::write(&dest, bundle)
            .map_err(|e| format!("Failed to write diagnostics package: {}", e))?;
        let dest_str = dest.to_string_lossy().to_string();
        log_command("export_diagnostic_package", true, Some(&dest_str));
        Ok(Some(dest_str))
    } else {
        Ok(None)
    }
}

#[cfg(test)]
#[path = "logging/tests.rs"]
mod tests;
