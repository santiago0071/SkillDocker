# Contributing to SkillDocker

Thank you for contributing to SkillDocker! To ensure codebase quality, security, and stability, please follow the guidelines and workflows below.

---

## 1. Development Setup

### Prerequisites
- **Node.js**: v20 or later
- **Rust & Cargo**: Latest stable Rust toolchain
- **PowerShell**: For running verification scripts on Windows

### Install Dependencies
```bash
npm install
```

---

## 2. Verification Gate & Pre-push Hook

SkillDocker enforces a mandatory local verification gate before any code can be committed or pushed.

### One-Time Setup: Configure Git Hooks
Enable the repository's custom Git hooks by running:
```bash
git config core.hooksPath .githooks
```
This activates `.githooks/pre-push`, which automatically runs the verification gate (`.\scripts\verify.ps1`) before executing `git push`. If any gate step fails, the push is aborted.

### Running Verification Locally
Before submitting pull requests or pushing changes, always run the local verification gate:

```powershell
# Fast verification (TypeScript, ESLint, Engine tests, Clippy, Rust unit tests)
.\scripts\verify.ps1

# Full verification (includes Tauri build test)
.\scripts\verify.ps1 -Full
```

The gate verifies 5 core dimensions:
1. **TypeScript Compile**: `npx tsc --noEmit` (no type errors)
2. **ESLint Check**: `npx eslint src --max-warnings 0` (zero warnings allowed)
3. **Core Engine Tests**: `node --experimental-strip-types tests/test-engine.mjs`
4. **Rust Clippy**: `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` (zero warnings allowed)
5. **Rust Unit Tests**: `cargo test --manifest-path src-tauri/Cargo.toml`

---

## 3. Pull Request Guidelines

1. **Keep Commits Atomic**: Make focused, single-purpose commits with clear conventional commit messages (e.g., `feat:`, `fix:`, `refactor:`, `docs:`).
2. **Pass All Gates**: Ensure `.\scripts\verify.ps1` passes cleanly with 0 errors and 0 warnings.
3. **Security Standards**:
   - Strict path safety boundaries: avoid arbitrary filesystem read/write access.
   - All workspace paths must be explicitly authorized and validated.
   - Do not bypass Rust boundary validation or frontend sanitization.

Thank you for helping keep SkillDocker robust and secure!
