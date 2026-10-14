use super::*;
use tempfile::tempdir;

#[test]
fn discovers_global_and_workspace_rule_files() {
    let home = tempdir().unwrap();
    let ws = tempdir().unwrap();

    fs::create_dir_all(home.path().join(".claude")).unwrap();
    fs::write(
        home.path().join(".claude").join("CLAUDE.md"),
        "# Global\n- be terse",
    )
    .unwrap();

    fs::write(ws.path().join("AGENTS.md"), "## Style\nUse tabs").unwrap();
    fs::write(ws.path().join(".cursorrules"), "   \n").unwrap(); // whitespace only: skipped
    fs::create_dir_all(ws.path().join(".cursor").join("rules")).unwrap();
    fs::write(
        ws.path().join(".cursor").join("rules").join("b.mdc"),
        "---\ndescription: B\n---\nRule B",
    )
    .unwrap();
    fs::write(
        ws.path().join(".cursor").join("rules").join("a.mdc"),
        "Rule A",
    )
    .unwrap();
    fs::write(
        ws.path().join(".cursor").join("rules").join("notes.txt"),
        "ignored",
    )
    .unwrap();

    let found = discover_in(home.path(), &[ws.path().to_path_buf()]);
    let rels: Vec<&str> = found.iter().map(|s| s.relative_path.as_str()).collect();

    assert_eq!(
        rels,
        vec![
            "~/.claude/CLAUDE.md",
            "AGENTS.md",
            ".cursor/rules/a.mdc",
            ".cursor/rules/b.mdc"
        ]
    );
    assert_eq!(found[0].scope, "global");
    assert_eq!(found[1].tool, "codex");
    assert_eq!(found[2].tool, "cursor");
    assert!(found.iter().all(|s| !s.truncated));
}

#[test]
fn truncates_oversized_files() {
    let home = tempdir().unwrap();
    let ws = tempdir().unwrap();
    fs::write(
        ws.path().join("CLAUDE.md"),
        "x".repeat(MAX_FILE_BYTES as usize + 10),
    )
    .unwrap();

    let found = discover_in(home.path(), &[ws.path().to_path_buf()]);
    assert_eq!(found.len(), 1);
    assert!(found[0].truncated);
    assert_eq!(found[0].content.len(), MAX_FILE_BYTES as usize);
}
