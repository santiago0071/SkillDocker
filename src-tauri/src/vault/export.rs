use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

use super::generate_readme;
use super::{
    infer_source_id_from_path, sha256_digest, MAX_PACK_TOTAL_BYTES, MAX_SINGLE_FILE_BYTES,
};
use crate::models::{
    ExcludedFileEntry, ExportPackSummary, FailedSkillEntry, ManifestFileEntry, ManifestSkillEntry,
    SkillPackManifest, SourceExportStats,
};

pub fn extract_name_and_desc(content: &str, default_name: &str) -> (String, String) {
    let mut name = default_name.to_string();
    let mut desc = "Local Agent Skill".to_string();
    let norm = content.replace("\r\n", "\n");
    if let Some(rest) = norm.strip_prefix("---\n") {
        if let Some(end_idx) = rest.find("\n---\n") {
            for line in rest[..end_idx].lines() {
                let trimmed = line.trim();
                if let Some(val) = trimmed.strip_prefix("name:") {
                    let cleaned = val.trim().trim_matches('"').trim_matches('\'').trim();
                    if !cleaned.is_empty() {
                        name = cleaned.to_string();
                    }
                } else if let Some(val) = trimmed.strip_prefix("description:") {
                    let cleaned = val.trim().trim_matches('"').trim_matches('\'').trim();
                    if !cleaned.is_empty() {
                        desc = cleaned.to_string();
                    }
                }
            }
        }
    }
    (name, desc)
}

pub fn collect_skill_files(
    dir: &Path,
    base: &Path,
    files: &mut Vec<(PathBuf, String, u64)>,
    cur_total: &mut u64,
    excluded: &mut Vec<ExcludedFileEntry>,
) -> Result<(), String> {
    if !dir.is_dir() {
        return Ok(());
    }
    for e in fs::read_dir(dir).map_err(|e| e.to_string())?.flatten() {
        let p = e.path();
        match fs::symlink_metadata(&p) {
            Ok(m) if m.file_type().is_symlink() => {
                excluded.push(ExcludedFileEntry {
                    path: p.to_string_lossy().to_string(),
                    reason: "Symbolic link skipped".into(),
                });
            }
            Ok(m) if m.is_dir() => {
                collect_skill_files(&p, base, files, cur_total, excluded)?;
            }
            Ok(m) if m.len() <= MAX_SINGLE_FILE_BYTES => {
                let size = m.len();
                if *cur_total + size > MAX_PACK_TOTAL_BYTES {
                    return Err("Total skill pack size exceeds 2GB limit".into());
                }
                *cur_total += size;
                let rel = p
                    .strip_prefix(base)
                    .map_err(|e| e.to_string())?
                    .to_string_lossy()
                    .replace('\\', "/");
                files.push((p, rel, size));
            }
            Ok(m) => {
                excluded.push(ExcludedFileEntry {
                    path: p.to_string_lossy().to_string(),
                    reason: format!("File size ({} bytes) exceeds 50MB limit", m.len()),
                });
            }
            Err(e) => {
                excluded.push(ExcludedFileEntry {
                    path: p.to_string_lossy().to_string(),
                    reason: format!("Cannot read file metadata: {}", e),
                });
            }
        }
    }
    Ok(())
}

pub fn compute_skill_content_hash(files: &[ManifestFileEntry]) -> String {
    let mut sorted = files.to_vec();
    sorted.sort_by(|a, b| a.path.cmp(&b.path));
    let mut hasher = Sha256::new();
    for f in sorted {
        hasher.update(f.path.as_bytes());
        hasher.update(f.sha256.as_bytes());
    }
    format!("{:x}", hasher.finalize())
}

pub struct PreparedSkillData {
    pub manifest_entry: ManifestSkillEntry,
    pub files: Vec<(String, Vec<u8>)>,
}

pub fn prepare_skills_export_data(
    skill_paths: &[String],
    home_dir: &Path,
    workspaces: &[PathBuf],
    excluded_files: &mut Vec<ExcludedFileEntry>,
    failed_skills: &mut Vec<FailedSkillEntry>,
) -> Vec<PreparedSkillData> {
    let mut prepared = Vec::new();
    let mut total_bytes: u64 = 0;

    for sp in skill_paths {
        let norm_path = match crate::paths::resolve_safe_path_internal(sp, home_dir, workspaces) {
            Ok(p) => p,
            Err(e) => {
                failed_skills.push(FailedSkillEntry {
                    path: sp.clone(),
                    reason: e,
                });
                continue;
            }
        };

        let skill_dir = match norm_path.parent() {
            Some(d) if d.is_dir() => d,
            _ => {
                failed_skills.push(FailedSkillEntry {
                    path: sp.clone(),
                    reason: "Directory does not exist".into(),
                });
                continue;
            }
        };

        let dir_name = skill_dir
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("skill")
            .to_string();
        let name_non_conforming = crate::skills::validate_skill_name(&dir_name).is_err();
        let source = infer_source_id_from_path(&norm_path, home_dir, workspaces);

        let content = match fs::read_to_string(&norm_path) {
            Ok(c) => c,
            Err(e) => {
                failed_skills.push(FailedSkillEntry {
                    path: norm_path.to_string_lossy().to_string(),
                    reason: format!("Cannot read SKILL.md: {}", e),
                });
                continue;
            }
        };
        let (name, description) = extract_name_and_desc(&content, &dir_name);

        let mut collected = Vec::new();
        if let Err(e) = collect_skill_files(
            skill_dir,
            skill_dir,
            &mut collected,
            &mut total_bytes,
            excluded_files,
        ) {
            failed_skills.push(FailedSkillEntry {
                path: skill_dir.to_string_lossy().to_string(),
                reason: e,
            });
            continue;
        }

        let mut manifest_files = Vec::new();
        let mut skill_payloads = Vec::new();

        for (abs, rel, size) in collected {
            match fs::read(&abs) {
                Ok(bytes) => {
                    let hash = sha256_digest(&bytes);
                    manifest_files.push(ManifestFileEntry {
                        path: rel.clone(),
                        sha256: hash,
                        size,
                    });
                    skill_payloads.push((rel, bytes));
                }
                Err(e) => {
                    excluded_files.push(ExcludedFileEntry {
                        path: abs.to_string_lossy().to_string(),
                        reason: format!("Cannot read file: {}", e),
                    });
                }
            }
        }

        let content_hash = compute_skill_content_hash(&manifest_files);
        prepared.push(PreparedSkillData {
            manifest_entry: ManifestSkillEntry {
                source,
                directory_name: dir_name,
                name,
                description,
                name_non_conforming,
                source_dir: skill_dir.to_string_lossy().to_string(),
                content_hash,
                files: manifest_files,
            },
            files: skill_payloads,
        });
    }
    prepared
}

pub fn build_source_stats(skills: &[ManifestSkillEntry]) -> Vec<SourceExportStats> {
    let mut map: BTreeMap<String, (usize, usize, u64)> = BTreeMap::new();
    for s in skills {
        let entry = map.entry(s.source.clone()).or_insert((0, 0, 0));
        entry.0 += 1;
        entry.1 += s.files.len();
        entry.2 += s.files.iter().map(|f| f.size).sum::<u64>();
    }
    map.into_iter()
        .map(
            |(source, (skills_count, files_count, total_bytes))| SourceExportStats {
                source,
                skills_count,
                files_count,
                total_bytes,
            },
        )
        .collect()
}

pub fn verify_exported_zip(zip_path: &Path, manifest: &SkillPackManifest) -> Result<(), String> {
    let f = File::open(zip_path).map_err(|e| e.to_string())?;
    let mut zip = ZipArchive::new(f).map_err(|e| e.to_string())?;

    for s in &manifest.skills {
        for f in &s.files {
            let entry_name = format!("skills/{}/{}/{}", s.source, s.directory_name, f.path);
            let mut zf = zip
                .by_name(&entry_name)
                .map_err(|_| format!("Missing zip entry '{}'", entry_name))?;
            let mut bytes = Vec::new();
            zf.read_to_end(&mut bytes).map_err(|e| e.to_string())?;
            if bytes.len() as u64 != f.size {
                return Err(format!("Size mismatch in '{}'", entry_name));
            }
            if sha256_digest(&bytes) != f.sha256 {
                return Err(format!("SHA-256 mismatch in '{}'", entry_name));
            }
        }
    }
    zip.by_name("README.md")
        .map_err(|_| "README.md missing in zip".to_string())?;
    zip.by_name("manifest.json")
        .map_err(|_| "manifest.json missing in zip".to_string())?;
    Ok(())
}

pub fn verify_exported_folder(
    folder_path: &Path,
    manifest: &SkillPackManifest,
) -> Result<(), String> {
    if !folder_path.join("README.md").exists() {
        return Err("README.md missing in folder".into());
    }
    if !folder_path.join("manifest.json").exists() {
        return Err("manifest.json missing in folder".into());
    }
    for s in &manifest.skills {
        for f in &s.files {
            let p = folder_path
                .join("skills")
                .join(&s.source)
                .join(&s.directory_name)
                .join(&f.path);
            let bytes =
                fs::read(&p).map_err(|e| format!("Cannot read '{}': {}", p.display(), e))?;
            if bytes.len() as u64 != f.size {
                return Err(format!("Size mismatch in '{}'", p.display()));
            }
            if sha256_digest(&bytes) != f.sha256 {
                return Err(format!("SHA-256 mismatch in '{}'", p.display()));
            }
        }
    }
    Ok(())
}

pub fn export_skill_pack_to_path(
    skill_paths: &[String],
    dest: &Path,
    home: &Path,
    ws: &[PathBuf],
) -> Result<ExportPackSummary, String> {
    if let Some(p) = dest.parent() {
        let _ = fs::create_dir_all(p);
    }
    let f = File::create(dest).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(f);
    let opt = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    let (_, time_str) = crate::logging::get_current_datetime();

    let mut excluded = Vec::new();
    let mut failed = Vec::new();
    let prepared = prepare_skills_export_data(skill_paths, home, ws, &mut excluded, &mut failed);

    let mut manifest_skills = Vec::new();
    for item in prepared {
        for (rel, bytes) in item.files {
            let path_in_zip = format!(
                "skills/{}/{}/{}",
                item.manifest_entry.source, item.manifest_entry.directory_name, rel
            );
            zip.start_file(path_in_zip, opt)
                .map_err(|e| e.to_string())?;
            zip.write_all(&bytes).map_err(|e| e.to_string())?;
        }
        manifest_skills.push(item.manifest_entry);
    }

    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: time_str,
        app_version: env!("CARGO_PKG_VERSION").into(),
        skills: manifest_skills,
        excluded_files: excluded,
        failed_skills: failed,
    };

    let readme_text = generate_readme(&manifest);
    zip.start_file("README.md", opt)
        .map_err(|e| e.to_string())?;
    zip.write_all(readme_text.as_bytes())
        .map_err(|e| e.to_string())?;

    let json_bytes = serde_json::to_vec_pretty(&manifest).map_err(|e| e.to_string())?;
    zip.start_file("manifest.json", opt)
        .map_err(|e| e.to_string())?;
    zip.write_all(&json_bytes).map_err(|e| e.to_string())?;
    zip.finish().map_err(|e| e.to_string())?;

    if let Err(e) = verify_exported_zip(dest, &manifest) {
        let _ = fs::remove_file(dest);
        return Err(format!("Export verification failed: {}", e));
    }

    let by_source = build_source_stats(&manifest.skills);
    let (tot_f, tot_b) = manifest.skills.iter().fold((0, 0u64), |(fc, bc), s| {
        (
            fc + s.files.len(),
            bc + s.files.iter().map(|f| f.size).sum::<u64>(),
        )
    });

    Ok(ExportPackSummary {
        output_path: dest.to_string_lossy().to_string(),
        format_version: manifest.format_version,
        exported_at: manifest.exported_at,
        total_skills: manifest.skills.len(),
        total_files: tot_f,
        total_bytes: tot_b,
        by_source,
        excluded_files: manifest.excluded_files,
        failed_skills: manifest.failed_skills,
        verified: true,
    })
}

pub fn resolve_export_folder_target(picked_dir: &Path, date_str: &str) -> Result<PathBuf, String> {
    let is_empty = match fs::read_dir(picked_dir) {
        Ok(mut entries) => entries.next().is_none(),
        Err(e) => return Err(format!("Cannot read picked directory: {}", e)),
    };
    if is_empty {
        Ok(picked_dir.to_path_buf())
    } else {
        let sub = picked_dir.join(format!("skillpack-{}", date_str));
        if !sub.exists() {
            fs::create_dir_all(&sub).map_err(|e| e.to_string())?;
            Ok(sub)
        } else {
            let ts = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let sub_ts = picked_dir.join(format!("skillpack-{}-{}", date_str, ts));
            fs::create_dir_all(&sub_ts).map_err(|e| e.to_string())?;
            Ok(sub_ts)
        }
    }
}

pub fn export_skill_folder_to_dir(
    skill_paths: &[String],
    dest: &Path,
    home: &Path,
    ws: &[PathBuf],
) -> Result<ExportPackSummary, String> {
    let (_, time_str) = crate::logging::get_current_datetime();
    let mut excluded = Vec::new();
    let mut failed = Vec::new();
    let prepared = prepare_skills_export_data(skill_paths, home, ws, &mut excluded, &mut failed);

    let mut manifest_skills = Vec::new();
    for item in prepared {
        for (rel, bytes) in item.files {
            let out_p = dest
                .join("skills")
                .join(&item.manifest_entry.source)
                .join(&item.manifest_entry.directory_name)
                .join(&rel);
            if let Some(p) = out_p.parent() {
                fs::create_dir_all(p).map_err(|e| e.to_string())?;
            }
            fs::write(&out_p, &bytes).map_err(|e| e.to_string())?;
        }
        manifest_skills.push(item.manifest_entry);
    }

    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: time_str,
        app_version: env!("CARGO_PKG_VERSION").into(),
        skills: manifest_skills,
        excluded_files: excluded,
        failed_skills: failed,
    };

    let readme_text = generate_readme(&manifest);
    fs::write(dest.join("README.md"), readme_text).map_err(|e| e.to_string())?;

    let json_bytes = serde_json::to_vec_pretty(&manifest).map_err(|e| e.to_string())?;
    fs::write(dest.join("manifest.json"), json_bytes).map_err(|e| e.to_string())?;

    if let Err(e) = verify_exported_folder(dest, &manifest) {
        let _ = fs::remove_dir_all(dest);
        return Err(format!("Export verification failed: {}", e));
    }

    let by_source = build_source_stats(&manifest.skills);
    let (tot_f, tot_b) = manifest.skills.iter().fold((0, 0u64), |(fc, bc), s| {
        (
            fc + s.files.len(),
            bc + s.files.iter().map(|f| f.size).sum::<u64>(),
        )
    });

    Ok(ExportPackSummary {
        output_path: dest.to_string_lossy().to_string(),
        format_version: manifest.format_version,
        exported_at: manifest.exported_at,
        total_skills: manifest.skills.len(),
        total_files: tot_f,
        total_bytes: tot_b,
        by_source,
        excluded_files: manifest.excluded_files,
        failed_skills: manifest.failed_skills,
        verified: true,
    })
}
