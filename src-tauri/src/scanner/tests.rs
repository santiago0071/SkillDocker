use super::*;
use crate::paths::{is_dir_safe_internal, is_path_safe_internal};
use crate::skills::{
    create_new_skill_internal, rollback_skill_file_internal, save_skill_file_internal,
    validate_skill_name,
};
use tempfile::tempdir;

#[test]
fn test_scan_all_skills_comprehensive_sources() {
    let temp = tempdir().unwrap();
    let fake_home = temp.path().join("home");
    let fake_workspace = temp.path().join("workspace");
    fs::create_dir_all(&fake_home).unwrap();
    fs::create_dir_all(&fake_workspace).unwrap();

    let write_skill = |dir: &Path, name: &str, desc: &str| {
        fs::create_dir_all(dir).unwrap();
        let skill_file = dir.join("SKILL.md");
        let content = format!(
            "---\nname: {}\ndescription: {}\ncategory: workflow\n---\n\n# Instructions\n1. Do task\n",
            name, desc
        );
        fs::write(&skill_file, content).unwrap();
        skill_file
    };

    // 1. User-level hubs
    let u1 = fake_home
        .join(".gemini")
        .join("config")
        .join("skills")
        .join("skill-gemini-cfg");
    write_skill(&u1, "skill-gemini-cfg", "Gemini config skill");

    let u2 = fake_home
        .join(".gemini")
        .join("skills")
        .join("skill-gemini-cli");
    write_skill(&u2, "skill-gemini-cli", "Gemini CLI skill");

    let u3 = fake_home
        .join(".gemini")
        .join("antigravity")
        .join("skills")
        .join("skill-antigravity-rt");
    write_skill(&u3, "skill-antigravity-rt", "Antigravity runtime skill");

    let u4 = fake_home
        .join(".claude")
        .join("skills")
        .join("skill-claude-user");
    write_skill(&u4, "skill-claude-user", "Claude user skill");

    let u5 = fake_home
        .join(".codex")
        .join("skills")
        .join("skill-codex-user");
    write_skill(&u5, "skill-codex-user", "Codex user skill");

    let u6 = fake_home
        .join(".codex")
        .join("skills")
        .join(".system")
        .join("skill-codex-sys");
    write_skill(&u6, "skill-codex-sys", "Codex system skill");

    let u7 = fake_home
        .join(".agents")
        .join("skills")
        .join("skill-agents-std");
    write_skill(&u7, "skill-agents-std", "Agents standard skill");

    let u8 = fake_home
        .join(".gemini")
        .join("antigravity-cli")
        .join("skills")
        .join("skill-antigravity-cli");
    write_skill(&u8, "skill-antigravity-cli", "Antigravity CLI skill");

    // Duplicate name across two user hubs to verify NO deduplication/merging
    let dup_u1 = fake_home
        .join(".claude")
        .join("skills")
        .join("duplicate-skill");
    write_skill(&dup_u1, "duplicate-skill", "Claude version of duplicate");

    let dup_u2 = fake_home
        .join(".gemini")
        .join("skills")
        .join("duplicate-skill");
    write_skill(&dup_u2, "duplicate-skill", "Gemini version of duplicate");

    // 2. Workspace-level hubs
    let w1 = fake_workspace
        .join(".claude")
        .join("skills")
        .join("skill-claude-ws");
    write_skill(&w1, "skill-claude-ws", "Claude workspace skill");

    let w2 = fake_workspace
        .join(".gemini")
        .join("skills")
        .join("skill-gemini-ws");
    write_skill(&w2, "skill-gemini-ws", "Gemini workspace skill");

    let w3 = fake_workspace
        .join(".codex")
        .join("skills")
        .join("skill-codex-ws");
    write_skill(&w3, "skill-codex-ws", "Codex workspace skill");

    let w4 = fake_workspace
        .join(".agents")
        .join("skills")
        .join("skill-agents-ws");
    write_skill(&w4, "skill-agents-ws", "Agents workspace skill");

    let w5 = fake_workspace
        .join(".agent")
        .join("skills")
        .join("skill-agent-ws");
    write_skill(&w5, "skill-agent-ws", "Antigravity agent workspace skill");

    // Run scanner
    let scan_res =
        scan_all_skills_internal(Some(&fake_home), Some(&[fake_workspace.clone()])).unwrap();
    assert!(scan_res.success);

    // Expected 8 distinct user + 2 duplicates + 5 workspace = 15 total skills
    assert_eq!(
        scan_res.skills.len(),
        15,
        "Must discover all 15 skills across all user and workspace hubs"
    );

    // Verify duplicate-skill appears twice with distinct sources and distinct IDs
    let dups: Vec<&SkillMetaItem> = scan_res
        .skills
        .iter()
        .filter(|s| s.name == "duplicate-skill")
        .collect();
    assert_eq!(
        dups.len(),
        2,
        "Duplicate skills across directories must not be merged or deduped"
    );
    assert_ne!(
        dups[0].id, dups[1].id,
        "Duplicate skills must have distinct IDs"
    );
    assert_ne!(
        dups[0].source_dir, dups[1].source_dir,
        "Duplicate skills must reflect their distinct source dirs"
    );

    // Verify source_dir annotation for each skill
    for item in &scan_res.skills {
        assert!(
            item.source_dir.is_some(),
            "Every skill must have a source_dir annotated"
        );
        let src = item.source_dir.as_ref().unwrap();
        assert!(!src.is_empty());
        assert!(
            item.raw_path.contains(src) || src.contains(".codex"),
            "raw_path must be within source_dir"
        );

        // Verify path whitelist: is_path_safe_internal MUST return true for every scanned skill
        let path = Path::new(&item.raw_path);
        assert!(
            is_path_safe_internal(path, &fake_home, &[fake_workspace.clone()]),
            "Path safety must allow reading scanned skill at '{}'",
            item.raw_path
        );
    }

    // Verify skills in .codex hubs are marked as legacy
    let codex_skills: Vec<&SkillMetaItem> = scan_res
        .skills
        .iter()
        .filter(|s| s.raw_path.contains(".codex"))
        .collect();
    assert_eq!(
        codex_skills.len(),
        3,
        "There should be 3 skills scanned under .codex hubs"
    );
    for cs in codex_skills {
        assert_eq!(
            cs.legacy,
            Some(true),
            "Skills under .codex must be marked legacy: true"
        );
        assert_eq!(
            cs.is_legacy,
            Some(true),
            "Skills under .codex must be marked isLegacy: true"
        );
    }

    // Verify create_new_skill writes to ~/.agents/skills when ecosystem is codex
    let created_codex = create_new_skill_internal(
        "my-new-codex-skill",
        "workflow",
        "Codex skill test",
        Some("1.0.0"),
        "# Codex Content",
        Some("codex"),
        false,
        Some(&fake_home),
    )
    .unwrap();
    assert!(created_codex.raw_path.contains(".agents"));
    assert!(fake_home
        .join(".agents")
        .join("skills")
        .join("my-new-codex-skill")
        .join("SKILL.md")
        .exists());
    assert_eq!(created_codex.read_by, vec!["codex", "gemini-cli"]);

    // Verify read_by mappings according to verified fact table
    let find_skill = |name: &str| -> &SkillMetaItem {
        scan_res
            .skills
            .iter()
            .find(|s| s.name == name)
            .unwrap_or_else(|| panic!("Skill {} not found", name))
    };
    assert_eq!(find_skill("skill-gemini-cfg").read_by, vec!["antigravity"]);
    assert_eq!(find_skill("skill-gemini-cli").read_by, vec!["gemini-cli"]);
    assert_eq!(
        find_skill("skill-antigravity-rt").read_by,
        vec!["antigravity"]
    );
    assert_eq!(
        find_skill("skill-antigravity-cli").read_by,
        vec!["antigravity-cli"]
    );
    assert_eq!(find_skill("skill-claude-user").read_by, vec!["claude-code"]);
    assert_eq!(find_skill("skill-codex-user").read_by, vec!["codex"]);
    assert_eq!(find_skill("skill-codex-sys").read_by, vec!["codex"]);
    assert_eq!(
        find_skill("skill-agents-std").read_by,
        vec!["codex", "gemini-cli"]
    );

    assert_eq!(find_skill("skill-claude-ws").read_by, vec!["claude-code"]);
    assert_eq!(find_skill("skill-gemini-ws").read_by, vec!["gemini-cli"]);
    assert_eq!(find_skill("skill-codex-ws").read_by, vec!["codex"]);
    assert_eq!(
        find_skill("skill-agents-ws").read_by,
        vec!["codex", "gemini-cli", "antigravity"]
    );
    assert_eq!(find_skill("skill-agent-ws").read_by, vec!["antigravity"]);

    // Verify directory safety: is_dir_safe_internal for all hubs
    let hubs_to_check = vec![
        fake_home.join(".gemini").join("config").join("skills"),
        fake_home.join(".gemini").join("skills"),
        fake_home.join(".gemini").join("antigravity").join("skills"),
        fake_home
            .join(".gemini")
            .join("antigravity-cli")
            .join("skills"),
        fake_home.join(".claude").join("skills"),
        fake_home.join(".codex").join("skills"),
        fake_home.join(".agents").join("skills"),
        fake_workspace.join(".claude").join("skills"),
        fake_workspace.join(".gemini").join("skills"),
        fake_workspace.join(".codex").join("skills"),
        fake_workspace.join(".agents").join("skills"),
        fake_workspace.join(".agent").join("skills"),
    ];

    for hub in hubs_to_check {
        assert!(
            is_dir_safe_internal(&hub, &fake_home, &[fake_workspace.clone()]),
            "Directory safety must allow hub '{}'",
            hub.display()
        );
    }
}

#[test]
fn test_claude_synced_and_trash_handling() {
    let temp = tempdir().unwrap();
    let fake_home = temp.path().join("home");
    let backup_dir = temp.path().join("backups");
    fs::create_dir_all(&backup_dir).unwrap();

    let claude_hub = fake_home.join(".claude").join("skills");
    let normal_dir = claude_hub.join("normal-skill");
    let synced_dir = claude_hub.join("synced").join("my-synced-skill");
    let trash_dir = claude_hub.join(".trash").join("discarded-skill");

    let write_test_skill = |dir: &Path, name: &str, desc: &str| {
        fs::create_dir_all(dir).unwrap();
        let content = format!(
            "---\nname: {}\ndescription: {}\n---\n# {}\nBody",
            name, desc, name
        );
        fs::write(dir.join("SKILL.md"), content).unwrap();
    };

    write_test_skill(&normal_dir, "normal-skill", "Normal Claude Skill");
    write_test_skill(
        &synced_dir,
        "my-synced-skill",
        "Synced Claude Skill from claude.ai",
    );
    write_test_skill(&trash_dir, "discarded-skill", "Discarded Claude Skill");

    let scan_res = scan_all_skills_internal(Some(&fake_home), None).unwrap();
    assert!(scan_res.success);

    // 1. Normal skill is scanned without read_only
    let normal_item = scan_res
        .skills
        .iter()
        .find(|s| s.name == "normal-skill")
        .expect("normal-skill must be scanned");
    assert_eq!(normal_item.read_only, None);
    assert_eq!(normal_item.read_only_notice, None);
    assert_eq!(normal_item.read_by, vec!["claude-code"]);

    // 2. Synced skill is scanned with read_only: true and correct notice
    let synced_item = scan_res
        .skills
        .iter()
        .find(|s| s.name == "my-synced-skill")
        .expect("synced skill must be scanned");
    assert_eq!(synced_item.read_only, Some(true));
    assert_eq!(
        synced_item.read_only_notice.as_deref(),
        Some("该技能由 claude.ai 同步，请在 claude.ai 上修改")
    );
    assert_eq!(synced_item.read_by, vec!["claude-code"]);
    let serialized = serde_json::to_string(synced_item).unwrap();
    assert!(serialized.contains("\"readOnly\":true"));

    // 3. Trash directory is NOT scanned
    assert!(
        scan_res.skills.iter().all(|s| s.name != "discarded-skill"),
        ".trash directory must not be scanned as skills"
    );
    assert!(
        scan_res
            .skills
            .iter()
            .all(|s| !s.raw_path.contains(".trash")),
        "No skill from .trash directory should appear"
    );

    // 4. save_skill_file rejects synced path with exact error message
    let synced_skill_md = synced_dir.join("SKILL.md");
    let save_err =
        save_skill_file_internal(&synced_skill_md, "updated content", &backup_dir).unwrap_err();
    assert_eq!(save_err, "该技能由 claude.ai 同步，请在 claude.ai 上修改");

    // 5. rollback_skill_file rejects synced path with exact error message
    let rollback_err = rollback_skill_file_internal(&synced_skill_md, &backup_dir).unwrap_err();
    assert_eq!(
        rollback_err,
        "该技能由 claude.ai 同步，请在 claude.ai 上修改"
    );

    // 6. validate_skill_name rejects reserved names
    assert!(validate_skill_name("synced").is_err());
    assert!(validate_skill_name(".trash").is_err());
}
