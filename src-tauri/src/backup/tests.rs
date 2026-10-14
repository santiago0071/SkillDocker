use super::*;
use crate::skills::{rollback_skill_file_internal, save_skill_file_internal};
use tempfile::tempdir;

#[test]
fn test_backup_and_rollback_isolation() {
    let temp = tempdir().unwrap();
    let backup_dir = temp.path().join("backups");
    let skill_a_dir = temp.path().join("skills").join("skill_a");
    let skill_b_dir = temp.path().join("skills").join("skill_b");
    fs::create_dir_all(&skill_a_dir).unwrap();
    fs::create_dir_all(&skill_b_dir).unwrap();

    let file_a = skill_a_dir.join("SKILL.md");
    let file_b = skill_b_dir.join("SKILL.md");

    // Initial contents
    fs::write(&file_a, "Skill A initial content").unwrap();
    fs::write(&file_b, "Skill B initial content").unwrap();

    // 1. Edit A -> Edit B -> Rollback A
    save_skill_file_internal(&file_a, "Skill A edited v2", &backup_dir).unwrap();
    std::thread::sleep(std::time::Duration::from_millis(15));
    save_skill_file_internal(&file_b, "Skill B edited v2", &backup_dir).unwrap();

    assert_eq!(fs::read_to_string(&file_a).unwrap(), "Skill A edited v2");
    assert_eq!(fs::read_to_string(&file_b).unwrap(), "Skill B edited v2");

    // Rollback A
    let rolled_back_a = rollback_skill_file_internal(&file_a, &backup_dir).unwrap();
    assert_eq!(rolled_back_a, "Skill A initial content");
    assert_eq!(
        fs::read_to_string(&file_a).unwrap(),
        "Skill A initial content"
    );
    // Assert B is completely unaffected
    assert_eq!(fs::read_to_string(&file_b).unwrap(), "Skill B edited v2");

    // Check that legacy backups (SKILL.md-*.bak) cannot be rolled back
    let legacy_backup = backup_dir.join("SKILL.md-123456789.bak");
    fs::write(&legacy_backup, "Legacy garbage").unwrap();
    // Rollback A again (no more valid backups for A)
    let rollback_result = rollback_skill_file_internal(&file_a, &backup_dir);
    assert!(rollback_result.is_err());
}

#[test]
fn test_backup_quota_and_lru_rotation() {
    let temp = tempdir().unwrap();
    let backup_dir = temp.path().join("backups");
    let skill_a_dir = temp.path().join("skills").join("skill_a");
    let skill_b_dir = temp.path().join("skills").join("skill_b");
    fs::create_dir_all(&skill_a_dir).unwrap();
    fs::create_dir_all(&skill_b_dir).unwrap();

    let file_a = skill_a_dir.join("SKILL.md");
    let file_b = skill_b_dir.join("SKILL.md");

    fs::write(&file_a, "Skill A v0").unwrap();
    fs::write(&file_b, "Skill B v0").unwrap();

    // Create 1 backup for B
    save_skill_file_internal(&file_b, "Skill B v1", &backup_dir).unwrap();
    let prefix_b = get_backup_prefix_for_path(&file_b);

    let count_b_backups = || -> usize {
        fs::read_dir(&backup_dir)
            .unwrap()
            .flatten()
            .filter(|e| {
                e.file_name().to_string_lossy().starts_with(&prefix_b)
                    && e.file_name().to_string_lossy().ends_with(".bak")
            })
            .count()
    };
    assert_eq!(count_b_backups(), 1);

    // Edit A 12 times
    for i in 1..=12 {
        std::thread::sleep(std::time::Duration::from_millis(15));
        save_skill_file_internal(&file_a, &format!("Skill A v{}", i), &backup_dir).unwrap();
    }

    let prefix_a = get_backup_prefix_for_path(&file_a);
    let count_a_backups = || -> usize {
        fs::read_dir(&backup_dir)
            .unwrap()
            .flatten()
            .filter(|e| {
                e.file_name().to_string_lossy().starts_with(&prefix_a)
                    && e.file_name().to_string_lossy().ends_with(".bak")
            })
            .count()
    };

    // Assert A has exactly 10 backups
    assert_eq!(count_a_backups(), 10);
    // Assert B's backup count is still 1 (unaffected)
    assert_eq!(count_b_backups(), 1);
}

#[test]
fn test_sha2_backup_prefix_stability() {
    let path_a = Path::new("C:/Users/Tester/.claude/skills/my-agent/SKILL.md");
    let path_b = Path::new("C:/Users/Tester/.claude/skills/other-agent/SKILL.md");

    let prefix_a1 = get_backup_prefix_for_path(path_a);
    let prefix_a2 = get_backup_prefix_for_path(path_a);
    let prefix_b = get_backup_prefix_for_path(path_b);

    // 1. Same path produces identical sha2 prefix every time
    assert_eq!(prefix_a1, prefix_a2);
    assert!(prefix_a1.starts_with("my-agent-"));
    assert_eq!(prefix_a1.len(), "my-agent-".len() + 8 + 1);

    // 2. Different paths produce distinct prefixes
    assert_ne!(prefix_a1, prefix_b);
    assert!(prefix_b.starts_with("other-agent-"));
}

#[test]
fn test_migrate_legacy_backups() {
    let temp = tempdir().unwrap();
    let backup_dir = temp.path().join("backups");
    fs::create_dir_all(&backup_dir).unwrap();

    // 1. Create legacy backup files: SKILL.md-<timestamp>.bak
    let legacy_1 = backup_dir.join("SKILL.md-1728551111.bak");
    let legacy_2 = backup_dir.join("SKILL.md-1728552222.bak");
    fs::write(&legacy_1, "legacy backup 1").unwrap();
    fs::write(&legacy_2, "legacy backup 2").unwrap();

    // 2. Create modern backup files: <skill>-<hash8>-<timestamp>.bak
    let modern_1 = backup_dir.join("my-skill-12345678-1728553333.bak");
    let modern_2 = backup_dir.join("other-skill-abcdef12-1728554444.bak");
    fs::write(&modern_1, "modern backup 1").unwrap();
    fs::write(&modern_2, "modern backup 2").unwrap();

    // 3. Create non-bak regular file
    let normal_file = backup_dir.join("readme.txt");
    fs::write(&normal_file, "notes").unwrap();

    // 4. Run migration
    let migrated_count = migrate_legacy_backups(&backup_dir);
    assert_eq!(migrated_count, 2);

    // 5. Verify legacy subdirectory exists and contains legacy files
    let legacy_dir = backup_dir.join("legacy");
    assert!(legacy_dir.is_dir());
    assert!(legacy_dir.join("SKILL.md-1728551111.bak").exists());
    assert!(legacy_dir.join("SKILL.md-1728552222.bak").exists());

    // 6. Verify legacy files are removed from the root backups dir
    assert!(!legacy_1.exists());
    assert!(!legacy_2.exists());

    // 7. Verify modern files and other files are completely untouched
    assert!(modern_1.exists());
    assert!(modern_2.exists());
    assert!(normal_file.exists());
    assert_eq!(fs::read_to_string(&modern_1).unwrap(), "modern backup 1");
    assert_eq!(fs::read_to_string(&modern_2).unwrap(), "modern backup 2");

    // 8. Idempotency: second run moves 0 files
    assert_eq!(migrate_legacy_backups(&backup_dir), 0);

    // 9. Non-existent directory returns 0 safely
    let nonexistent = temp.path().join("does_not_exist");
    assert_eq!(migrate_legacy_backups(&nonexistent), 0);
}
