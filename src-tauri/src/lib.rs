pub mod ai;
pub mod backup;
pub mod importer;
pub mod license;
pub mod logging;
pub mod models;
pub mod parser;
pub mod paths;
pub mod scanner;
pub mod skills;
pub mod vault;

use ai::{ai_generate, delete_api_key, has_api_key, set_api_key};
use license::{activate_license, deactivate_license, get_license_status, open_checkout_url};
use logging::{export_diagnostic_package, log_frontend_error, open_log_directory};
use paths::{
    list_workspaces, open_workspace_in_explorer, pick_and_register_workspace, remove_workspace,
};
use scanner::scan_all_skills;
use skills::{
    create_new_skill, read_skill_file, rollback_skill_file, save_skill_file, toggle_dock_window,
};
use vault::{export_skill_folder, export_skill_pack, import_skill_pack, inspect_skill_pack};

#[tauri::command]
fn discover_rule_sources() -> Result<Vec<importer::RuleSource>, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    let list = importer::discover_in(
        std::path::Path::new(&home),
        &paths::load_authorized_workspaces(None),
    );
    logging::log_command(
        "discover_rule_sources",
        true,
        Some(&format!("discovered {} sources", list.len())),
    );
    Ok(list)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    logging::log_app_startup(env!("CARGO_PKG_VERSION"));
    let backup_dir = backup::default_backup_dir();
    let _ = backup::migrate_legacy_backups(&backup_dir);

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            scan_all_skills,
            read_skill_file,
            save_skill_file,
            rollback_skill_file,
            toggle_dock_window,
            create_new_skill,
            open_workspace_in_explorer,
            list_workspaces,
            remove_workspace,
            set_api_key,
            has_api_key,
            delete_api_key,
            ai_generate,
            discover_rule_sources,
            pick_and_register_workspace,
            log_frontend_error,
            open_log_directory,
            export_diagnostic_package,
            activate_license,
            get_license_status,
            deactivate_license,
            open_checkout_url,
            export_skill_pack,
            export_skill_folder,
            inspect_skill_pack,
            import_skill_pack
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
