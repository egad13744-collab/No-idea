# Contributing to No-Idea

Thank you for helping keep everyday web tools **100% free, open-source, and paywall-free**!

## Core Principles

Every tool added to **No-Idea** must follow four strict rules:

1. **Replaces an Annoying Paywall**: Focus on everyday tasks where commercial sites artificially charge subscriptions, add watermarks, or enforce "2 files per day" quotas.
2. **100% Client-Side Execution**: Files, documents, and personal data must stay inside the user's browser (`0 bytes` uploaded to external servers).
3. **Zero Forced Sign-Up or Watermarks**: Exports must be clean, high-resolution, and ready for real work.
4. **Bilingual Ready (`EN` & `ID`)**: Add labels for both English and Bahasa Indonesia in `src/i18n/translations.ts`.

## How to Add a New Tool

1. Fork the repository and create a feature branch (`git checkout -b feat/your-tool`).
2. Create your component inside `src/components/tools/`.
3. Register its route and metadata in `src/i18n/translations.ts`, `src/components/CommandOverview.tsx`, and `src/App.tsx`.
4. Verify TypeScript and production bundling with:
   ```bash
   npm run build
   ```
5. Open a Pull Request describing what paywalled utility your tool replaces!
