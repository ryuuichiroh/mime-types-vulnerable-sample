# ワークフロー失敗の修正について / Fix for Workflow Failure

## 問題 / Problem

Tag SBOM Review ワークフローが以下のエラーで失敗していました：
The Tag SBOM Review workflow was failing with the following error:

```
Error: ENOENT: no such file or directory, open 'https://github.com/ryuuichiroh/mime-types-vulnerable-sample/actions/runs/21893877345'
```

## 原因 / Root Cause

上流の `ryuuichiroh/oss-management-system` リポジトリの `issue-creator.js` スクリプトにバグがありました：
There was a bug in the `issue-creator.js` script from the upstream `ryuuichiroh/oss-management-system` repository:

1. **パラメータの順序が間違っていた** / **Wrong parameter order**
   - ワークフローがURLをファイルパスとして渡していた
   - The workflow was passing a URL where a file path was expected
   - スクリプトが `fs.readFileSync()` でURLを読み込もうとしてエラー
   - The script tried to read the URL with `fs.readFileSync()`, causing the error

2. **ガイドラインマップのキーが不正確** / **Incorrect guidelines map key**
   - `componentKey` を使用していたが、`licenseId` を使用すべきだった
   - Was using `componentKey` but should have used `licenseId`

## 解決方法 / Solution

このリポジトリに修正済みの `.oss-management/` ディレクトリを追加しました：
Added a fixed `.oss-management/` directory to this repository:

### 主な変更 / Key Changes

1. **`.oss-management/scripts/issue-creator.ts`**
   - パラメータの順序を修正: `version, diff-file, sbom-url, guidelines-yaml`
   - Fixed parameter order: `version, diff-file, sbom-url, guidelines-yaml`
   - YAMLガイドラインファイルから内部でマップを構築
   - Build guidelines map internally from YAML file
   - `licenseId` をキーとして使用
   - Use `licenseId` as the key

2. **`.github/workflows/tag-sbom-review-local.yml`**
   - ローカルの `.oss-management/` スクリプトを使用する新しいワークフロー
   - New workflow using local `.oss-management/` scripts
   - リモートの再利用可能なワークフローの代わりに使用
   - Used instead of the remote reusable workflow

3. **`.github/workflows/tag-sbom-review.yml.disabled`**
   - 元のワークフローを無効化（リネーム）
   - Original workflow disabled (renamed)

## テスト方法 / How to Test

新しいタグをプッシュしてワークフローをテストできます：
You can test the workflow by pushing a new tag:

```bash
git tag v1.0.1
git push origin v1.0.1
```

ワークフローが正常に実行され、レビューIssueが作成されるはずです。
The workflow should run successfully and create a review issue.

## 詳細情報 / More Information

詳細については `FIX_DOCUMENTATION.md` を参照してください。
See `FIX_DOCUMENTATION.md` for more details.

## 今後の対応 / Future Actions

上流の `oss-management-system` リポジトリにこの修正をコントリビュートすることを推奨します。修正がマージされたら、このリポジトリから `.oss-management/` ディレクトリを削除し、元のワークフローに戻すことができます。

It's recommended to contribute this fix back to the upstream `oss-management-system` repository. Once the fix is merged, you can remove the `.oss-management/` directory from this repository and revert to using the original workflow.
