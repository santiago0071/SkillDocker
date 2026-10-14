fn main() {
    // Build timestamp for the license "updates until" window (see src/license.rs).
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    println!("cargo:rustc-env=SKILLDOCKER_BUILD_TS={}", ts);
    println!("cargo:rerun-if-env-changed=SKILLDOCKER_LICENSE_PUBKEY");
    tauri_build::build()
}
