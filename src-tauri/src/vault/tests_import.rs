use super::*;
use std::fs::File;
use std::io::Write;
use tempfile::tempdir;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

#[test]
fn test_vault_import_conflict_skip_vs_overwrite_with_backup() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let backup_dir = home.join(".skilldock").join("backups");
    let claude_hub = home.join(".claude").join("skills");
    let skill_dir = claude_hub.join("my-agent");
    fs::create_dir_all(&skill_dir).unwrap();
    fs::write(skill_dir.join("SKILL.md"), "Original local v1").unwrap();

    let pack_path = temp.path().join("update.skillpack");
    let file = File::create(&pack_path).unwrap();
    let mut zip = ZipWriter::new(file);
    let opt = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: "2026-10-11 12:00:00".into(),
        app_version: "0.1.0".into(),
        skills: vec![ManifestSkillEntry {
            source: "claude-user".into(),
            directory_name: "my-agent".into(),
            name: "my-agent".into(),
            description: "Desc".into(),
            name_non_conforming: false,
            source_dir: "/orig".into(),
            content_hash: "hash".into(),
            files: vec![ManifestFileEntry {
                path: "SKILL.md".into(),
                sha256: sha256_digest(b"New incoming v2"),
                size: b"New incoming v2".len() as u64,
            }],
        }],
        excluded_files: vec![],
        failed_skills: vec![],
    };
    zip.start_file("manifest.json", opt).unwrap();
    zip.write_all(&serde_json::to_vec(&manifest).unwrap())
        .unwrap();
    zip.start_file("skills/claude-user/my-agent/SKILL.md", opt)
        .unwrap();
    zip.write_all(b"New incoming v2").unwrap();
    zip.finish().unwrap();

    let targets_skip = vec![ImportTargetOption {
        skill_name: "my-agent".into(),
        target_ecosystem: "claude-user".into(),
        overwrite: false,
    }];
    let res_skip = import_skill_pack_internal(
        &pack_path,
        &["my-agent".into()],
        &targets_skip,
        &home,
        &[],
        &backup_dir,
    )
    .unwrap();
    assert_eq!(res_skip.skipped, 1);
    assert_eq!(
        fs::read_to_string(skill_dir.join("SKILL.md")).unwrap(),
        "Original local v1"
    );

    let targets_overwrite = vec![ImportTargetOption {
        skill_name: "my-agent".into(),
        target_ecosystem: "claude-user".into(),
        overwrite: true,
    }];
    let res_over = import_skill_pack_internal(
        &pack_path,
        &["my-agent".into()],
        &targets_overwrite,
        &home,
        &[],
        &backup_dir,
    )
    .unwrap();
    assert_eq!(res_over.imported, 1);
    assert_eq!(
        fs::read_to_string(skill_dir.join("SKILL.md")).unwrap(),
        "New incoming v2"
    );

    let replaced_dir = backup_dir.join("replaced");
    let backups: Vec<_> = fs::read_dir(&replaced_dir).unwrap().flatten().collect();
    assert!(!backups.is_empty());
    let replaced_skill = &backups[0].path();
    assert!(replaced_skill
        .file_name()
        .unwrap()
        .to_string_lossy()
        .starts_with("my-agent-"));
    assert_eq!(
        fs::read_to_string(replaced_skill.join("SKILL.md")).unwrap(),
        "Original local v1"
    );
}

#[test]
fn test_vault_zip_slip_and_synced_directory_defense() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let backup_dir = home.join(".skilldock").join("backups");
    let pack_path = temp.path().join("malicious.skillpack");

    let file = File::create(&pack_path).unwrap();
    let mut zip = ZipWriter::new(file);
    let opt = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: "2026-10-11 12:00:00".into(),
        app_version: "0.1.0".into(),
        skills: vec![ManifestSkillEntry {
            source: "claude-user".into(),
            directory_name: "slip-agent".into(),
            name: "slip-agent".into(),
            description: "Evil".into(),
            name_non_conforming: false,
            source_dir: "/evil".into(),
            content_hash: "hash".into(),
            files: vec![ManifestFileEntry {
                path: "../../../escaped.txt".into(),
                sha256: sha256_digest(b"pwned"),
                size: 5,
            }],
        }],
        excluded_files: vec![],
        failed_skills: vec![],
    };
    zip.start_file("manifest.json", opt).unwrap();
    zip.write_all(&serde_json::to_vec(&manifest).unwrap())
        .unwrap();
    zip.start_file("skills/claude-user/slip-agent/../../../escaped.txt", opt)
        .unwrap();
    zip.write_all(b"pwned").unwrap();
    zip.finish().unwrap();

    let targets = vec![ImportTargetOption {
        skill_name: "slip-agent".into(),
        target_ecosystem: "claude-user".into(),
        overwrite: false,
    }];

    let res = import_skill_pack_internal(
        &pack_path,
        &["slip-agent".into()],
        &targets,
        &home,
        &[],
        &backup_dir,
    )
    .unwrap();
    assert_eq!(res.failed, 1);
    assert_eq!(res.imported, 0);
    assert!(res.results[0].message.contains("Zip Slip rejected"));

    assert!(!home.join("escaped.txt").exists());

    let synced_res = resolve_import_hub_target(".claude/synced", &home, &[]);
    assert!(synced_res.is_err());
    assert!(synced_res
        .unwrap_err()
        .contains("Cannot import into .claude/synced"));

    let sys_res = resolve_import_hub_target("C:/Windows/System32", &home, &[]);
    assert!(sys_res.is_err());
}

#[test]
fn test_vault_import_transactional_rollback_on_failure() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let backup_dir = home.join(".skilldock").join("backups");
    let claude_hub = home.join(".claude").join("skills");
    let skill_dir = claude_hub.join("fault-agent");
    fs::create_dir_all(&skill_dir.join("sub")).unwrap();

    let orig_md = "--- name: fault-agent --- original content";
    let orig_helper = "print('original python script')";
    fs::write(skill_dir.join("SKILL.md"), orig_md).unwrap();
    fs::write(skill_dir.join("sub").join("helper.py"), orig_helper).unwrap();

    let pack_path = temp.path().join("corrupted.skillpack");
    let file = File::create(&pack_path).unwrap();
    let mut zip = ZipWriter::new(file);
    let opt = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: "2026-10-11 12:00:00".into(),
        app_version: "0.1.0".into(),
        skills: vec![ManifestSkillEntry {
            source: "claude-user".into(),
            directory_name: "fault-agent".into(),
            name: "fault-agent".into(),
            description: "Faulty".into(),
            name_non_conforming: false,
            source_dir: "/orig".into(),
            content_hash: "hash".into(),
            files: vec![
                ManifestFileEntry {
                    path: "SKILL.md".into(),
                    sha256: sha256_digest(b"New incoming SKILL"),
                    size: b"New incoming SKILL".len() as u64,
                },
                ManifestFileEntry {
                    path: "sub/helper.py".into(),
                    sha256: "0000000000000000000000000000000000000000000000000000000000000000"
                        .into(),
                    size: b"Different python".len() as u64,
                },
            ],
        }],
        excluded_files: vec![],
        failed_skills: vec![],
    };
    zip.start_file("manifest.json", opt).unwrap();
    zip.write_all(&serde_json::to_vec(&manifest).unwrap())
        .unwrap();
    zip.start_file("skills/claude-user/fault-agent/SKILL.md", opt)
        .unwrap();
    zip.write_all(b"New incoming SKILL").unwrap();
    zip.start_file("skills/claude-user/fault-agent/sub/helper.py", opt)
        .unwrap();
    zip.write_all(b"Different python").unwrap();
    zip.finish().unwrap();

    let targets = vec![ImportTargetOption {
        skill_name: "fault-agent".into(),
        target_ecosystem: "claude-user".into(),
        overwrite: true,
    }];
    let res = import_skill_pack_internal(
        &pack_path,
        &["fault-agent".into()],
        &targets,
        &home,
        &[],
        &backup_dir,
    )
    .unwrap();

    assert_eq!(res.failed, 1);
    assert_eq!(res.imported, 0);
    assert!(res.results[0].message.contains("SHA-256 mismatch"));

    assert_eq!(
        fs::read_to_string(skill_dir.join("SKILL.md")).unwrap(),
        orig_md
    );
    assert_eq!(
        fs::read_to_string(skill_dir.join("sub").join("helper.py")).unwrap(),
        orig_helper
    );
}

#[test]
fn test_vault_import_success_backup_in_replaced_dir() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let backup_dir = home.join(".skilldock").join("backups");
    let claude_hub = home.join(".claude").join("skills");
    let skill_dir = claude_hub.join("replaced-agent");
    fs::create_dir_all(&skill_dir.join("scripts")).unwrap();

    fs::write(skill_dir.join("SKILL.md"), "Old v1 SKILL").unwrap();
    fs::write(
        skill_dir.join("scripts").join("tool.py"),
        "print('old tool')",
    )
    .unwrap();

    let pack_path = temp.path().join("valid_replace.skillpack");
    let file = File::create(&pack_path).unwrap();
    let mut zip = ZipWriter::new(file);
    let opt = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: "2026-10-11 12:00:00".into(),
        app_version: "0.1.0".into(),
        skills: vec![ManifestSkillEntry {
            source: "claude-user".into(),
            directory_name: "replaced-agent".into(),
            name: "replaced-agent".into(),
            description: "Replaced".into(),
            name_non_conforming: false,
            source_dir: "/orig".into(),
            content_hash: "hash".into(),
            files: vec![
                ManifestFileEntry {
                    path: "SKILL.md".into(),
                    sha256: sha256_digest(b"New v2 SKILL"),
                    size: b"New v2 SKILL".len() as u64,
                },
                ManifestFileEntry {
                    path: "scripts/tool.py".into(),
                    sha256: sha256_digest(b"print('new tool')"),
                    size: b"print('new tool')".len() as u64,
                },
            ],
        }],
        excluded_files: vec![],
        failed_skills: vec![],
    };
    zip.start_file("manifest.json", opt).unwrap();
    zip.write_all(&serde_json::to_vec(&manifest).unwrap())
        .unwrap();
    zip.start_file("skills/claude-user/replaced-agent/SKILL.md", opt)
        .unwrap();
    zip.write_all(b"New v2 SKILL").unwrap();
    zip.start_file("skills/claude-user/replaced-agent/scripts/tool.py", opt)
        .unwrap();
    zip.write_all(b"print('new tool')").unwrap();
    zip.finish().unwrap();

    let targets = vec![ImportTargetOption {
        skill_name: "replaced-agent".into(),
        target_ecosystem: "claude-user".into(),
        overwrite: true,
    }];
    let res = import_skill_pack_internal(
        &pack_path,
        &["replaced-agent".into()],
        &targets,
        &home,
        &[],
        &backup_dir,
    )
    .unwrap();

    assert_eq!(res.imported, 1);
    assert_eq!(
        fs::read_to_string(skill_dir.join("SKILL.md")).unwrap(),
        "New v2 SKILL"
    );
    assert_eq!(
        fs::read_to_string(skill_dir.join("scripts").join("tool.py")).unwrap(),
        "print('new tool')"
    );

    let replaced_root = backup_dir.join("replaced");
    assert!(replaced_root.exists());
    let entries: Vec<_> = fs::read_dir(&replaced_root).unwrap().flatten().collect();
    assert_eq!(entries.len(), 1);
    let backed_dir = entries[0].path();
    assert!(backed_dir
        .file_name()
        .unwrap()
        .to_string_lossy()
        .starts_with("replaced-agent-"));
    assert_eq!(
        fs::read_to_string(backed_dir.join("SKILL.md")).unwrap(),
        "Old v1 SKILL"
    );
    assert_eq!(
        fs::read_to_string(backed_dir.join("scripts").join("tool.py")).unwrap(),
        "print('old tool')"
    );
}

#[test]
fn test_vault_import_restore_to_different_home_machine() {
    let temp = tempdir().unwrap();
    let old_home = temp.path().join("old_machine_home");
    let new_home = temp.path().join("new_machine_home");
    let backup_dir = new_home.join(".skilldock").join("backups");

    let pack_path = temp.path().join("migration.skillpack");
    let file = File::create(&pack_path).unwrap();
    let mut zip = ZipWriter::new(file);
    let opt = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: "2026-10-11 12:00:00".into(),
        app_version: "0.1.0".into(),
        skills: vec![
            ManifestSkillEntry {
                source: "claude-user".into(),
                directory_name: "claude-skill".into(),
                name: "claude-skill".into(),
                description: "Claude".into(),
                name_non_conforming: false,
                source_dir: "/old/claude".into(),
                content_hash: "hash1".into(),
                files: vec![ManifestFileEntry {
                    path: "SKILL.md".into(),
                    sha256: sha256_digest(b"Claude skill content"),
                    size: b"Claude skill content".len() as u64,
                }],
            },
            ManifestSkillEntry {
                source: "gemini-cli-user".into(),
                directory_name: "gemini-skill".into(),
                name: "gemini-skill".into(),
                description: "Gemini".into(),
                name_non_conforming: false,
                source_dir: "/old/gemini".into(),
                content_hash: "hash2".into(),
                files: vec![ManifestFileEntry {
                    path: "SKILL.md".into(),
                    sha256: sha256_digest(b"Gemini skill content"),
                    size: b"Gemini skill content".len() as u64,
                }],
            },
        ],
        excluded_files: vec![],
        failed_skills: vec![],
    };
    zip.start_file("manifest.json", opt).unwrap();
    zip.write_all(&serde_json::to_vec(&manifest).unwrap())
        .unwrap();
    zip.start_file("skills/claude-user/claude-skill/SKILL.md", opt)
        .unwrap();
    zip.write_all(b"Claude skill content").unwrap();
    zip.start_file("skills/gemini-cli-user/gemini-skill/SKILL.md", opt)
        .unwrap();
    zip.write_all(b"Gemini skill content").unwrap();
    zip.finish().unwrap();

    let res =
        import_skill_pack_internal(&pack_path, &[], &[], &new_home, &[], &backup_dir).unwrap();

    assert_eq!(res.imported, 2);
    let target1 = new_home
        .join(".claude")
        .join("skills")
        .join("claude-skill")
        .join("SKILL.md");
    let target2 = new_home
        .join(".gemini")
        .join("skills")
        .join("gemini-skill")
        .join("SKILL.md");
    assert!(target1.exists());
    assert!(target2.exists());
    assert_eq!(fs::read_to_string(target1).unwrap(), "Claude skill content");
    assert_eq!(fs::read_to_string(target2).unwrap(), "Gemini skill content");
    assert!(!old_home.exists());
}

#[test]
fn test_vault_import_target_rejections_and_workspace_bounds() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let ws_dir = temp.path().join("authorized_repo");
    fs::create_dir_all(&ws_dir).unwrap();

    assert!(resolve_import_hub_target("C:/Windows/System32", &home, &[]).is_err());
    assert!(resolve_import_hub_target("/usr/local/bin", &home, &[]).is_err());
    assert!(resolve_import_hub_target("../../../outside", &home, &[]).is_err());
    assert!(resolve_import_hub_target("arbitrary_folder", &home, &[]).is_err());
    assert!(resolve_import_hub_target("claude-synced", &home, &[]).is_err());
    assert!(resolve_import_hub_target(".claude/synced", &home, &[]).is_err());

    let ws_target =
        resolve_import_hub_target("workspace-authorized_repo", &home, &[ws_dir.clone()]).unwrap();
    assert_eq!(ws_target, ws_dir.join(".agents").join("skills"));
    assert_ne!(ws_target, ws_dir);

    assert!(resolve_import_hub_target("workspace-unknown_project", &home, &[ws_dir]).is_err());
}

#[test]
fn test_vault_import_legacy_default_destinations_and_v2_rejection() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let backup_dir = home.join(".skilldock").join("backups");

    let legacy_pack = temp.path().join("legacy.skillpack");
    let file = File::create(&legacy_pack).unwrap();
    let mut zip = ZipWriter::new(file);
    let opt = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: "2026-10-11 12:00:00".into(),
        app_version: "0.1.0".into(),
        skills: vec![
            ManifestSkillEntry {
                source: "codex-legacy".into(),
                directory_name: "legacy-codex".into(),
                name: "legacy-codex".into(),
                description: "Codex".into(),
                name_non_conforming: false,
                source_dir: "/old".into(),
                content_hash: "h1".into(),
                files: vec![ManifestFileEntry {
                    path: "SKILL.md".into(),
                    sha256: sha256_digest(b"codex body"),
                    size: b"codex body".len() as u64,
                }],
            },
            ManifestSkillEntry {
                source: "antigravity-legacy".into(),
                directory_name: "legacy-ag".into(),
                name: "legacy-ag".into(),
                description: "AG".into(),
                name_non_conforming: false,
                source_dir: "/old".into(),
                content_hash: "h2".into(),
                files: vec![ManifestFileEntry {
                    path: "SKILL.md".into(),
                    sha256: sha256_digest(b"ag body"),
                    size: b"ag body".len() as u64,
                }],
            },
        ],
        excluded_files: vec![],
        failed_skills: vec![],
    };
    zip.start_file("manifest.json", opt).unwrap();
    zip.write_all(&serde_json::to_vec(&manifest).unwrap())
        .unwrap();
    zip.start_file("skills/codex-legacy/legacy-codex/SKILL.md", opt)
        .unwrap();
    zip.write_all(b"codex body").unwrap();
    zip.start_file("skills/antigravity-legacy/legacy-ag/SKILL.md", opt)
        .unwrap();
    zip.write_all(b"ag body").unwrap();
    zip.finish().unwrap();

    let res = import_skill_pack_internal(&legacy_pack, &[], &[], &home, &[], &backup_dir).unwrap();
    assert_eq!(res.imported, 2);

    let codex_restored = home
        .join(".agents")
        .join("skills")
        .join("legacy-codex")
        .join("SKILL.md");
    let ag_restored = home
        .join(".gemini")
        .join("config")
        .join("skills")
        .join("legacy-ag")
        .join("SKILL.md");
    assert!(codex_restored.exists());
    assert!(ag_restored.exists());

    let v2_pack = temp.path().join("v2.skillpack");
    let file2 = File::create(&v2_pack).unwrap();
    let mut zip2 = ZipWriter::new(file2);
    let v2_manifest = serde_json::json!({
        "format_version": "2.0",
        "exported_at": "2026-10-10 10:00:00",
        "app_version": "0.1.0",
        "skills": []
    });
    zip2.start_file("manifest.json", opt).unwrap();
    zip2.write_all(&serde_json::to_vec(&v2_manifest).unwrap())
        .unwrap();
    zip2.finish().unwrap();

    let inspect_err = inspect_skill_pack_file(&v2_pack).unwrap_err();
    assert!(inspect_err.contains("不支持的旧格式备份包 (v2.0)"));
}
