use super::*;
use tempfile::tempdir;

#[test]
fn test_validate_skill_name_and_safe_creation() {
    // 1. Valid names: only [a-z0-9-_]
    assert!(validate_skill_name("my-skill").is_ok());
    assert!(validate_skill_name("skill_123").is_ok());
    assert!(validate_skill_name("a-b-c_d").is_ok());
    assert!(validate_skill_name("007-agent").is_ok());

    // 2. Invalid names must be rejected BEFORE directory creation
    assert!(validate_skill_name("").is_err());
    assert!(validate_skill_name("../evil").is_err());
    assert!(validate_skill_name("UpperSkill").is_err());
    assert!(validate_skill_name("skill with spaces").is_err());
    assert!(validate_skill_name("skill/nested").is_err());
    assert!(validate_skill_name("skill.md").is_err());
    assert!(validate_skill_name("CON").is_err());
    assert!(validate_skill_name("skill@v1").is_err());
    assert!(validate_skill_name(r"skill\backslash").is_err());
}

#[test]
fn test_create_skill_overwrite_protection() {
    let temp = tempdir().unwrap();
    let fake_home = temp.path().join("home");
    fs::create_dir_all(&fake_home).unwrap();

    // 1. Create skill for the first time
    let original_body = "# Original Skill Content";
    let res1 = create_new_skill_internal(
        "test-duplicate-skill",
        "workflow",
        "Original description",
        Some("1.0.0"),
        original_body,
        Some("claude"),
        false,
        Some(&fake_home),
    );
    assert!(res1.is_ok(), "First creation should succeed");

    let skill_file = fake_home
        .join(".claude")
        .join("skills")
        .join("test-duplicate-skill")
        .join("SKILL.md");
    assert!(skill_file.exists());
    let content_before = fs::read_to_string(&skill_file).unwrap();
    assert!(content_before.contains("Original Skill Content"));

    // 2. Attempt to create again with overwrite=false
    let new_body = "# Attempted Overwrite Content";
    let res2 = create_new_skill_internal(
        "test-duplicate-skill",
        "workflow",
        "New description",
        Some("2.0.0"),
        new_body,
        Some("claude"),
        false,
        Some(&fake_home),
    );
    assert!(
        res2.is_err(),
        "Creation with overwrite=false must fail when file exists"
    );
    let err_msg = res2.err().unwrap();
    assert!(
        err_msg.contains("already exists"),
        "Error message should mention 'already exists'"
    );

    // Original file must remain unchanged
    let content_after_failed = fs::read_to_string(&skill_file).unwrap();
    assert_eq!(
        content_before, content_after_failed,
        "Original file content must remain strictly untouched"
    );
    assert!(content_after_failed.contains("Original Skill Content"));
    assert!(!content_after_failed.contains("Attempted Overwrite Content"));

    // 3. Create with overwrite=true
    let res3 = create_new_skill_internal(
        "test-duplicate-skill",
        "workflow",
        "Updated description",
        Some("2.0.0"),
        new_body,
        Some("claude"),
        true,
        Some(&fake_home),
    );
    assert!(res3.is_ok(), "Creation with overwrite=true should succeed");
    let content_after_overwrite = fs::read_to_string(&skill_file).unwrap();
    assert!(content_after_overwrite.contains("Attempted Overwrite Content"));
}

#[test]
fn test_reject_save_skill_file_to_logs() {
    let temp = tempdir().unwrap();
    let log_dir = temp.path().join(".skilldock").join("logs");
    let _ = fs::create_dir_all(&log_dir);
    let log_file = log_dir.join("skilldocker-2026-10-10.log");
    let backup_dir = temp.path().join(".skilldock").join("backups");
    let res = save_skill_file_internal(&log_file, "malicious write to log", &backup_dir);
    assert!(res.is_err());
    assert!(res
        .err()
        .unwrap()
        .contains("日志文件不能通过 save_skill_file 写入"));
    assert!(
        !log_file.exists(),
        "Log file must not be created or overwritten by save_skill_file_internal"
    );
}

#[test]
fn test_save_and_rollback_skill_file_lifecycle() {
    let temp = tempdir().unwrap();
    let skill_dir = temp.path().join(".gemini").join("skills").join("demo");
    fs::create_dir_all(&skill_dir).unwrap();
    let skill_file = skill_dir.join("SKILL.md");
    let backup_dir = temp.path().join(".skilldock").join("backups");

    // 1. Initial save creates file
    save_skill_file_internal(&skill_file, "version 1", &backup_dir).unwrap();
    assert_eq!(fs::read_to_string(&skill_file).unwrap(), "version 1");

    // 2. Second save creates backup
    save_skill_file_internal(&skill_file, "version 2", &backup_dir).unwrap();
    assert_eq!(fs::read_to_string(&skill_file).unwrap(), "version 2");
    let backups = fs::read_dir(&backup_dir).unwrap().flatten().count();
    assert_eq!(backups, 1);

    // 3. Rollback restores previous version and cleans up backup
    let restored = rollback_skill_file_internal(&skill_file, &backup_dir).unwrap();
    assert_eq!(restored, "version 1");
    assert_eq!(fs::read_to_string(&skill_file).unwrap(), "version 1");
    let remaining_backups = fs::read_dir(&backup_dir).unwrap().flatten().count();
    assert_eq!(remaining_backups, 0);

    // 4. Second rollback fails when no backup remains
    let empty_rollback = rollback_skill_file_internal(&skill_file, &backup_dir);
    assert!(empty_rollback.is_err());
    assert_eq!(empty_rollback.err().unwrap(), "No backup found to restore");

    // 5. Claude synced path rejection
    let synced_path = temp
        .path()
        .join(".claude")
        .join("skills")
        .join("synced")
        .join("x")
        .join("SKILL.md");
    let save_synced = save_skill_file_internal(&synced_path, "content", &backup_dir);
    assert!(save_synced.is_err());
    assert!(save_synced.err().unwrap().contains("claude.ai"));
    let rb_synced = rollback_skill_file_internal(&synced_path, &backup_dir);
    assert!(rb_synced.is_err());
    assert!(rb_synced.err().unwrap().contains("claude.ai"));

    // 6. Name validation edge cases
    assert!(validate_skill_name("").is_err());
    assert!(validate_skill_name("synced").is_err());
    assert!(validate_skill_name(".trash").is_err());
    assert!(validate_skill_name("Invalid Name!").is_err());

    // 7. Security error paths for read, save, rollback wrappers
    assert!(read_skill_file("C:/Windows/System32/evil.md".into()).is_err());
    assert!(save_skill_file("C:/Windows/System32/evil.md".into(), "x".into()).is_err());
    assert!(rollback_skill_file("C:/Windows/System32/evil.md".into()).is_err());

    // 8. Ecosystem directory branches
    let fake_h = temp.path().join("h2");
    assert!(create_new_skill_internal(
        "gem-sk",
        "cat",
        "desc",
        None,
        "body",
        Some("gemini"),
        false,
        Some(&fake_h)
    )
    .is_ok());
    assert!(create_new_skill_internal(
        "codex-sk",
        "cat",
        "desc",
        None,
        "body",
        Some("codex"),
        false,
        Some(&fake_h)
    )
    .is_ok());
    assert!(create_new_skill_internal(
        "ag-sk",
        "cat",
        "desc",
        Some("1.2.0"),
        "body",
        Some("agents"),
        false,
        Some(&fake_h)
    )
    .is_ok());
    assert!(create_new_skill(
        "Bad Name!".into(),
        "c".into(),
        "d".into(),
        None,
        "b".into(),
        None,
        None
    )
    .is_err());
    assert!(is_claude_synced_path(Path::new(
        "/home/.claude/skills/synced"
    )));
    assert!(!is_claude_synced_path(Path::new(
        "/home/.claude/skills/normal"
    )));

    // Exercise Tauri command wrappers for save and rollback
    let temp_ws = tempdir().unwrap();
    let ws_path = temp_ws.path().to_string_lossy().to_string();
    let _ = crate::paths::add_workspace(ws_path.clone());
    let valid_claude_md = temp_ws.path().join("CLAUDE.md");
    let _ = save_skill_file(valid_claude_md.to_string_lossy().to_string(), "v1".into());
    let _ = save_skill_file(valid_claude_md.to_string_lossy().to_string(), "v2".into());
    let _ = rollback_skill_file(valid_claude_md.to_string_lossy().to_string());
    let _ = save_skill_file("C:/Windows/System32/bad.md".into(), "test".into());
    let _ = rollback_skill_file("C:/Windows/System32/bad.md".into());
    let _ = crate::paths::remove_workspace(ws_path);
}
