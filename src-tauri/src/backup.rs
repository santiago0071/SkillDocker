use std::fs;
use std::path::{Path, PathBuf};

pub fn get_backup_prefix_for_path(p: &Path) -> String {
    use sha2::{Digest, Sha256};
    let normalized_str = p.to_string_lossy().to_lowercase().replace('\\', "/");
    let clean_str = normalized_str
        .trim_start_matches("//?/")
        .trim_start_matches("\\\\?\\");
    let mut hasher = Sha256::new();
    hasher.update(clean_str.as_bytes());
    let hash_hex = format!("{:x}", hasher.finalize());
    let hash_8 = &hash_hex[..8];

    let parent_dir = p
        .parent()
        .and_then(|parent| parent.file_name())
        .and_then(|n| n.to_str())
        .unwrap_or("skill");

    format!("{}-{}-", parent_dir, hash_8)
}

pub fn purge_old_backups(backup_dir: &Path, file_prefix: &str, max_keep: usize) {
    if let Ok(entries) = fs::read_dir(backup_dir) {
        let mut backups: Vec<(std::time::SystemTime, PathBuf)> = entries
            .flatten()
            .filter_map(|e| {
                let name = e.file_name().to_string_lossy().to_string();
                if name.starts_with(file_prefix) && name.ends_with(".bak") {
                    let meta = e.metadata().ok()?;
                    let modified = meta.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH);
                    Some((modified, e.path()))
                } else {
                    None
                }
            })
            .collect();

        if backups.len() > max_keep {
            backups.sort_by_key(|b| b.0);
            let to_remove = backups.len() - max_keep;
            for (_, path) in backups.into_iter().take(to_remove) {
                let _ = fs::remove_file(path);
            }
        }
    }
}

pub fn default_backup_dir() -> PathBuf {
    crate::paths::skilldock_app_root().join("backups")
}

pub fn migrate_legacy_backups(backup_dir: &Path) -> usize {
    if !backup_dir.exists() {
        return 0;
    }

    let entries = match fs::read_dir(backup_dir) {
        Ok(e) => e,
        Err(_) => return 0,
    };

    let mut legacy_files = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("SKILL.md-") && name.ends_with(".bak") {
                legacy_files.push((path, name));
            }
        }
    }

    if legacy_files.is_empty() {
        return 0;
    }

    let legacy_dir = backup_dir.join("legacy");
    if let Err(e) = fs::create_dir_all(&legacy_dir) {
        crate::logging::log_command(
            "migrate_legacy_backups",
            false,
            Some(&format!("Failed to create legacy backup dir: {}", e)),
        );
        return 0;
    }

    let mut moved_count = 0;
    for (src_path, name) in legacy_files {
        let dest_path = legacy_dir.join(name);
        let moved = if fs::rename(&src_path, &dest_path).is_ok() {
            true
        } else if fs::copy(&src_path, &dest_path).is_ok() {
            let _ = fs::remove_file(&src_path);
            true
        } else {
            false
        };
        if moved {
            moved_count += 1;
        }
    }

    crate::logging::log_command(
        "migrate_legacy_backups",
        true,
        Some(&format!(
            "Migrated {} legacy backup file(s) to legacy/",
            moved_count
        )),
    );

    moved_count
}

#[cfg(test)]
#[path = "backup/tests.rs"]
mod tests;
