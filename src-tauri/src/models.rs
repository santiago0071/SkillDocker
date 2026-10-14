use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SkillMetaItem {
    pub id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub version: Option<String>,
    pub category: Option<String>,
    pub tags: Vec<String>,
    #[serde(rename = "rawPath")]
    pub raw_path: String,
    pub ecosystem: Option<String>,
    #[serde(rename = "sourceDir")]
    pub source_dir: Option<String>,
    #[serde(rename = "legacy", skip_serializing_if = "Option::is_none")]
    pub legacy: Option<bool>,
    #[serde(rename = "isLegacy", skip_serializing_if = "Option::is_none")]
    pub is_legacy: Option<bool>,
    #[serde(
        rename = "readOnly",
        alias = "read_only",
        skip_serializing_if = "Option::is_none"
    )]
    pub read_only: Option<bool>,
    #[serde(
        rename = "readOnlyNotice",
        alias = "read_only_notice",
        skip_serializing_if = "Option::is_none"
    )]
    pub read_only_notice: Option<String>,
    #[serde(rename = "readBy", alias = "read_by", default)]
    pub read_by: Vec<String>,
    #[serde(rename = "frontmatterText")]
    pub frontmatter_text: Option<String>,
    #[serde(rename = "bodyText")]
    pub body_text: Option<String>,
    #[serde(rename = "rawContent")]
    pub raw_content: Option<String>,
    #[serde(rename = "hasFrontmatter")]
    pub has_frontmatter: bool,
    #[serde(rename = "sourceId", skip_serializing_if = "Option::is_none")]
    pub source_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub success: bool,
    pub skills: Vec<SkillMetaItem>,
    #[serde(rename = "liveDirectives")]
    pub live_directives: Vec<serde_json::Value>,
    #[serde(rename = "consolidatedRules")]
    pub consolidated_rules: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExcludedFileEntry {
    pub path: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailedSkillEntry {
    pub path: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestFileEntry {
    pub path: String,
    pub sha256: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestSkillEntry {
    pub source: String,
    #[serde(rename = "directoryName")]
    pub directory_name: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "nameNonConforming", default)]
    pub name_non_conforming: bool,
    #[serde(rename = "sourceDir")]
    pub source_dir: String,
    #[serde(rename = "contentHash")]
    pub content_hash: String,
    pub files: Vec<ManifestFileEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillPackManifest {
    #[serde(rename = "formatVersion")]
    pub format_version: String,
    #[serde(rename = "exportedAt")]
    pub exported_at: String,
    #[serde(rename = "appVersion")]
    pub app_version: String,
    pub skills: Vec<ManifestSkillEntry>,
    #[serde(rename = "excludedFiles", default)]
    pub excluded_files: Vec<ExcludedFileEntry>,
    #[serde(rename = "failedSkills", default)]
    pub failed_skills: Vec<FailedSkillEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceExportStats {
    pub source: String,
    #[serde(rename = "skillsCount")]
    pub skills_count: usize,
    #[serde(rename = "filesCount")]
    pub files_count: usize,
    #[serde(rename = "totalBytes")]
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportPackSummary {
    #[serde(rename = "outputPath")]
    pub output_path: String,
    #[serde(rename = "formatVersion")]
    pub format_version: String,
    #[serde(rename = "exportedAt")]
    pub exported_at: String,
    #[serde(rename = "totalSkills")]
    pub total_skills: usize,
    #[serde(rename = "totalFiles")]
    pub total_files: usize,
    #[serde(rename = "totalBytes")]
    pub total_bytes: u64,
    #[serde(rename = "bySource")]
    pub by_source: Vec<SourceExportStats>,
    #[serde(rename = "excludedFiles")]
    pub excluded_files: Vec<ExcludedFileEntry>,
    #[serde(rename = "failedSkills")]
    pub failed_skills: Vec<FailedSkillEntry>,
    pub verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillPackInspection {
    #[serde(rename = "packPath")]
    pub pack_path: String,
    #[serde(rename = "formatVersion")]
    pub format_version: String,
    #[serde(rename = "exportedAt")]
    pub exported_at: String,
    #[serde(rename = "appVersion")]
    pub app_version: String,
    #[serde(rename = "totalSkills")]
    pub total_skills: usize,
    #[serde(rename = "totalFiles")]
    pub total_files: usize,
    #[serde(rename = "totalBytes")]
    pub total_bytes: u64,
    pub skills: Vec<ManifestSkillEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportTargetOption {
    #[serde(alias = "skill_name", rename = "skillName")]
    pub skill_name: String,
    #[serde(alias = "target_ecosystem", rename = "targetEcosystem")]
    pub target_ecosystem: String,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportSkillResult {
    pub name: String,
    pub status: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportPackSummary {
    pub total: usize,
    pub imported: usize,
    pub skipped: usize,
    pub failed: usize,
    pub results: Vec<ImportSkillResult>,
}
