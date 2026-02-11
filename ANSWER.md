# 失敗した理由 / Why It Failed

## 簡潔な回答 / Quick Answer

**失敗した理由：**
ワークフローのスクリプトがURLをファイルとして読み込もうとしたため。

**Reason for failure:**
The workflow script tried to read a URL as a file.

---

## 詳細 / Details

### エラーメッセージ / Error Message
```
Error: ENOENT: no such file or directory, open 'https://github.com/ryuuichiroh/mime-types-vulnerable-sample/actions/runs/21893877345'
```

### 原因 / Cause

`issue-creator.js` スクリプトは以下の順序でパラメータを受け取ることを期待していました：
The `issue-creator.js` script expected parameters in this order:

```
1. version (バージョン)
2. diff-result.json (差分ファイル)
3. guidelines-map.json (ガイドラインファイル) ← ここにURLが来た
4. sbom-url (SBOM URL)
```

しかし、ワークフローは以下の順序で渡していました：
But the workflow was passing them in this order:

```
1. version (バージョン) ✓
2. diff-result.json (差分ファイル) ✓
3. ARTIFACT_URL (URLだがファイルとして扱われた) ✗
4. guidelines-path (ファイルパスだがURLとして扱われた) ✗
```

スクリプトは3番目のパラメータ（ARTIFACT_URL）を `fs.readFileSync()` でファイルとして読み込もうとしてエラーになりました。

The script tried to read the 3rd parameter (ARTIFACT_URL) as a file using `fs.readFileSync()`, causing the error.

### 修正内容 / Fix

パラメータの順序を修正し、YAMLファイルから内部でガイドラインマップを構築するようにしました：
Fixed the parameter order and made the script build the guidelines map internally from YAML:

```typescript
// 修正後 / After fix:
const version = args[1];           // v1.0.0
const diffResultPath = args[2];    // diff-result.json  
const sbomUrl = args[3];           // https://... (URL)
const guidelinesYamlPath = args[4]; // .oss-management/config/license-guidelines.yml (file)
```

---

## テスト方法 / How to Test

新しいタグを作成してワークフローが正常に動作するか確認してください：
Create a new tag to verify the workflow works correctly:

```bash
git tag v1.0.1
git push origin v1.0.1
```

成功すると、GitHubにレビューIssueが自動作成されます。
If successful, a review issue will be automatically created in GitHub.

---

## 関連ファイル / Related Files

- 📄 `FIX_DOCUMENTATION.md` - 技術的な詳細 / Technical details
- 📄 `README_FIX.md` - ユーザーガイド / User guide
- 🔧 `.oss-management/scripts/issue-creator.ts` - 修正したスクリプト / Fixed script
- ⚙️ `.github/workflows/tag-sbom-review-local.yml` - 新しいワークフロー / New workflow
