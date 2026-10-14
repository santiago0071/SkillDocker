use super::*;
use tempfile::tempdir;

#[test]
fn test_path_whitelist_and_traversal_defense() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("fake_home");
    let claude_skills = home.join(".claude").join("skills").join("a");
    fs::create_dir_all(&claude_skills).unwrap();
    let valid_claude_skill = claude_skills.join("SKILL.md");
    fs::write(&valid_claude_skill, "valid").unwrap();

    let workspace_dir = temp.path().join("authorized_project");
    fs::create_dir_all(&workspace_dir).unwrap();
    let valid_project_claude_md = workspace_dir.join("CLAUDE.md");
    fs::write(&valid_project_claude_md, "valid").unwrap();

    let workspaces = vec![workspace_dir.clone()];

    // 1. MUST BE ALLOWED:
    assert!(is_path_safe_internal(
        &valid_claude_skill,
        &home,
        &workspaces
    ));
    assert!(is_path_safe_internal(
        &valid_project_claude_md,
        &home,
        &workspaces
    ));

    // 2. MUST BE REJECTED:
    let traversal_path = home
        .join(".claude")
        .join("nonexistent")
        .join("..")
        .join("..")
        .join("..")
        .join("Windows")
        .join("x.txt");
    assert!(!is_path_safe_internal(&traversal_path, &home, &workspaces));

    let evil_claude = home.join(".claude-evil").join("SKILL.md");
    assert!(!is_path_safe_internal(&evil_claude, &home, &workspaces));

    let win_sys32 = Path::new("C:/Windows/System32/x");
    assert!(!is_path_safe_internal(win_sys32, &home, &workspaces));

    let win_verbatim_sys32 = Path::new(r"\\?\c:/windows/system32/x");
    assert!(!is_path_safe_internal(
        win_verbatim_sys32,
        &home,
        &workspaces
    ));

    let malicious_in_ws = workspace_dir.join("malicious.exe");
    assert!(!is_path_safe_internal(&malicious_in_ws, &home, &workspaces));
}

#[test]
fn test_narrowed_home_whitelist_rejects_settings_json() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("fake_home");
    let claude_dir = home.join(".claude");
    fs::create_dir_all(&claude_dir).unwrap();
    let settings_file = claude_dir.join("settings.json");
    let workspaces = Vec::new();

    assert!(!is_path_safe_internal(&settings_file, &home, &workspaces));

    let valid_claude_skill = home
        .join(".claude")
        .join("skills")
        .join("demo")
        .join("SKILL.md");
    assert!(is_path_safe_internal(
        &valid_claude_skill,
        &home,
        &workspaces
    ));

    let gemini_settings = home.join(".gemini").join("config").join("settings.json");
    assert!(!is_path_safe_internal(&gemini_settings, &home, &workspaces));

    let gemini_skill = home
        .join(".gemini")
        .join("config")
        .join("skills")
        .join("my-skill")
        .join("SKILL.md");
    assert!(is_path_safe_internal(&gemini_skill, &home, &workspaces));

    let sd_workspaces = home.join(".skilldock").join("workspaces.json");
    assert!(!is_path_safe_internal(&sd_workspaces, &home, &workspaces));

    let sd_backup = home
        .join(".skilldock")
        .join("backups")
        .join("test-12345678-999.bak");
    assert!(is_path_safe_internal(&sd_backup, &home, &workspaces));

    let sd_malicious = home.join(".skilldock").join("malicious.sh");
    assert!(!is_path_safe_internal(&sd_malicious, &home, &workspaces));

    let sd_log = home
        .join(".skilldock")
        .join("logs")
        .join("skilldocker-2026-10-10.log");
    assert!(!is_path_safe_internal(&sd_log, &home, &workspaces));
}

#[test]
fn test_reject_write_skilldock_workspaces_json() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("fake_home");
    let sd_dir = home.join(".skilldock");
    fs::create_dir_all(&sd_dir).unwrap();
    let workspaces_file = sd_dir.join("workspaces.json");
    let workspaces = Vec::new();

    assert!(!is_path_safe_internal(&workspaces_file, &home, &workspaces));
}

#[test]
fn test_open_workspace_in_explorer_whitelist_and_is_dir() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("fake_home");
    let ws_dir = temp.path().join("authorized_workspace");
    fs::create_dir_all(&ws_dir).unwrap();
    let file_in_ws = ws_dir.join("CLAUDE.md");
    fs::write(&file_in_ws, "hello").unwrap();

    let claude_hub = home.join(".claude").join("skills").join("demo");
    fs::create_dir_all(&claude_hub).unwrap();

    let workspaces = vec![ws_dir.clone()];

    // 1. MUST BE ALLOWED:
    // Authorized workspace directory
    assert!(is_dir_safe_internal(&ws_dir, &home, &workspaces));
    // Subdirectory of authorized workspace
    let sub_ws = ws_dir.join("subfolder");
    fs::create_dir_all(&sub_ws).unwrap();
    assert!(is_dir_safe_internal(&sub_ws, &home, &workspaces));
    // Skill directory in home
    assert!(is_dir_safe_internal(&claude_hub, &home, &workspaces));
    // ~/.skilldock directory allowed
    let sd_dir = home.join(".skilldock");
    fs::create_dir_all(&sd_dir).unwrap();
    assert!(is_dir_safe_internal(&sd_dir, &home, &workspaces));

    // 2. MUST BE REJECTED:
    // A file (not a directory) even inside workspace
    assert!(!is_dir_safe_internal(&file_in_ws, &home, &workspaces));
    // Non-existent directory
    let nonexistent = ws_dir.join("nonexistent_folder");
    assert!(!is_dir_safe_internal(&nonexistent, &home, &workspaces));
    // Unauthorized system directory
    let sys32 = Path::new("C:/Windows/System32");
    assert!(!is_dir_safe_internal(sys32, &home, &workspaces));
    // Traversal directory
    let traversal_dir = home
        .join(".claude")
        .join("nonexistent")
        .join("..")
        .join("..")
        .join("..")
        .join("Windows");
    assert!(!is_dir_safe_internal(&traversal_dir, &home, &workspaces));
}

#[test]
fn test_workspaces_persistence_and_target_resolution() {
    let temp = tempdir().unwrap();
    let home = temp.path().join("home");
    let ws_dir = temp.path().join("ws");
    fs::create_dir_all(&ws_dir).unwrap();
    let cfg = temp.path().join("workspaces.json");

    // 1. Persistence
    assert_eq!(load_authorized_workspaces(Some(&cfg)).len(), 0);
    save_authorized_workspaces(&[ws_dir.clone()], Some(&cfg)).unwrap();
    let loaded = load_authorized_workspaces(Some(&cfg));
    assert_eq!(loaded.len(), 1);
    assert_eq!(loaded[0], ws_dir);

    // 2. Allowed workspace targets
    assert!(is_allowed_workspace_target(
        &ws_dir,
        &ws_dir.join("CLAUDE.md")
    ));
    assert!(is_allowed_workspace_target(
        &ws_dir,
        &ws_dir.join(".cursorrules")
    ));
    assert!(is_allowed_workspace_target(
        &ws_dir,
        &ws_dir.join("agents.md")
    ));
    assert!(is_allowed_workspace_target(
        &ws_dir,
        &ws_dir.join("deepseek.md")
    ));
    assert!(is_allowed_workspace_target(
        &ws_dir,
        &ws_dir
            .join(".gemini")
            .join("skills")
            .join("demo")
            .join("SKILL.md")
    ));
    assert!(!is_allowed_workspace_target(
        &ws_dir,
        &ws_dir.join("other.txt")
    ));

    // 3. Resolve safe path
    let valid_skill = home
        .join(".claude")
        .join("skills")
        .join("demo")
        .join("SKILL.md");
    fs::create_dir_all(valid_skill.parent().unwrap()).unwrap();
    fs::write(&valid_skill, "skill").unwrap();
    let resolved =
        resolve_safe_path_internal(&valid_skill.to_string_lossy(), &home, &[ws_dir.clone()]);
    assert!(resolved.is_ok());

    let invalid_path = "C:/Windows/System32/calc.exe";
    let resolved_err = resolve_safe_path_internal(invalid_path, &home, &[ws_dir]);
    assert!(resolved_err.is_err());

    // 4. Branch coverage for ecosystem skills, traversal error and subpath
    assert!(is_path_safe_internal(
        &home.join(".codex/skills/demo/SKILL.md"),
        &home,
        &[]
    ));
    assert!(is_path_safe_internal(
        &home.join(".agents/skills/demo/SKILL.md"),
        &home,
        &[]
    ));
    assert!(!is_path_safe_internal(
        &home.join(".claude/skills/demo/other.txt"),
        &home,
        &[]
    ));
    assert!(!is_path_safe_internal(
        &home.join(".gemini/other/demo/SKILL.md"),
        &home,
        &[]
    ));
    assert!(!is_component_subpath(Path::new("/a/b"), Path::new("/a")));
    assert!(normalize_path(Path::new("/..")).is_err());
    assert!(list_workspaces().is_ok());
    assert!(open_workspace_in_explorer(Some("C:/Windows/System32".into())).is_err());
    let _ = open_workspace_in_explorer(None);
    let _ = resolve_safe_path("C:/Windows/System32/invalid");
    let _ = add_workspace("C:/Windows/System32/invalid".into());
    let _ = remove_workspace("C:/Windows/System32/invalid".into());
}

#[test]
fn test_skilldock_app_root_isolation_and_env_override() {
    // 1. Without SKILLDOCK_HOME set, test mode defaults to temp_dir containing process id
    let default_root = skilldock_app_root();
    assert!(default_root.starts_with(std::env::temp_dir()));
    let file_name = default_root.file_name().unwrap().to_string_lossy();
    assert!(file_name.starts_with("skilldock_test_"));

    // 2. With SKILLDOCK_HOME set, returns overridden path
    let custom_target = std::env::temp_dir().join("custom_skilldock_override");
    std::env::set_var("SKILLDOCK_HOME", &custom_target);
    let overridden = skilldock_app_root();
    assert_eq!(overridden, custom_target);
    std::env::remove_var("SKILLDOCK_HOME");

    // 3. Workspaces file uses skilldock_app_root
    let ws_file = get_workspaces_file();
    assert_eq!(ws_file, skilldock_app_root().join("workspaces.json"));
}
