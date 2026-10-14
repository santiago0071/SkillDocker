use std::fs;
use std::path::{Path, PathBuf};

use crate::models::{ScanResult, SkillMetaItem};
pub use crate::parser::{determine_read_by, infer_category, parse_skill_file};
use crate::paths::load_authorized_workspaces;

pub fn scan_skills_in_dir(
    hub_dir: &Path,
    ecosystem: &str,
    skills: &mut Vec<SkillMetaItem>,
    is_legacy: bool,
    is_workspace: bool,
) {
    if !hub_dir.exists() {
        return;
    }
    let source_dir_str = hub_dir.to_string_lossy().to_string();

    if let Ok(entries) = fs::read_dir(hub_dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                let folder_name = p
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                if folder_name == ".trash" {
                    continue;
                }

                if folder_name == "synced" {
                    if let Ok(sub_entries) = fs::read_dir(&p) {
                        for sub_entry in sub_entries.flatten() {
                            let sub_path = sub_entry.path();
                            if sub_path.is_dir() {
                                let sub_folder_name = sub_path
                                    .file_name()
                                    .and_then(|n| n.to_str())
                                    .unwrap_or("unknown")
                                    .to_string();
                                if sub_folder_name == ".trash" {
                                    continue;
                                }
                                let sub_skill_md = sub_path.join("SKILL.md");
                                if sub_skill_md.exists() {
                                    if let Some(item) = parse_skill_file(
                                        &sub_skill_md,
                                        &sub_folder_name,
                                        ecosystem,
                                        Some(&source_dir_str),
                                        is_legacy,
                                        is_workspace,
                                    ) {
                                        skills.push(item);
                                    }
                                }
                            }
                        }
                    }
                    continue;
                }

                // Check .system for codex
                if folder_name == ".system" {
                    if let Ok(sub_entries) = fs::read_dir(&p) {
                        for sub_entry in sub_entries.flatten() {
                            let sub_path = sub_entry.path();
                            if sub_path.is_dir() {
                                let sub_skill_md = sub_path.join("SKILL.md");
                                if sub_skill_md.exists() {
                                    let sub_name = sub_path
                                        .file_name()
                                        .and_then(|n| n.to_str())
                                        .unwrap_or("sub-skill");
                                    if let Some(item) = parse_skill_file(
                                        &sub_skill_md,
                                        sub_name,
                                        ecosystem,
                                        Some(&source_dir_str),
                                        is_legacy,
                                        is_workspace,
                                    ) {
                                        skills.push(item);
                                    }
                                }
                            }
                        }
                    }
                    continue;
                }

                let skill_md = p.join("SKILL.md");
                if skill_md.exists() {
                    if let Some(item) = parse_skill_file(
                        &skill_md,
                        &folder_name,
                        ecosystem,
                        Some(&source_dir_str),
                        is_legacy,
                        is_workspace,
                    ) {
                        skills.push(item);
                    }
                }
            }
        }
    }
}

pub fn scan_all_skills_internal(
    custom_home: Option<&Path>,
    custom_workspaces: Option<&[PathBuf]>,
) -> Result<ScanResult, String> {
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

    let user_hubs = vec![
        (
            "antigravity",
            home_path.join(".gemini").join("config").join("skills"),
            false,
        ),
        ("gemini", home_path.join(".gemini").join("skills"), false),
        (
            "antigravity",
            home_path.join(".gemini").join("antigravity").join("skills"),
            false,
        ),
        (
            "antigravity-cli",
            home_path
                .join(".gemini")
                .join("antigravity-cli")
                .join("skills"),
            false,
        ),
        ("claude", home_path.join(".claude").join("skills"), false),
        ("codex", home_path.join(".codex").join("skills"), true),
        ("agents", home_path.join(".agents").join("skills"), false),
    ];

    let mut skills = Vec::new();

    for (ecosystem, hub_dir, is_legacy) in user_hubs {
        scan_skills_in_dir(&hub_dir, ecosystem, &mut skills, is_legacy, false);
    }

    let workspaces = match custom_workspaces {
        Some(ws) => ws.to_vec(),
        None => load_authorized_workspaces(None),
    };

    for ws in &workspaces {
        let ws_hubs = vec![
            ("claude", ws.join(".claude").join("skills"), false),
            ("gemini", ws.join(".gemini").join("skills"), false),
            ("codex", ws.join(".codex").join("skills"), true),
            ("agents", ws.join(".agents").join("skills"), false),
            ("antigravity", ws.join(".agent").join("skills"), false),
        ];
        for (ecosystem, hub_dir, is_legacy) in ws_hubs {
            scan_skills_in_dir(&hub_dir, ecosystem, &mut skills, is_legacy, true);
        }
    }

    for item in &mut skills {
        item.source_id = Some(crate::vault::infer_source_id_from_path(
            Path::new(&item.raw_path),
            home_path,
            &workspaces,
        ));
    }

    Ok(ScanResult {
        success: true,
        skills,
        live_directives: Vec::new(),
        consolidated_rules: Vec::new(),
    })
}

#[tauri::command]
pub fn scan_all_skills() -> Result<ScanResult, String> {
    match scan_all_skills_internal(None, None) {
        Ok(res) => {
            crate::logging::log_command(
                "scan_all_skills",
                true,
                Some(&format!("scanned {} skills", res.skills.len())),
            );
            Ok(res)
        }
        Err(e) => {
            crate::logging::log_command("scan_all_skills", false, Some(&e));
            Err(e)
        }
    }
}

#[cfg(test)]
#[path = "scanner/tests.rs"]
mod tests;
