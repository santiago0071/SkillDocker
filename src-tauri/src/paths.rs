use std::fs;
use std::path::{Component, Path, PathBuf};

pub fn normalize_path(p: &Path) -> Result<PathBuf, String> {
    let mut normalized = PathBuf::new();
    for comp in p.components() {
        match comp {
            Component::Prefix(prefix) => {
                let prefix_str = prefix.as_os_str().to_string_lossy();
                let clean = prefix_str
                    .trim_start_matches(r"\\?\")
                    .trim_start_matches("//?/");
                normalized.push(clean);
            }
            Component::RootDir => {
                normalized.push(Component::RootDir);
            }
            Component::CurDir => {}
            Component::ParentDir => {
                if !normalized.pop() {
                    return Err("Path traversal attempt beyond root".to_string());
                }
            }
            Component::Normal(part) => {
                normalized.push(part);
            }
        }
    }
    Ok(normalized)
}

pub fn is_component_subpath(parent: &Path, child: &Path) -> bool {
    let parent_comps: Vec<String> = parent
        .components()
        .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
        .collect();
    let child_comps: Vec<String> = child
        .components()
        .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
        .collect();

    if parent_comps.len() > child_comps.len() {
        return false;
    }

    for (p, c) in parent_comps.iter().zip(child_comps.iter()) {
        if p != c {
            return false;
        }
    }
    true
}

pub fn is_allowed_workspace_target(ws: &Path, target: &Path) -> bool {
    let ws_comps: Vec<String> = ws
        .components()
        .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
        .collect();
    let target_comps: Vec<String> = target
        .components()
        .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
        .collect();
    if target_comps.len() <= ws_comps.len() {
        return false;
    }
    let rel_path = target_comps[ws_comps.len()..].join("/");
    if matches!(
        rel_path.as_str(),
        "claude.md" | "agents.md" | ".cursorrules" | "deepseek.md"
    ) {
        return true;
    }
    let starts_valid = rel_path.starts_with(".gemini/skills/")
        || rel_path.starts_with(".claude/skills/")
        || rel_path.starts_with(".codex/skills/")
        || rel_path.starts_with(".agents/skills/")
        || rel_path.starts_with(".agent/skills/");
    starts_valid && rel_path.ends_with("/skill.md")
}

pub fn skilldock_app_root() -> PathBuf {
    if let Ok(val) = std::env::var("SKILLDOCK_HOME") {
        let trimmed = val.trim();
        if !trimmed.is_empty() {
            return PathBuf::from(trimmed);
        }
    }
    #[cfg(test)]
    {
        static TEST_DIR: std::sync::OnceLock<PathBuf> = std::sync::OnceLock::new();
        return TEST_DIR
            .get_or_init(|| {
                if let Ok(entries) = fs::read_dir(std::env::temp_dir()) {
                    for e in entries.flatten() {
                        let name = e.file_name().to_string_lossy().to_string();
                        if name.starts_with("skilldock_test_") {
                            let _ = fs::remove_dir_all(e.path());
                        }
                    }
                }
                let dir =
                    std::env::temp_dir().join(format!("skilldock_test_{}", std::process::id()));
                let _ = fs::create_dir_all(&dir);
                extern "C" fn cleanup_test_dir() {
                    let dir =
                        std::env::temp_dir().join(format!("skilldock_test_{}", std::process::id()));
                    let _ = fs::remove_dir_all(dir);
                }
                unsafe {
                    extern "C" {
                        fn atexit(f: extern "C" fn()) -> std::ffi::c_int;
                    }
                    let _ = atexit(cleanup_test_dir);
                }
                dir
            })
            .clone();
    }
    #[cfg(not(test))]
    {
        let home = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_else(|_| ".".to_string());
        Path::new(&home).join(".skilldock")
    }
}

pub fn get_workspaces_file() -> PathBuf {
    skilldock_app_root().join("workspaces.json")
}

pub fn load_authorized_workspaces(config_file: Option<&Path>) -> Vec<PathBuf> {
    let file_path = config_file
        .map(|p| p.to_path_buf())
        .unwrap_or_else(get_workspaces_file);
    if let Ok(content) = fs::read_to_string(&file_path) {
        if let Ok(paths) = serde_json::from_str::<Vec<String>>(&content) {
            return paths
                .into_iter()
                .filter_map(|s| normalize_path(Path::new(&s)).ok())
                .collect();
        }
    }
    Vec::new()
}

pub fn save_authorized_workspaces(
    workspaces: &[PathBuf],
    config_file: Option<&Path>,
) -> Result<(), String> {
    let file_path = config_file
        .map(|p| p.to_path_buf())
        .unwrap_or_else(get_workspaces_file);
    if let Some(parent) = file_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let strings: Vec<String> = workspaces
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();
    let json = serde_json::to_string_pretty(&strings).map_err(|e| e.to_string())?;
    fs::write(&file_path, json).map_err(|e| e.to_string())
}

pub fn add_workspace(path: String) -> Result<Vec<String>, String> {
    let norm = normalize_path(Path::new(&path))?;
    let mut list = load_authorized_workspaces(None);
    if !list.iter().any(|p| p == &norm) {
        list.push(norm);
        save_authorized_workspaces(&list, None)?;
    }
    Ok(list
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect())
}

#[tauri::command]
pub fn list_workspaces() -> Result<Vec<String>, String> {
    let list = load_authorized_workspaces(None);
    crate::logging::log_command(
        "list_workspaces",
        true,
        Some(&format!("count: {}", list.len())),
    );
    Ok(list
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect())
}

#[tauri::command]
pub fn remove_workspace(path: String) -> Result<Vec<String>, String> {
    let res = (|| {
        let norm = normalize_path(Path::new(&path))?;
        let mut list = load_authorized_workspaces(None);
        list.retain(|p| p != &norm);
        save_authorized_workspaces(&list, None)?;
        Ok(list
            .into_iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect())
    })();
    crate::logging::log_command("remove_workspace", res.is_ok(), Some(&path));
    res
}

pub fn is_path_safe_internal(p: &Path, home_dir: &Path, workspaces: &[PathBuf]) -> bool {
    let normalized = match normalize_path(p) {
        Ok(n) => n,
        Err(_) => return false,
    };

    let skill_roots = [
        home_dir.join(".gemini"),
        home_dir.join(".claude"),
        home_dir.join(".codex"),
        home_dir.join(".agents"),
    ];

    for root in &skill_roots {
        if let Ok(norm_root) = normalize_path(root) {
            if is_component_subpath(&norm_root, &normalized) {
                let norm_comps: Vec<String> = normalized
                    .components()
                    .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
                    .collect();
                let root_comps: Vec<String> = norm_root
                    .components()
                    .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
                    .collect();

                if norm_comps.len() > root_comps.len() {
                    let rel = &norm_comps[root_comps.len()..];
                    if let Some(file_name) = rel.last() {
                        if file_name == "skill.md" {
                            let dir_parts = &rel[..rel.len() - 1];
                            if dir_parts.iter().any(|comp| comp == "skills") {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }
        }
    }

    let skilldock_root = home_dir.join(".skilldock");
    let app_root = skilldock_app_root();
    let sd_roots = if skilldock_root == app_root {
        vec![skilldock_root]
    } else {
        vec![skilldock_root, app_root]
    };

    for sd_path in &sd_roots {
        if let Ok(norm_sd) = normalize_path(sd_path) {
            if is_component_subpath(&norm_sd, &normalized) {
                let norm_comps: Vec<String> = normalized
                    .components()
                    .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
                    .collect();
                let sd_comps: Vec<String> = norm_sd
                    .components()
                    .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
                    .collect();

                if norm_comps.len() > sd_comps.len() {
                    let rel = &norm_comps[sd_comps.len()..];
                    if let Some(file_name) = rel.last() {
                        if rel.len() >= 2 && rel[0] == "backups" && file_name.ends_with(".bak") {
                            return true;
                        }
                    }
                }
                return false;
            }
        }
    }

    for ws in workspaces {
        if let Ok(norm_ws) = normalize_path(ws) {
            if is_component_subpath(&norm_ws, &normalized)
                && is_allowed_workspace_target(&norm_ws, &normalized)
            {
                return true;
            }
        }
    }

    false
}

pub fn is_dir_safe_internal(p: &Path, home_dir: &Path, workspaces: &[PathBuf]) -> bool {
    let normalized = match normalize_path(p) {
        Ok(n) => n,
        Err(_) => return false,
    };

    if !normalized.is_dir() {
        return false;
    }

    for ws in workspaces {
        if let Ok(norm_ws) = normalize_path(ws) {
            if is_component_subpath(&norm_ws, &normalized) {
                return true;
            }
        }
    }

    let app_root = skilldock_app_root();
    let app_root_logs = app_root.join("logs");
    let allowed_hubs = [
        home_dir.join(".gemini").join("config").join("skills"),
        home_dir.join(".gemini").join("skills"),
        home_dir.join(".gemini").join("antigravity").join("skills"),
        home_dir
            .join(".gemini")
            .join("antigravity-cli")
            .join("skills"),
        home_dir.join(".claude").join("skills"),
        home_dir.join(".codex").join("skills"),
        home_dir.join(".agents").join("skills"),
        home_dir.join(".skilldock"),
        home_dir.join(".skilldock").join("logs"),
        app_root,
        app_root_logs,
    ];

    for hub in &allowed_hubs {
        if let Ok(norm_hub) = normalize_path(hub) {
            if is_component_subpath(&norm_hub, &normalized) {
                return true;
            }
        }
    }

    false
}

pub fn resolve_safe_path_internal(
    path_str: &str,
    home_dir: &Path,
    workspaces: &[PathBuf],
) -> Result<PathBuf, String> {
    let p = Path::new(path_str);
    let resolved = if p.is_absolute() {
        p.to_path_buf()
    } else {
        home_dir.join(p)
    };
    let normalized = normalize_path(&resolved)?;
    if !is_path_safe_internal(&normalized, home_dir, workspaces) {
        return Err(format!(
            "Security violation: path '{}' is outside authorized skill or workspace directories",
            path_str
        ));
    }
    Ok(normalized)
}

pub fn resolve_safe_path(path_str: &str) -> Result<PathBuf, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    let workspaces = load_authorized_workspaces(None);
    resolve_safe_path_internal(path_str, Path::new(&home), &workspaces)
}

#[tauri::command]
pub fn open_workspace_in_explorer(path: Option<String>) -> Result<(), String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    let workspaces = load_authorized_workspaces(None);
    let target_str = match path {
        Some(s) if !s.trim().is_empty() => s,
        _ => workspaces
            .first()
            .map(|w| w.to_string_lossy().to_string())
            .unwrap_or_else(|| skilldock_app_root().to_string_lossy().to_string()),
    };
    let p = Path::new(&target_str);
    let resolved = if p.is_absolute() {
        p.to_path_buf()
    } else {
        Path::new(&home).join(p)
    };
    let normalized = normalize_path(&resolved)?;
    if !is_dir_safe_internal(&normalized, Path::new(&home), &workspaces) {
        return Err(format!(
            "Security violation: path '{}' is not an authorized directory",
            target_str
        ));
    }
    #[cfg(target_os = "windows")]
    let res = std::process::Command::new("explorer")
        .arg(&normalized)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string());
    #[cfg(target_os = "macos")]
    let res = std::process::Command::new("open")
        .arg(&normalized)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string());
    #[cfg(target_os = "linux")]
    let res = std::process::Command::new("xdg-open")
        .arg(&normalized)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string());

    crate::logging::log_command("open_workspace_in_explorer", res.is_ok(), Some(&target_str));
    res
}

#[tauri::command]
pub async fn pick_and_register_workspace(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let picked = app.dialog().file().blocking_pick_folder();
    let res: Result<Option<String>, String> = if let Some(file_path) = picked {
        let path_buf = file_path
            .into_path()
            .map_err(|e| format!("Invalid path: {:?}", e))?;
        let p_str = path_buf.to_string_lossy().to_string();
        add_workspace(p_str.clone())?;
        Ok(Some(p_str))
    } else {
        Ok(None)
    };
    let detail = match &res {
        Ok(Some(p)) => p.as_str(),
        Ok(None) => "cancelled",
        Err(e) => e.as_str(),
    };
    crate::logging::log_command("pick_and_register_workspace", res.is_ok(), Some(detail));
    res
}

#[cfg(test)]
#[path = "paths/tests.rs"]
mod tests;
