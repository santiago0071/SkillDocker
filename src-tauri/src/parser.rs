use std::fs;
use std::path::Path;

use crate::models::SkillMetaItem;

pub fn infer_category(name: &str, desc: &str, explicit: Option<&str>) -> String {
    if let Some(exp) = explicit {
        if exp == "safety" || exp == "workflow" || exp == "architecture" || exp == "custom" {
            return exp.to_string();
        }
    }
    let text = format!("{} {}", name, desc).to_lowercase();
    if text.contains("guard")
        || text.contains("safety")
        || text.contains("security")
        || text.contains("prevention")
        || text.contains("auditor")
        || text.contains("loss")
        || text.contains("cert")
        || text.contains("a11y")
    {
        return "safety".to_string();
    }
    if text.contains("workflow")
        || text.contains("pipeline")
        || text.contains("migrate")
        || text.contains("writing")
        || text.contains("planning")
        || text.contains("protocol")
        || text.contains("composer")
        || text.contains("dbt")
        || text.contains("airflow")
        || text.contains("troubleshoot")
        || text.contains("debug")
    {
        return "workflow".to_string();
    }
    if text.contains("sdk")
        || text.contains("framework")
        || text.contains("architecture")
        || text.contains("api")
        || text.contains("cloudflare")
        || text.contains("firebase")
        || text.contains("engine")
        || text.contains("storage")
        || text.contains("sql")
        || text.contains("bigquery")
        || text.contains("spark")
        || text.contains("byok")
        || text.contains("auth")
    {
        return "architecture".to_string();
    }
    "custom".to_string()
}

pub fn determine_read_by(skill_path: &Path, is_workspace: bool) -> Vec<String> {
    let s = skill_path
        .to_string_lossy()
        .to_lowercase()
        .replace('\\', "/");
    if s.contains("/.claude/skills") {
        vec!["claude-code".to_string()]
    } else if s.contains("/.gemini/config/skills")
        || s.contains("/.gemini/antigravity/skills")
        || (s.contains("/.agent/skills") && !s.contains("/.agents/skills"))
    {
        vec!["antigravity".to_string()]
    } else if s.contains("/.gemini/antigravity-cli/skills") {
        vec!["antigravity-cli".to_string()]
    } else if s.contains("/.gemini/skills") {
        vec!["gemini-cli".to_string()]
    } else if s.contains("/.codex/skills") {
        vec!["codex".to_string()]
    } else if s.contains("/.agents/skills") {
        if is_workspace {
            vec![
                "codex".to_string(),
                "gemini-cli".to_string(),
                "antigravity".to_string(),
            ]
        } else {
            vec!["codex".to_string(), "gemini-cli".to_string()]
        }
    } else {
        Vec::new()
    }
}

pub fn parse_skill_file(
    skill_path: &Path,
    default_name: &str,
    ecosystem: &str,
    source_dir: Option<&str>,
    is_legacy: bool,
    is_workspace: bool,
) -> Option<SkillMetaItem> {
    let content = fs::read_to_string(skill_path).ok()?;
    let mut name = default_name.to_string();
    let mut description = "Local Agent Skill".to_string();
    let mut explicit_category: Option<String> = None;
    let mut version = Some("1.0.0".to_string());
    let mut frontmatter_text = String::new();
    let mut body_text = content.clone();
    let mut has_frontmatter = false;

    let normalized = content.replace("\r\n", "\n");
    if let Some(rest) = normalized.strip_prefix("---\n") {
        if let Some(end_idx) = rest.find("\n---\n") {
            let fm_slice = &rest[..end_idx];
            frontmatter_text = fm_slice.to_string();
            body_text = rest[end_idx + 5..].to_string();
            has_frontmatter = true;

            for line in fm_slice.lines() {
                let trimmed = line.trim();
                if let Some(val) = trimmed.strip_prefix("name:") {
                    let cleaned = val.trim().trim_matches('"').trim_matches('\'').trim();
                    if !cleaned.is_empty() {
                        name = cleaned.to_string();
                    }
                } else if let Some(val) = trimmed.strip_prefix("description:") {
                    let cleaned = val.trim().trim_matches('"').trim_matches('\'').trim();
                    if !cleaned.is_empty() {
                        description = cleaned.to_string();
                    }
                } else if let Some(val) = trimmed.strip_prefix("category:") {
                    let cleaned = val.trim().trim_matches('"').trim_matches('\'').trim();
                    if !cleaned.is_empty() {
                        explicit_category = Some(cleaned.to_string());
                    }
                } else if let Some(val) = trimmed.strip_prefix("version:") {
                    let cleaned = val.trim().trim_matches('"').trim_matches('\'').trim();
                    if !cleaned.is_empty() {
                        version = Some(cleaned.to_string());
                    }
                }
            }
        }
    }

    let final_category = infer_category(&name, &description, explicit_category.as_deref());

    let id = match source_dir {
        Some(sd) => format!("{}::{}::{}", ecosystem, sd, default_name),
        None => format!("{}::{}", ecosystem, default_name),
    };

    let legacy_val = if is_legacy
        || skill_path
            .to_string_lossy()
            .to_lowercase()
            .replace('\\', "/")
            .contains("/.codex/skills")
    {
        Some(true)
    } else {
        None
    };

    let normalized_path = skill_path
        .to_string_lossy()
        .to_lowercase()
        .replace('\\', "/");
    let is_synced = normalized_path.contains("/.claude/skills/synced/");
    let (read_only_val, notice_val) = if is_synced {
        (
            Some(true),
            Some("该技能由 claude.ai 同步，请在 claude.ai 上修改".to_string()),
        )
    } else {
        (None, None)
    };

    let read_by = determine_read_by(skill_path, is_workspace);

    Some(SkillMetaItem {
        id,
        name,
        description,
        enabled: true,
        version,
        category: Some(final_category),
        tags: vec![ecosystem.to_string()],
        raw_path: skill_path.to_string_lossy().to_string(),
        ecosystem: Some(ecosystem.to_string()),
        source_dir: source_dir.map(|s| s.to_string()),
        legacy: legacy_val,
        is_legacy: legacy_val,
        read_only: read_only_val,
        read_only_notice: notice_val,
        read_by,
        frontmatter_text: Some(frontmatter_text),
        body_text: Some(body_text),
        raw_content: Some(content),
        has_frontmatter,
        source_id: None,
    })
}
