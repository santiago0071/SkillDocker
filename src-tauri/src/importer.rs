//! Read-only discovery of existing agent rule files (CLAUDE.md, AGENTS.md, .cursorrules, ...)
//! for the first-run import wizard. Only a fixed allowlist of well-known file names is read,
//! under the user's home directory and the authorized workspaces. Nothing is ever written here.

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

const MAX_FILE_BYTES: u64 = 512 * 1024;
const MAX_DIR_ENTRIES: usize = 200;

#[derive(Debug, Serialize, Clone)]
pub struct RuleSource {
    pub path: String,
    /// claude | codex | gemini | cursor | windsurf | copilot
    pub tool: String,
    /// global | workspace
    pub scope: String,
    pub workspace: Option<String>,
    #[serde(rename = "relativePath")]
    pub relative_path: String,
    #[serde(rename = "sizeBytes")]
    pub size_bytes: u64,
    pub content: String,
    pub truncated: bool,
}

fn read_source(
    path: &Path,
    tool: &str,
    scope: &str,
    workspace: Option<&Path>,
    rel: &str,
) -> Option<RuleSource> {
    let meta = fs::metadata(path).ok()?;
    if !meta.is_file() || meta.len() == 0 {
        return None;
    }
    let truncated = meta.len() > MAX_FILE_BYTES;
    let content = if truncated {
        let bytes = fs::read(path).ok()?;
        String::from_utf8_lossy(&bytes[..MAX_FILE_BYTES as usize]).to_string()
    } else {
        fs::read_to_string(path).ok()?
    };
    if content.trim().is_empty() {
        return None;
    }
    Some(RuleSource {
        path: path.to_string_lossy().to_string(),
        tool: tool.to_string(),
        scope: scope.to_string(),
        workspace: workspace.map(|w| w.to_string_lossy().to_string()),
        relative_path: rel.to_string(),
        size_bytes: meta.len(),
        content,
        truncated,
    })
}

/// Lists files with the given extension directly inside `dir` (non-recursive), sorted by name.
fn list_dir_files(dir: &Path, ext: &str) -> Vec<PathBuf> {
    let mut out: Vec<PathBuf> = match fs::read_dir(dir) {
        Ok(entries) => entries
            .flatten()
            .map(|e| e.path())
            .filter(|p| p.is_file() && p.extension().and_then(|e| e.to_str()) == Some(ext))
            .take(MAX_DIR_ENTRIES)
            .collect(),
        Err(_) => Vec::new(),
    };
    out.sort();
    out
}

pub fn discover_in(home: &Path, workspaces: &[PathBuf]) -> Vec<RuleSource> {
    let mut found = Vec::new();

    let global_files: [(&str, &[&str]); 4] = [
        ("claude", &[".claude", "CLAUDE.md"]),
        ("codex", &[".codex", "AGENTS.md"]),
        ("gemini", &[".gemini", "GEMINI.md"]),
        (
            "windsurf",
            &[".codeium", "windsurf", "memories", "global_rules.md"],
        ),
    ];
    for (tool, parts) in global_files.iter() {
        let p = parts
            .iter()
            .fold(home.to_path_buf(), |acc, part| acc.join(part));
        let rel = format!("~/{}", parts.join("/"));
        if let Some(s) = read_source(&p, tool, "global", None, &rel) {
            found.push(s);
        }
    }

    let workspace_files: [(&str, &str); 9] = [
        ("claude", "CLAUDE.md"),
        ("claude", ".claude/CLAUDE.md"),
        ("claude", "CLAUDE.local.md"),
        ("codex", "AGENTS.md"),
        ("gemini", "GEMINI.md"),
        ("cursor", ".cursorrules"),
        ("windsurf", ".windsurfrules"),
        ("copilot", ".github/copilot-instructions.md"),
        ("gemini", ".gemini/GEMINI.md"),
    ];
    let workspace_dirs: [(&str, &str, &str); 2] = [
        ("cursor", ".cursor/rules", "mdc"),
        ("windsurf", ".windsurf/rules", "md"),
    ];

    for ws in workspaces {
        if !ws.is_dir() {
            continue;
        }
        for (tool, rel) in workspace_files.iter() {
            let p = rel.split('/').fold(ws.clone(), |acc, part| acc.join(part));
            if let Some(s) = read_source(&p, tool, "workspace", Some(ws), rel) {
                found.push(s);
            }
        }
        for (tool, rel_dir, ext) in workspace_dirs.iter() {
            let dir = rel_dir
                .split('/')
                .fold(ws.clone(), |acc, part| acc.join(part));
            for p in list_dir_files(&dir, ext) {
                let file_name = p.file_name().and_then(|n| n.to_str()).unwrap_or("rule");
                let rel = format!("{}/{}", rel_dir, file_name);
                if let Some(s) = read_source(&p, tool, "workspace", Some(ws), &rel) {
                    found.push(s);
                }
            }
        }
    }

    found
}

#[cfg(test)]
#[path = "importer/tests.rs"]
mod tests;
