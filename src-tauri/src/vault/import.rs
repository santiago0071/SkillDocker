use std::fs::{self, File};
use std::io::{Read, Seek};
use std::path::{Path, PathBuf};
use zip::ZipArchive;

use super::{sha256_digest, MAX_SINGLE_FILE_BYTES};
use crate::models::{
    ImportPackSummary, ImportSkillResult, ImportTargetOption, SkillPackInspection,
    SkillPackManifest,
};

pub const MAX_MANIFEST_SKILLS: usize = 500;
pub const MAX_MANIFEST_FILES: usize = 10_000;

pub fn resolve_import_hub_target(
    target: &str,
    home: &Path,
    ws: &[PathBuf],
) -> Result<PathBuf, String> {
    let raw = target.trim();
    if raw.is_empty() {
        return Err("目标标识不能为空".into());
    }

    if raw.starts_with('/') || raw.starts_with('\\') || raw.contains(':') {
        return Err("目标只接受已知来源标识枚举值，不接受绝对路径或任意目录".into());
    }

    let norm = raw.to_lowercase().replace('\\', "/");
    if norm.contains("synced") || norm == ".claude/synced" || norm == "claude-synced" {
        return Err(
            "Cannot import into .claude/synced: claude-synced 及其子目录受保护，禁止作为导入目标"
                .into(),
        );
    }
    let resolved = if let Some(ws_name) = norm.strip_prefix("workspace-") {
        let found = ws.iter().find(|w| {
            w.file_name()
                .map(|n| n.to_string_lossy().to_lowercase() == ws_name)
                .unwrap_or(false)
        });
        match found {
            Some(w) => w.join(".agents").join("skills"),
            None => return Err(format!("工作区 '{}' 未授权或不存在", ws_name)),
        }
    } else {
        match norm.as_str() {
            "claude" | "claude-user" => home.join(".claude").join("skills"),
            "gemini" | "gemini-cli-user" => home.join(".gemini").join("skills"),
            "antigravity" | "antigravity-user" => {
                home.join(".gemini").join("config").join("skills")
            }
            "antigravity-legacy" => home.join(".gemini").join("antigravity").join("skills"),
            "antigravity-cli-user" => home.join(".gemini").join("antigravity-cli").join("skills"),
            "codex" | "codex-legacy" => home.join(".codex").join("skills"),
            "agents" | "agents-user" => home.join(".agents").join("skills"),
            _ => {
                return Err(format!(
                    "目标标识 '{}' 不合法：只接受已知来源标识枚举值，不接受绝对路径或任意目录",
                    raw
                ))
            }
        }
    };

    let norm_path = crate::paths::normalize_path(&resolved)?;

    let comps: Vec<String> = norm_path
        .components()
        .map(|c| c.as_os_str().to_string_lossy().to_lowercase())
        .collect();
    for window in comps.windows(2) {
        if (window[0] == ".claude" || window[0] == "claude") && window[1] == "synced" {
            return Err("Cannot import into .claude/synced: claude-synced 及其子目录受保护，禁止作为导入目标".into());
        }
    }
    if comps.iter().any(|c| c == ".claude" || c == "claude") && comps.iter().any(|c| c == "synced")
    {
        return Err(
            "Cannot import into .claude/synced: claude-synced 及其子目录受保护，禁止作为导入目标"
                .into(),
        );
    }

    let _ = fs::create_dir_all(&norm_path);
    if !crate::paths::is_dir_safe_internal(&norm_path, home, ws) {
        return Err(format!(
            "Target directory '{}' unauthorized",
            norm_path.display()
        ));
    }
    Ok(norm_path)
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), std::io::Error> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ft = entry.file_type()?;
        let target = dst.join(entry.file_name());
        if ft.is_dir() {
            copy_dir_recursive(&entry.path(), &target)?;
        } else {
            fs::copy(entry.path(), target)?;
        }
    }
    Ok(())
}

fn move_or_copy_dir(src: &Path, dst: &Path) -> Result<(), std::io::Error> {
    if fs::rename(src, dst).is_ok() {
        return Ok(());
    }
    copy_dir_recursive(src, dst)?;
    fs::remove_dir_all(src)
}

pub fn read_zip_manifest<R: Read + Seek>(
    zip: &mut ZipArchive<R>,
) -> Result<SkillPackManifest, String> {
    let mut buf = Vec::new();
    let entry = zip
        .by_name("manifest.json")
        .map_err(|_| "manifest.json missing".to_string())?;

    entry
        .take(MAX_SINGLE_FILE_BYTES + 1)
        .read_to_end(&mut buf)
        .map_err(|e| e.to_string())?;

    let raw_val: serde_json::Value =
        serde_json::from_slice(&buf).map_err(|e| format!("manifest.json 解析失败: {}", e))?;

    let raw_ver = raw_val
        .get("formatVersion")
        .or_else(|| raw_val.get("format_version"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim();

    if raw_ver.starts_with("2.") || raw_ver == "2" || raw_ver == "2.0" {
        return Err("不支持的旧格式备份包 (v2.0)，请使用 v3.0 格式备份包".into());
    }
    if raw_ver != "3.0" && raw_ver != "3" {
        return Err(format!(
            "不支持的备份包格式版本 (v{})，仅支持 v3.0",
            raw_ver
        ));
    }

    let m: SkillPackManifest =
        serde_json::from_value(raw_val).map_err(|e| format!("manifest 结构不兼容: {}", e))?;

    if m.skills.len() > MAX_MANIFEST_SKILLS {
        return Err(format!(
            "备份包技能数量 ({}) 超过允许上限 (最多 {} 个)",
            m.skills.len(),
            MAX_MANIFEST_SKILLS
        ));
    }
    let total_files: usize = m.skills.iter().map(|s| s.files.len()).sum();
    if total_files > MAX_MANIFEST_FILES {
        return Err(format!(
            "备份包文件总数 ({}) 超过允许上限 (最多 {} 个)",
            total_files, MAX_MANIFEST_FILES
        ));
    }

    Ok(m)
}

pub fn inspect_skill_pack_file(pack_path: &Path) -> Result<SkillPackInspection, String> {
    let f = File::open(pack_path).map_err(|e| e.to_string())?;
    let mut zip = ZipArchive::new(f).map_err(|e| e.to_string())?;
    let m = read_zip_manifest(&mut zip)?;
    let (files, bytes) = m.skills.iter().fold((0, 0u64), |(fc, bc), s| {
        (
            fc + s.files.len(),
            bc + s.files.iter().map(|f| f.size).sum::<u64>(),
        )
    });

    Ok(SkillPackInspection {
        pack_path: pack_path.to_string_lossy().to_string(),
        format_version: m.format_version,
        exported_at: m.exported_at,
        app_version: m.app_version,
        total_skills: m.skills.len(),
        total_files: files,
        total_bytes: bytes,
        skills: m.skills,
    })
}

pub fn import_skill_pack_internal(
    pack: &Path,
    sel: &[String],
    targets: &[ImportTargetOption],
    home: &Path,
    ws: &[PathBuf],
    bak: &Path,
) -> Result<ImportPackSummary, String> {
    let f = File::open(pack).map_err(|e| e.to_string())?;
    let mut zip = ZipArchive::new(f).map_err(|e| e.to_string())?;
    let manifest = read_zip_manifest(&mut zip)?;

    let mut results = Vec::new();
    let (mut imported, mut skipped, mut failed) = (0, 0, 0);

    for skill in &manifest.skills {
        let composite_key = format!("{}:{}", skill.source, skill.directory_name);
        if !sel.is_empty()
            && !sel.contains(&composite_key)
            && !sel.contains(&skill.name)
            && !sel.contains(&skill.directory_name)
        {
            continue;
        }
        let skill_id_name = &skill.directory_name;
        let mut push = |st: &str, msg: String| {
            results.push(ImportSkillResult {
                name: skill_id_name.clone(),
                status: st.into(),
                message: msg,
            })
        };

        let opt = targets.iter().find(|t| {
            t.skill_name == composite_key
                || t.skill_name == skill.name
                || t.skill_name == skill.directory_name
        });

        let default_target = match skill.source.as_str() {
            "codex-legacy" | "codex" => "agents-user",
            "antigravity-legacy" => "antigravity-user",
            s if !s.is_empty() => s,
            _ => "claude-user",
        };

        let eco = opt
            .map(|t| t.target_ecosystem.as_str())
            .unwrap_or(default_target);
        let overwrite = opt.map(|t| t.overwrite).unwrap_or(false);

        let hub = match resolve_import_hub_target(eco, home, ws) {
            Ok(h) => h,
            Err(e) => {
                failed += 1;
                push("failed", e);
                continue;
            }
        };

        let target_dir = hub.join(skill_id_name);
        if target_dir.exists() && !overwrite {
            skipped += 1;
            push("skipped", "Skill already exists".into());
            continue;
        }

        let ts_nano = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let staging_dir = hub.join(format!(".staging_{}_{}", skill_id_name, ts_nano));
        let _ = fs::create_dir_all(&staging_dir);

        let mut err: Option<String> = None;
        for file in &skill.files {
            let rel = file.path.replace('\\', "/");
            if rel.contains("..") || rel.starts_with('/') || rel.contains(':') {
                err = Some(format!("Zip Slip rejected: {}", rel));
                break;
            }
            let staging_file = staging_dir.join(&rel);
            let (Ok(nd), Ok(ns)) = (
                crate::paths::normalize_path(&staging_file),
                crate::paths::normalize_path(&staging_dir),
            ) else {
                err = Some(format!("Path error: {}", rel));
                break;
            };
            if !crate::paths::is_component_subpath(&ns, &nd) {
                err = Some(format!("Path escaped staging: {}", rel));
                break;
            }

            let v3_path = format!("skills/{}/{}/{}", skill.source, skill.directory_name, rel);
            let v2_path = format!("skills/{}/{}", skill.name, rel);
            let entry_name = if zip.by_name(&v3_path).is_ok() {
                v3_path
            } else {
                v2_path
            };
            let mut zf = match zip.by_name(&entry_name) {
                Ok(f) => f,
                Err(e) => {
                    err = Some(format!("Pack missing file: {}", e));
                    break;
                }
            };

            let mut bytes = Vec::new();
            if zf
                .by_ref()
                .take(MAX_SINGLE_FILE_BYTES + 1)
                .read_to_end(&mut bytes)
                .is_err()
                || bytes.len() as u64 > MAX_SINGLE_FILE_BYTES
            {
                err = Some(format!("Read failure or >50MB: {}", rel));
                break;
            }

            if sha256_digest(&bytes) != file.sha256 {
                err = Some(format!("SHA-256 mismatch for {}", rel));
                break;
            }

            if let Some(p) = staging_file.parent() {
                let _ = fs::create_dir_all(p);
            }
            if let Err(e) = fs::write(&staging_file, &bytes) {
                err = Some(format!("Failed to write to staging: {}", e));
                break;
            }
        }

        if let Some(msg) = err {
            let _ = fs::remove_dir_all(&staging_dir);
            failed += 1;
            push("failed", msg);
            continue;
        }

        if target_dir.exists() {
            let replaced_root = bak.join("replaced");
            let _ = fs::create_dir_all(&replaced_root);
            let ts_millis = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis();
            let replaced_dir = replaced_root.join(format!("{}-{}", skill_id_name, ts_millis));

            if let Err(e) = move_or_copy_dir(&target_dir, &replaced_dir) {
                let _ = fs::remove_dir_all(&staging_dir);
                failed += 1;
                push("failed", format!("Failed to backup existing skill: {}", e));
                continue;
            }
        }

        if let Err(_e) = fs::rename(&staging_dir, &target_dir) {
            if let Err(e2) = move_or_copy_dir(&staging_dir, &target_dir) {
                let _ = fs::remove_dir_all(&staging_dir);
                failed += 1;
                push(
                    "failed",
                    format!("Failed to commit staging to target: {}", e2),
                );
                continue;
            }
            let _ = fs::remove_dir_all(&staging_dir);
        }

        imported += 1;
        push("imported", "Success".into());
    }

    Ok(ImportPackSummary {
        total: results.len(),
        imported,
        skipped,
        failed,
        results,
    })
}
