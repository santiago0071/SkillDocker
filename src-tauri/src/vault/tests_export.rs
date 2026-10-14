use super::*;
use std::fs::File;
use std::io::Write;
use tempfile::tempdir;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

#[test]
fn test_vault_v3_export_and_inspect_fidelity() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let claude_hub = home.join(".claude").join("skills");
    let gemini_hub = home.join(".gemini").join("skills");

    let skill1_dir = claude_hub.join("code-reviewer");
    let skill2_dir = gemini_hub.join("doc-writer");
    fs::create_dir_all(&skill1_dir.join("scripts")).unwrap();
    fs::create_dir_all(&skill1_dir.join("references")).unwrap();
    fs::create_dir_all(&skill2_dir).unwrap();

    let s1_md = skill1_dir.join("SKILL.md");
    let s1_py = skill1_dir.join("scripts").join("run.py");
    let s1_ref = skill1_dir.join("references").join("guide.txt");
    let s2_md = skill2_dir.join("SKILL.md");

    fs::write(
        &s1_md,
        "---\nname: code-reviewer\ndescription: Review code safely\n---\nBody 1",
    )
    .unwrap();
    fs::write(&s1_py, "print('hello python')").unwrap();
    fs::write(&s1_ref, "reference documentation guide").unwrap();
    fs::write(
        &s2_md,
        "---\nname: doc-writer\ndescription: Write docs\n---\nBody 2",
    )
    .unwrap();

    let pack_path = temp.path().join("test.skillpack");
    let skill_paths = vec![
        s1_md.to_string_lossy().to_string(),
        s2_md.to_string_lossy().to_string(),
    ];

    let summary = export_skill_pack_to_path(&skill_paths, &pack_path, &home, &[]).unwrap();
    assert_eq!(summary.format_version, "3.0");
    assert_eq!(summary.total_skills, 2);
    assert_eq!(summary.total_files, 4);
    assert!(summary.verified);

    let inspection = inspect_skill_pack_file(&pack_path).unwrap();
    assert_eq!(inspection.total_skills, 2);
    assert_eq!(inspection.total_files, 4);
    assert_eq!(inspection.format_version, "3.0");

    let sk1 = inspection
        .skills
        .iter()
        .find(|s| s.directory_name == "code-reviewer")
        .unwrap();
    assert_eq!(sk1.files.len(), 3);
    assert_eq!(sk1.source, "claude-user");
    assert_eq!(sk1.description, "Review code safely");

    let py_entry = sk1
        .files
        .iter()
        .find(|f| f.path == "scripts/run.py")
        .unwrap();
    assert_eq!(py_entry.sha256, sha256_digest(b"print('hello python')"));
    assert_eq!(py_entry.size, b"print('hello python')".len() as u64);
}

#[test]
fn test_vault_two_identical_skill_names_in_different_sources() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let claude_hub = home.join(".claude").join("skills");
    let ag_hub = home.join(".gemini").join("config").join("skills");

    let skill_c = claude_hub.join("weather-tool");
    let skill_ag = ag_hub.join("weather-tool");
    fs::create_dir_all(&skill_c).unwrap();
    fs::create_dir_all(&ag_hub.join("weather-tool")).unwrap();

    let s1_md = skill_c.join("SKILL.md");
    let s2_md = skill_ag.join("SKILL.md");
    fs::write(&s1_md, "---\nname: weather-tool\n---\nClaude weather").unwrap();
    fs::write(&s2_md, "---\nname: weather-tool\n---\nAG weather").unwrap();

    let pack_path = temp.path().join("dups.skillpack");
    let skill_paths = vec![
        s1_md.to_string_lossy().to_string(),
        s2_md.to_string_lossy().to_string(),
    ];

    let summary = export_skill_pack_to_path(&skill_paths, &pack_path, &home, &[]).unwrap();
    assert_eq!(summary.total_skills, 2);

    let inspection = inspect_skill_pack_file(&pack_path).unwrap();
    assert_eq!(inspection.skills.len(), 2);
    assert_eq!(inspection.skills[0].directory_name, "weather-tool");
    assert_eq!(inspection.skills[1].directory_name, "weather-tool");
    assert_ne!(inspection.skills[0].source, inspection.skills[1].source);

    let f = File::open(&pack_path).unwrap();
    let mut zip = ZipArchive::new(f).unwrap();
    assert!(zip
        .by_name("skills/claude-user/weather-tool/SKILL.md")
        .is_ok());
    assert!(zip
        .by_name("skills/antigravity-user/weather-tool/SKILL.md")
        .is_ok());
}

#[test]
fn test_vault_non_conforming_name_exported_and_flagged() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let bad_dir = home.join(".claude").join("skills").join("Bad_Name_Tool!");
    fs::create_dir_all(&bad_dir).unwrap();
    let bad_md = bad_dir.join("SKILL.md");
    fs::write(&bad_md, "---\nname: Custom Name\n---\nBody").unwrap();

    let pack_path = temp.path().join("bad.skillpack");
    let summary = export_skill_pack_to_path(
        &[bad_md.to_string_lossy().to_string()],
        &pack_path,
        &home,
        &[],
    )
    .unwrap();
    assert_eq!(summary.total_skills, 1);

    let inspection = inspect_skill_pack_file(&pack_path).unwrap();
    let s = &inspection.skills[0];
    assert_eq!(s.directory_name, "Bad_Name_Tool!");
    assert!(s.name_non_conforming);
}

#[test]
fn test_vault_oversized_file_and_symlink_in_excluded_files() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let skill_dir = home.join(".claude").join("skills").join("large-agent");
    fs::create_dir_all(&skill_dir).unwrap();
    let skill_md = skill_dir.join("SKILL.md");
    fs::write(&skill_md, "---\nname: large-agent\n---\nBody").unwrap();

    let mut excluded = Vec::new();
    excluded.push(ExcludedFileEntry {
        path: skill_dir.join("giant.zip").to_string_lossy().to_string(),
        reason: "File size (52428801 bytes) exceeds 50MB limit".into(),
    });
    excluded.push(ExcludedFileEntry {
        path: skill_dir.join("link.txt").to_string_lossy().to_string(),
        reason: "Symbolic link skipped".into(),
    });

    assert_eq!(excluded.len(), 2);
    assert!(excluded[0].reason.contains("50MB limit"));
    assert!(excluded[1].reason.contains("Symbolic link"));

    let mut cur_total: u64 = 2 * 1024 * 1024 * 1024;
    let mut files = Vec::new();
    let res = collect_skill_files(
        &skill_dir,
        &skill_dir,
        &mut files,
        &mut cur_total,
        &mut excluded,
    );
    assert!(res.is_err());
    assert!(res.unwrap_err().contains("2GB limit"));
}

#[test]
fn test_vault_failed_skills_resilience() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let good_dir = home.join(".claude").join("skills").join("good-skill");
    fs::create_dir_all(&good_dir).unwrap();
    let good_md = good_dir.join("SKILL.md");
    fs::write(&good_md, "---\nname: good-skill\n---\nGood").unwrap();

    let invalid_path = "C:/Windows/System32/fake/SKILL.md".to_string();
    let pack_path = temp.path().join("partial.skillpack");

    let summary = export_skill_pack_to_path(
        &[invalid_path.clone(), good_md.to_string_lossy().to_string()],
        &pack_path,
        &home,
        &[],
    )
    .unwrap();

    assert_eq!(summary.total_skills, 1);
    assert_eq!(summary.failed_skills.len(), 1);
    assert_eq!(summary.failed_skills[0].path, invalid_path);
}

#[test]
fn test_vault_post_export_tamper_verification() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let s_dir = home.join(".claude").join("skills").join("tamper-check");
    fs::create_dir_all(&s_dir).unwrap();
    let s_md = s_dir.join("SKILL.md");
    fs::write(&s_md, "---\nname: tamper-check\n---\nOriginal bytes").unwrap();

    let pack_path = temp.path().join("tampered.skillpack");
    let mut zip_writer = ZipWriter::new(File::create(&pack_path).unwrap());
    let opt = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: "2026-10-11 10:00:00".into(),
        app_version: "0.1.0".into(),
        skills: vec![ManifestSkillEntry {
            source: "claude-user".into(),
            directory_name: "tamper-check".into(),
            name: "tamper-check".into(),
            description: "test".into(),
            name_non_conforming: false,
            source_dir: s_dir.to_string_lossy().to_string(),
            content_hash: "abcd".into(),
            files: vec![ManifestFileEntry {
                path: "SKILL.md".into(),
                sha256: sha256_digest(b"Original bytes"),
                size: b"Original bytes".len() as u64,
            }],
        }],
        excluded_files: vec![],
        failed_skills: vec![],
    };

    zip_writer.start_file("README.md", opt).unwrap();
    zip_writer.write_all(b"readme").unwrap();
    zip_writer.start_file("manifest.json", opt).unwrap();
    zip_writer
        .write_all(&serde_json::to_vec(&manifest).unwrap())
        .unwrap();
    zip_writer
        .start_file("skills/claude-user/tamper-check/SKILL.md", opt)
        .unwrap();
    zip_writer.write_all(b"Original byteX").unwrap();
    zip_writer.finish().unwrap();

    let verify_res = verify_exported_zip(&pack_path, &manifest);
    assert!(verify_res.is_err());
    assert!(verify_res.unwrap_err().contains("SHA-256 mismatch"));

    let (n_full, d_full) =
        extract_name_and_desc("---\nname: my-n\ndescription: my-d\n---\nbody", "def");
    assert_eq!(n_full, "my-n");
    assert_eq!(d_full, "my-d");

    let (n_empty, d_empty) =
        extract_name_and_desc("---\nname: ''\ndescription: ''\n---\nbody", "def");
    assert_eq!(n_empty, "def");
    assert_eq!(d_empty, "Local Agent Skill");

    let empty_f = temp.path().join("empty_folder_err");
    fs::create_dir_all(&empty_f).unwrap();
    assert!(verify_exported_folder(&empty_f, &manifest).is_err());
    fs::write(empty_f.join("README.md"), "readme").unwrap();
    assert!(verify_exported_folder(&empty_f, &manifest).is_err());
    fs::write(empty_f.join("manifest.json"), "{}").unwrap();

    let skill_f = empty_f
        .join("skills")
        .join("claude-user")
        .join("tamper-check");
    fs::create_dir_all(&skill_f).unwrap();
    fs::write(skill_f.join("SKILL.md"), "Wrong size bytes!").unwrap();
    let folder_res = verify_exported_folder(&empty_f, &manifest);
    assert!(folder_res.is_err());
    assert!(folder_res.unwrap_err().contains("Size mismatch"));
}

#[test]
fn test_vault_folder_export_byte_fidelity_and_non_empty_dir() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let s_dir = home.join(".claude").join("skills").join("fidelity-test");
    fs::create_dir_all(&s_dir).unwrap();
    let s_md = s_dir.join("SKILL.md");
    fs::write(&s_md, "---\nname: fidelity-test\n---\nExact same content").unwrap();

    let out_dir = temp.path().join("out_folder");
    fs::create_dir_all(&out_dir).unwrap();

    let target_sub = resolve_export_folder_target(&out_dir, "2026-10-11").unwrap();
    assert_eq!(target_sub, out_dir);

    fs::write(out_dir.join("existing.txt"), "hello").unwrap();
    let target_sub2 = resolve_export_folder_target(&out_dir, "2026-10-11").unwrap();
    assert_ne!(target_sub2, out_dir);
    assert!(target_sub2
        .to_string_lossy()
        .contains("skillpack-2026-10-11"));

    let summary = export_skill_folder_to_dir(
        &[s_md.to_string_lossy().to_string()],
        &target_sub2,
        &home,
        &[],
    )
    .unwrap();
    assert!(summary.verified);
    assert!(target_sub2.join("README.md").exists());
    assert!(target_sub2.join("manifest.json").exists());
    assert!(target_sub2
        .join("skills/claude-user/fidelity-test/SKILL.md")
        .exists());
}

#[test]
fn test_vault_readme_lookup_table_and_duplicate_hashes() {
    let manifest = SkillPackManifest {
        format_version: "3.0".into(),
        exported_at: "2026-10-11 10:00:00".into(),
        app_version: "0.1.0".into(),
        skills: vec![
            ManifestSkillEntry {
                source: "claude-user".into(),
                directory_name: "copy-a".into(),
                name: "copy-a".into(),
                description: "Sample desc 1".into(),
                name_non_conforming: false,
                source_dir: "/a".into(),
                content_hash: "hash123".into(),
                files: vec![ManifestFileEntry {
                    path: "SKILL.md".into(),
                    sha256: "h1".into(),
                    size: 10,
                }],
            },
            ManifestSkillEntry {
                source: "antigravity-user".into(),
                directory_name: "copy-b".into(),
                name: "copy-b".into(),
                description: "Sample desc 2".into(),
                name_non_conforming: false,
                source_dir: "/b".into(),
                content_hash: "hash123".into(),
                files: vec![ManifestFileEntry {
                    path: "SKILL.md".into(),
                    sha256: "h1".into(),
                    size: 10,
                }],
            },
        ],
        excluded_files: vec![],
        failed_skills: vec![],
    };

    let readme = generate_readme(&manifest);
    assert!(readme.contains("claude-user"));
    assert!(readme.contains("claude-synced"));
    assert!(readme.contains("gemini-cli-user"));
    assert!(readme.contains("antigravity-user"));
    assert!(readme.contains("antigravity-legacy"));
    assert!(readme.contains("antigravity-cli-user"));
    assert!(readme.contains("agents-user"));
    assert!(readme.contains("codex-legacy"));
    assert!(readme.contains("workspace-"));
    assert!(readme.contains("copy-a"));
    assert!(readme.contains("copy-b"));
    assert!(readme.contains("hash123"));
    assert!(readme.contains("这几份技能内容完全一致"));
}

#[test]
fn test_vault_standard_zip_archive_manual_restore() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let s_dir = home.join(".claude").join("skills").join("portable-agent");
    fs::create_dir_all(&s_dir).unwrap();
    let s_md = s_dir.join("SKILL.md");
    fs::write(&s_md, "---\nname: portable-agent\n---\nPortable body").unwrap();

    let pack_path = temp.path().join("manual.zip");
    export_skill_pack_to_path(
        &[s_md.to_string_lossy().to_string()],
        &pack_path,
        &home,
        &[],
    )
    .unwrap();

    let restore_dest = temp.path().join("restored_home");
    fs::create_dir_all(&restore_dest).unwrap();

    let file = File::open(&pack_path).unwrap();
    let mut archive = ZipArchive::new(file).unwrap();
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).unwrap();
        let outpath = restore_dest.join(file.name());
        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath).unwrap();
        } else {
            if let Some(p) = outpath.parent() {
                fs::create_dir_all(p).unwrap();
            }
            let mut outfile = File::create(&outpath).unwrap();
            std::io::copy(&mut file, &mut outfile).unwrap();
        }
    }

    let restored_file = restore_dest
        .join("skills")
        .join("claude-user")
        .join("portable-agent")
        .join("SKILL.md");
    assert_eq!(
        fs::read_to_string(restored_file).unwrap(),
        "---\nname: portable-agent\n---\nPortable body"
    );
}

#[test]
fn test_vault_command_wrappers_and_source_id_inference() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let ws_dir = temp.path().join("my-project");
    fs::create_dir_all(&ws_dir).unwrap();

    assert_eq!(
        infer_source_id_from_path(&ws_dir.join("SKILL.md"), &home, &[ws_dir.clone()]),
        "workspace-my-project"
    );
    assert_eq!(
        infer_source_id_from_path(
            &home
                .join(".claude")
                .join("skills")
                .join("synced")
                .join("a")
                .join("SKILL.md"),
            &home,
            &[]
        ),
        "claude-synced"
    );
    assert_eq!(
        infer_source_id_from_path(
            &home
                .join(".claude")
                .join("skills")
                .join("a")
                .join("SKILL.md"),
            &home,
            &[]
        ),
        "claude-user"
    );
    assert_eq!(
        infer_source_id_from_path(
            &home
                .join(".gemini")
                .join("config")
                .join("skills")
                .join("a")
                .join("SKILL.md"),
            &home,
            &[]
        ),
        "antigravity-user"
    );
    assert_eq!(
        infer_source_id_from_path(
            &home
                .join(".gemini")
                .join("antigravity-cli")
                .join("skills")
                .join("a")
                .join("SKILL.md"),
            &home,
            &[]
        ),
        "antigravity-cli-user"
    );
    assert_eq!(
        infer_source_id_from_path(
            &home
                .join(".gemini")
                .join("antigravity")
                .join("skills")
                .join("a")
                .join("SKILL.md"),
            &home,
            &[]
        ),
        "antigravity-legacy"
    );
    assert_eq!(
        infer_source_id_from_path(
            &home
                .join(".gemini")
                .join("skills")
                .join("a")
                .join("SKILL.md"),
            &home,
            &[]
        ),
        "gemini-cli-user"
    );
    assert_eq!(
        infer_source_id_from_path(
            &home
                .join(".agents")
                .join("skills")
                .join("a")
                .join("SKILL.md"),
            &home,
            &[]
        ),
        "agents-user"
    );
    assert_eq!(
        infer_source_id_from_path(
            &home
                .join(".codex")
                .join("skills")
                .join("a")
                .join("SKILL.md"),
            &home,
            &[]
        ),
        "codex-legacy"
    );

    assert_eq!(
        infer_source_id_from_path(Path::new("C:/custom/skills/synced/SKILL.md"), &home, &[]),
        "claude-synced"
    );
    assert_eq!(
        infer_source_id_from_path(Path::new("C:/other/.claude/skills/SKILL.md"), &home, &[]),
        "claude-user"
    );
    assert_eq!(
        infer_source_id_from_path(
            Path::new("C:/other/.gemini/config/skills/SKILL.md"),
            &home,
            &[]
        ),
        "antigravity-user"
    );
    assert_eq!(
        infer_source_id_from_path(
            Path::new("C:/other/.gemini/antigravity-cli/skills/SKILL.md"),
            &home,
            &[]
        ),
        "antigravity-cli-user"
    );
    assert_eq!(
        infer_source_id_from_path(
            Path::new("C:/other/.gemini/antigravity/skills/SKILL.md"),
            &home,
            &[]
        ),
        "antigravity-legacy"
    );
    assert_eq!(
        infer_source_id_from_path(Path::new("C:/other/.gemini/skills/SKILL.md"), &home, &[]),
        "gemini-cli-user"
    );
    assert_eq!(
        infer_source_id_from_path(Path::new("C:/other/.agents/skills/SKILL.md"), &home, &[]),
        "agents-user"
    );
    assert_eq!(
        infer_source_id_from_path(Path::new("C:/other/.codex/skills/SKILL.md"), &home, &[]),
        "codex-legacy"
    );
    assert_eq!(
        infer_source_id_from_path(Path::new("C:/unknown/SKILL.md"), &home, &[]),
        "claude-user"
    );

    let v_home = vault_home_dir();
    let s_dir = v_home.join(".claude").join("skills").join("wrapper-skill");
    fs::create_dir_all(&s_dir).unwrap();
    let s_md = s_dir.join("SKILL.md");
    fs::write(&s_md, "---\nname: wrapper-skill\n---\nHello").unwrap();

    assert!(export_skill_pack_core(&[], |_| None).unwrap().is_none());
    let pack_p = temp.path().join("wrap.skillpack");
    let exp_res = export_skill_pack_core(&[s_md.to_string_lossy().to_string()], |_| {
        Some(pack_p.clone())
    })
    .unwrap();
    assert!(exp_res.is_some());

    assert!(export_skill_folder_core(&[], || None).unwrap().is_none());
    let folder_out = temp.path().join("wrap_folder");
    fs::create_dir_all(&folder_out).unwrap();
    let f_res = export_skill_folder_core(&[s_md.to_string_lossy().to_string()], || {
        Some(folder_out.clone())
    })
    .unwrap();
    assert!(f_res.is_some());

    assert!(inspect_skill_pack_core(None, || None).unwrap().is_none());
    assert!(inspect_skill_pack_core(None, || Some(pack_p.clone()))
        .unwrap()
        .is_some());
    assert!(
        inspect_skill_pack_core(Some(pack_p.to_string_lossy().to_string()), || None)
            .unwrap()
            .is_some()
    );

    fs::remove_dir_all(&s_dir).unwrap();
    set_last_inspected_pack(pack_p.clone());
    let imp_res = import_skill_pack(vec![], vec![]);
    assert!(imp_res.is_ok());
    assert_eq!(imp_res.unwrap().imported, 1);
    assert!(s_md.exists());
}
