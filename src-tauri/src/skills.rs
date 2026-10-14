use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

use crate::backup::{default_backup_dir, get_backup_prefix_for_path, purge_old_backups};
use crate::models::SkillMetaItem;
use crate::parser::parse_skill_file;
use crate::paths::resolve_safe_path;

pub fn is_claude_synced_path(p: &Path) -> bool {
    let s = p.to_string_lossy().replace('\\', "/").to_lowercase();
    s.contains("/.claude/skills/synced/") || s.ends_with("/.claude/skills/synced")
}

pub fn save_skill_file_internal(
    safe_p: &Path,
    content: &str,
    backup_dir: &Path,
) -> Result<(), String> {
    let s = safe_p.to_string_lossy().replace('\\', "/").to_lowercase();
    if s.contains("/.skilldock/logs/") || s.ends_with(".log") {
        return Err("日志文件不能通过 save_skill_file 写入".to_string());
    }
    if is_claude_synced_path(safe_p) {
        return Err("该技能由 claude.ai 同步，请在 claude.ai 上修改".to_string());
    }
    if let Some(parent) = safe_p.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::create_dir_all(backup_dir);
    let prefix = get_backup_prefix_for_path(safe_p);
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let backup_path = backup_dir.join(format!("{}{}.bak", prefix, timestamp));
    if safe_p.exists() {
        if let Ok(orig) = fs::read_to_string(safe_p) {
            let _ = fs::write(backup_path, orig);
            purge_old_backups(backup_dir, &prefix, 10);
        }
    }
    fs::write(safe_p, content)
        .map_err(|e| format!("Failed to write file {}: {}", safe_p.display(), e))
}

pub fn rollback_skill_file_internal(safe_p: &Path, backup_dir: &Path) -> Result<String, String> {
    if is_claude_synced_path(safe_p) {
        return Err("该技能由 claude.ai 同步，请在 claude.ai 上修改".to_string());
    }
    let prefix = get_backup_prefix_for_path(safe_p);
    if let Ok(entries) = fs::read_dir(backup_dir) {
        let backups: Vec<(std::time::SystemTime, PathBuf)> = entries
            .flatten()
            .filter_map(|e| {
                let name = e.file_name().to_string_lossy().to_string();
                if name.starts_with(&prefix) && name.ends_with(".bak") {
                    let meta = e.metadata().ok()?;
                    let modified = meta.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH);
                    Some((modified, e.path()))
                } else {
                    None
                }
            })
            .collect();

        if let Some((_, latest_backup)) = backups.into_iter().max_by_key(|b| b.0) {
            let backup_content = fs::read_to_string(&latest_backup)
                .map_err(|e| format!("Failed to read backup: {}", e))?;
            fs::write(safe_p, &backup_content)
                .map_err(|e| format!("Failed to restore file: {}", e))?;
            let _ = fs::remove_file(latest_backup);
            return Ok(backup_content);
        }
    }
    Err("No backup found to restore".to_string())
}

#[tauri::command]
pub fn read_skill_file(path: String) -> Result<String, String> {
    let safe_p = match resolve_safe_path(&path) {
        Ok(p) => p,
        Err(e) => {
            crate::logging::log_command("read_skill_file", false, Some(&e));
            return Err(e);
        }
    };
    match fs::read_to_string(&safe_p) {
        Ok(content) => {
            crate::logging::log_command("read_skill_file", true, Some(&format!("path: {}", path)));
            Ok(content)
        }
        Err(e) => {
            let err_msg = format!("Failed to read file {}: {}", path, e);
            crate::logging::log_command("read_skill_file", false, Some(&err_msg));
            Err(err_msg)
        }
    }
}

#[tauri::command]
pub fn save_skill_file(path: String, content: String) -> Result<(), String> {
    let safe_p = match resolve_safe_path(&path) {
        Ok(p) => p,
        Err(e) => {
            crate::logging::log_command("save_skill_file", false, Some(&e));
            return Err(e);
        }
    };
    match save_skill_file_internal(&safe_p, &content, &default_backup_dir()) {
        Ok(()) => {
            crate::logging::log_command(
                "save_skill_file",
                true,
                Some(&format!("saved skill to {}", path)),
            );
            Ok(())
        }
        Err(e) => {
            crate::logging::log_command("save_skill_file", false, Some(&e));
            Err(e)
        }
    }
}

#[tauri::command]
pub fn rollback_skill_file(path: String) -> Result<String, String> {
    let safe_p = match resolve_safe_path(&path) {
        Ok(p) => p,
        Err(e) => {
            crate::logging::log_command("rollback_skill_file", false, Some(&e));
            return Err(e);
        }
    };
    match rollback_skill_file_internal(&safe_p, &default_backup_dir()) {
        Ok(content) => {
            crate::logging::log_command(
                "rollback_skill_file",
                true,
                Some(&format!("rolled back {}", path)),
            );
            Ok(content)
        }
        Err(e) => {
            crate::logging::log_command("rollback_skill_file", false, Some(&e));
            Err(e)
        }
    }
}

pub fn validate_skill_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Skill name cannot be empty".to_string());
    }
    if name == "synced" || name == ".trash" {
        return Err(format!(
            "'{}' is a reserved directory name and cannot be used as a skill name",
            name
        ));
    }
    if !name
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-' || c == '_')
    {
        return Err(format!(
            "Invalid skill name '{}': only lowercase alphanumeric characters, hyphens and underscores ([a-z0-9-_]) are allowed",
            name
        ));
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
pub fn create_new_skill_internal(
    name: &str,
    category: &str,
    description: &str,
    version: Option<&str>,
    body_text: &str,
    ecosystem: Option<&str>,
    overwrite: bool,
    custom_home: Option<&Path>,
) -> Result<SkillMetaItem, String> {
    let clean_name = name.trim();
    validate_skill_name(clean_name)?;

    let home_path_buf = match custom_home {
        Some(h) => h.to_path_buf(),
        None => {
            let home = std::env::var("USERPROFILE")
                .or_else(|_| std::env::var("HOME"))
                .unwrap_or_else(|_| ".".to_string());
            PathBuf::from(home)
        }
    };
    let home_path = home_path_buf.as_path();

    let eco = ecosystem.unwrap_or("antigravity");
    let target_dir = match eco {
        "claude" => home_path.join(".claude").join("skills").join(clean_name),
        "codex" | "agents" => home_path.join(".agents").join("skills").join(clean_name),
        _ => home_path
            .join(".gemini")
            .join("config")
            .join("skills")
            .join(clean_name),
    };

    let skill_path = target_dir.join("SKILL.md");
    if skill_path.exists() && !overwrite {
        return Err(format!(
            "Skill '{}' already exists at '{}'. Overwrite not permitted without confirmation.",
            clean_name,
            skill_path.display()
        ));
    }

    let _ = fs::create_dir_all(&target_dir);

    let v = version.unwrap_or("1.0.0");
    let content = format!(
        "---\nname: {}\ndescription: {}\ncategory: {}\nversion: {}\n---\n\n{}\n",
        clean_name,
        description.trim(),
        category.trim(),
        v,
        body_text.trim()
    );

    if let Some(h) = custom_home {
        let backup_dir = h.join(".skilldock").join("backups");
        save_skill_file_internal(&skill_path, &content, &backup_dir)?;
    } else {
        save_skill_file(skill_path.to_string_lossy().to_string(), content)?;
    }

    let source_dir_str = target_dir.parent().map(|p| p.to_string_lossy().to_string());
    parse_skill_file(
        &skill_path,
        clean_name,
        eco,
        source_dir_str.as_deref(),
        false,
        false,
    )
    .ok_or_else(|| "Failed to parse created skill file".to_string())
}

#[tauri::command]
pub fn create_new_skill(
    name: String,
    category: String,
    description: String,
    version: Option<String>,
    body_text: String,
    ecosystem: Option<String>,
    overwrite: Option<bool>,
) -> Result<SkillMetaItem, String> {
    let res = create_new_skill_internal(
        &name,
        &category,
        &description,
        version.as_deref(),
        &body_text,
        ecosystem.as_deref(),
        overwrite.unwrap_or(false),
        None,
    );
    match &res {
        Ok(_) => crate::logging::log_command(
            "create_new_skill",
            true,
            Some(&format!("created skill {}", name)),
        ),
        Err(e) => crate::logging::log_command("create_new_skill", false, Some(e)),
    }
    res
}

#[tauri::command]
pub fn toggle_dock_window(app: AppHandle) -> Result<(), String> {
    let mut state = "hidden";
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            state = "visible";
        }
        let _ = window.set_focus();
    }
    crate::logging::log_command("toggle_dock_window", true, Some(state));
    Ok(())
}

#[cfg(test)]
#[path = "skills/tests.rs"]
mod tests;
