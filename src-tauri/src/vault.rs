use sha2::{Digest, Sha256};
#[cfg(test)]
use std::fs;
use std::path::{Path, PathBuf};
use tauri_plugin_dialog::DialogExt;

use std::collections::BTreeMap;

pub mod export;
pub mod import;

pub use export::*;
pub use import::*;

pub fn generate_readme(manifest: &SkillPackManifest) -> String {
    let mut out = String::with_capacity(4096);
    out.push_str(&format!(
        "# SkillDocker 技能便携备份包 / SkillPack Portable Backup\n\n\
        - **导出时间 / Exported At**: {}\n\
        - **工具版本 / App Version**: SkillDocker v{}\n\
        - **格式版本 / Format Version**: v{}\n\
        - **技能总数 / Total Skills**: {}\n\n\
        ---\n\n\
        ## 一、包内目录结构 / Directory Structure\n\n\
        ```\n\
        README.md                     # 本说明文档 / This documentation\n\
        manifest.json                 # 机器可读清单 / Machine-readable manifest with SHA-256\n\
        skills/                       # 技能数据根目录 / Skills root\n\
          <来源标识/Source-ID>/\n\
            <技能目录名/Skill-Directory>/\n\
              SKILL.md\n\
              ...\n\
        ```\n\n\
        ---\n\n\
        ## 二、跨平台恢复对照表 / Cross-Platform Recovery Lookup Table\n\n\
        | 来源标识 (Source ID) | Windows 目标路径 | macOS / Linux 目标路径 | 读取工具 (Tools) | 说明与迁移建议 (Notes) |\n\
        | :--- | :--- | :--- | :--- | :--- |\n\
        | `claude-user` | `%USERPROFILE%\\.claude\\skills` | `~/.claude/skills` | Claude Code | 官方用户级目录，会话内即时生效 |\n\
        | `claude-synced` | `%USERPROFILE%\\.claude\\skills\\synced` | `~/.claude/skills/synced` | Claude Code | claude.ai 云端同步目录，新电脑登录自动同步，通常无需手动恢复 |\n\
        | `gemini-cli-user` | `%USERPROFILE%\\.gemini\\skills` | `~/.gemini/skills` | Gemini CLI | Gemini CLI 官方用户级首选目录 |\n\
        | `antigravity-user` | `%USERPROFILE%\\.gemini\\config\\skills` | `~/.gemini/config/skills` | Antigravity | Antigravity 官方首要全局目录 |\n\
        | `antigravity-legacy` | `%USERPROFILE%\\.gemini\\antigravity\\skills` | `~/.gemini/antigravity/skills` | Antigravity | 旧版兼容目录，建议恢复至 `antigravity-user` (`~/.gemini/config/skills`) |\n\
        | `antigravity-cli-user` | `%USERPROFILE%\\.gemini\\antigravity-cli\\skills` | `~/.gemini/antigravity-cli/skills` | Antigravity CLI | Antigravity CLI 命令行客户端专属全局目录 |\n\
        | `agents-user` | `%USERPROFILE%\\.agents\\skills` | `~/.agents/skills` | Codex, Gemini CLI | Agent Skills 开放规范目录，Codex 官方用户级目录 |\n\
        | `codex-legacy` | `%USERPROFILE%\\.codex\\skills` | `~/.codex/skills` | Codex | 旧版目录，建议恢复至 `agents-user` (`~/.agents/skills`) |\n\
        | `workspace-<名称>` | `<工作区根目录>\\.agents\\skills` | `<工作区根目录>/.agents/skills` | 项目级 AI 助手 | 恢复至对应项目仓库下的技能目录 |\n\n\
        ---\n\n\
        ## 三、手动恢复方法 / Manual Restore Instructions\n\n\
        1. 参照上表找到对应来源标识的目标路径。\n\
        2. 将 `skills/<来源标识>/` 下的文件夹整体复制到目标路径下即可。\n\
        3. 重启对应的 AI 客户端工具即可自动加载技能。\n\n\
        ---\n\n\
        ## 四、技能清单表 / Exported Skills Manifest\n\n\
        | 来源标识 (Source) | 技能目录名 (Directory) | Frontmatter 名称 | 描述 (Description) | 文件数 | 总大小 |\n\
        | :--- | :--- | :--- | :--- | :--- | :--- |\n",
        manifest.exported_at, manifest.app_version, manifest.format_version, manifest.skills.len()
    ));

    for s in &manifest.skills {
        let total_size: u64 = s.files.iter().map(|f| f.size).sum();
        out.push_str(&format!(
            "| `{}` | `{}` | {} | {} | {} | {} B |\n",
            s.source,
            s.directory_name,
            s.name,
            s.description.replace('|', "\\|"),
            s.files.len(),
            total_size
        ));
    }

    out.push_str("\n---\n\n## 五、完全重复副本对照表 / Identical Duplicate Copies\n\n");
    let mut by_hash: BTreeMap<&str, Vec<String>> = BTreeMap::new();
    for s in &manifest.skills {
        by_hash
            .entry(&s.content_hash)
            .or_default()
            .push(format!("{}/{}", s.source, s.directory_name));
    }
    let duplicates: Vec<(&&str, &Vec<String>)> =
        by_hash.iter().filter(|(_, list)| list.len() > 1).collect();
    if duplicates.is_empty() {
        out.push_str("未发现内容完全一致的重复技能副本 (No duplicate skill copies detected)。\n");
    } else {
        out.push_str(
            "| 综合哈希 (Content Hash) | 相同内容副本列表 (Identical Copies) | 说明 |\n\
             | :--- | :--- | :--- |\n",
        );
        for (hash, list) in duplicates {
            out.push_str(&format!(
                "| `{}` | {} | 这几份技能内容完全一致 |\n",
                hash,
                list.join(", ")
            ));
        }
    }
    out
}

pub const MAX_SINGLE_FILE_BYTES: u64 = 50 * 1024 * 1024; // 50MB
pub const MAX_PACK_TOTAL_BYTES: u64 = 2 * 1024 * 1024 * 1024; // 2GB

pub use crate::models::{
    ExcludedFileEntry, ExportPackSummary, FailedSkillEntry, ImportPackSummary, ImportSkillResult,
    ImportTargetOption, ManifestFileEntry, ManifestSkillEntry, SkillPackInspection,
    SkillPackManifest, SourceExportStats,
};

pub fn sha256_digest(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

pub fn infer_source_id_from_path(path: &Path, home: &Path, workspaces: &[PathBuf]) -> String {
    for ws in workspaces {
        if crate::paths::is_component_subpath(ws, path) {
            let name = ws.file_name().and_then(|n| n.to_str()).unwrap_or("project");
            return format!("workspace-{}", name);
        }
    }
    let claude_synced = home.join(".claude").join("skills").join("synced");
    if crate::paths::is_component_subpath(&claude_synced, path) {
        return "claude-synced".into();
    }
    let claude_user = home.join(".claude").join("skills");
    if crate::paths::is_component_subpath(&claude_user, path) {
        return "claude-user".into();
    }
    let ag_user = home.join(".gemini").join("config").join("skills");
    if crate::paths::is_component_subpath(&ag_user, path) {
        return "antigravity-user".into();
    }
    let ag_cli = home.join(".gemini").join("antigravity-cli").join("skills");
    if crate::paths::is_component_subpath(&ag_cli, path) {
        return "antigravity-cli-user".into();
    }
    let ag_legacy = home.join(".gemini").join("antigravity").join("skills");
    if crate::paths::is_component_subpath(&ag_legacy, path) {
        return "antigravity-legacy".into();
    }
    let gemini_cli = home.join(".gemini").join("skills");
    if crate::paths::is_component_subpath(&gemini_cli, path) {
        return "gemini-cli-user".into();
    }
    let agents_user = home.join(".agents").join("skills");
    if crate::paths::is_component_subpath(&agents_user, path) {
        return "agents-user".into();
    }
    let codex_legacy = home.join(".codex").join("skills");
    if crate::paths::is_component_subpath(&codex_legacy, path) {
        return "codex-legacy".into();
    }

    let s = path.to_string_lossy().to_lowercase().replace('\\', "/");
    if s.contains("/skills/synced/") || s.contains("/skills/synced") {
        "claude-synced".into()
    } else if s.contains("/.claude/skills") {
        "claude-user".into()
    } else if s.contains("/.gemini/config/skills") {
        "antigravity-user".into()
    } else if s.contains("/.gemini/antigravity-cli/skills") {
        "antigravity-cli-user".into()
    } else if s.contains("/.gemini/antigravity/skills") {
        "antigravity-legacy".into()
    } else if s.contains("/.gemini/skills") {
        "gemini-cli-user".into()
    } else if s.contains("/.agents/skills") {
        "agents-user".into()
    } else if s.contains("/.codex/skills") {
        "codex-legacy".into()
    } else {
        "claude-user".into()
    }
}

pub fn vault_home_dir() -> PathBuf {
    #[cfg(test)]
    {
        let d = crate::paths::skilldock_app_root().join("test_home");
        let _ = fs::create_dir_all(&d);
        d
    }
    #[cfg(not(test))]
    {
        let home = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_else(|_| ".".into());
        PathBuf::from(home)
    }
}

pub fn export_skill_pack_core(
    skill_paths: &[String],
    picker: impl FnOnce(&str) -> Option<PathBuf>,
) -> Result<Option<ExportPackSummary>, String> {
    let home = vault_home_dir();
    let (d, _) = crate::logging::get_current_datetime();
    let save_p = match picker(&format!("skillpack-{}.skillpack", d)) {
        Some(p) => p,
        None => return Ok(None),
    };
    let ws = crate::paths::load_authorized_workspaces(None);
    let res = export_skill_pack_to_path(skill_paths, &save_p, &home, &ws);
    crate::logging::log_command(
        "export_skill_pack",
        res.is_ok(),
        Some(&save_p.to_string_lossy()),
    );
    res.map(Some)
}

pub fn export_skill_folder_core(
    skill_paths: &[String],
    picker: impl FnOnce() -> Option<PathBuf>,
) -> Result<Option<ExportPackSummary>, String> {
    let home = vault_home_dir();
    let (d, _) = crate::logging::get_current_datetime();
    let target_dir = match picker() {
        Some(p) => resolve_export_folder_target(&p, &d)?,
        None => return Ok(None),
    };
    let ws = crate::paths::load_authorized_workspaces(None);
    let res = export_skill_folder_to_dir(skill_paths, &target_dir, &home, &ws);
    crate::logging::log_command(
        "export_skill_folder",
        res.is_ok(),
        Some(&target_dir.to_string_lossy()),
    );
    res.map(Some)
}

#[tauri::command]
pub fn export_skill_pack(
    app: tauri::AppHandle,
    skill_paths: Vec<String>,
) -> Result<Option<ExportPackSummary>, String> {
    export_skill_pack_core(&skill_paths, |name| {
        let f = app.dialog().file().set_file_name(name);
        f.add_filter("Skill Pack", &["skillpack", "zip"])
            .blocking_save_file()
            .and_then(|x| x.into_path().ok())
    })
}

#[tauri::command]
pub fn export_skill_folder(
    app: tauri::AppHandle,
    skill_paths: Vec<String>,
) -> Result<Option<ExportPackSummary>, String> {
    export_skill_folder_core(&skill_paths, || {
        app.dialog()
            .file()
            .blocking_pick_folder()
            .and_then(|x| x.into_path().ok())
    })
}

static LAST_INSPECTED_PACK: std::sync::Mutex<Option<PathBuf>> = std::sync::Mutex::new(None);

pub fn set_last_inspected_pack(path: PathBuf) {
    *LAST_INSPECTED_PACK.lock().unwrap() = Some(path);
}

pub fn get_last_inspected_pack() -> Option<PathBuf> {
    LAST_INSPECTED_PACK.lock().unwrap().clone()
}

pub fn inspect_skill_pack_core(
    pack_path: Option<String>,
    picker: impl FnOnce() -> Option<PathBuf>,
) -> Result<Option<SkillPackInspection>, String> {
    let file_p = match pack_path {
        Some(p) if !p.trim().is_empty() => PathBuf::from(p),
        _ => match picker() {
            Some(p) => p,
            None => return Ok(None),
        },
    };
    let res = inspect_skill_pack_file(&file_p);
    if res.is_ok() {
        set_last_inspected_pack(file_p.clone());
    }
    crate::logging::log_command(
        "inspect_skill_pack",
        res.is_ok(),
        Some(&file_p.to_string_lossy()),
    );
    res.map(Some)
}

#[tauri::command]
pub fn inspect_skill_pack(
    app: tauri::AppHandle,
    pack_path: Option<String>,
) -> Result<Option<SkillPackInspection>, String> {
    inspect_skill_pack_core(pack_path, || {
        let f = app.dialog().file();
        f.add_filter("Skill Pack", &["skillpack", "zip"])
            .blocking_pick_file()
            .and_then(|x| x.into_path().ok())
    })
}

#[tauri::command]
pub fn import_skill_pack(
    selected_skills: Vec<String>,
    targets: Vec<ImportTargetOption>,
) -> Result<ImportPackSummary, String> {
    let pack_path = get_last_inspected_pack()
        .ok_or_else(|| "尚未检查任何备份包，请先选择并检查备份包".to_string())?;
    let home = vault_home_dir();
    let res = import_skill_pack_internal(
        &pack_path,
        &selected_skills,
        &targets,
        &home,
        &crate::paths::load_authorized_workspaces(None),
        &crate::backup::default_backup_dir(),
    );
    let detail = res
        .as_ref()
        .map(|s| {
            format!(
                "imported: {}, skipped: {}, failed: {}",
                s.imported, s.skipped, s.failed
            )
        })
        .unwrap_or_else(|e| format!("import failed: {}", e));
    crate::logging::log_command("import_skill_pack", res.is_ok(), Some(&detail));
    res
}

#[cfg(test)]
#[path = "vault/tests_export.rs"]
mod tests_export;

#[cfg(test)]
#[path = "vault/tests_import.rs"]
mod tests_import;
