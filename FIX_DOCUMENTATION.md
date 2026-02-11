# Fix for Tag SBOM Review Workflow Failure

## Problem Summary

The Tag SBOM Review workflow fails with the error:
```
Error: ENOENT: no such file or directory, open 'https://github.com/ryuuichiroh/mime-types-vulnerable-sample/actions/runs/21893877345'
```

## Root Cause

The issue is in the upstream `ryuuichiroh/oss-management-system` repository's `issue-creator.js` script and its workflow invocation. There are two related bugs:

### Bug 1: Wrong Parameter Order
The reusable workflow in `.github/workflows/reusable-tag-sbom-review.yml` was calling the script with parameters in the wrong order:

```bash
# What the workflow was passing:
node .oss-management/dist/scripts/issue-creator.js review "$TAG_NAME" diff-result.json "$ARTIFACT_URL" "$GUIDELINES_PATH"

# What the script expected (old):
# review <version> <diff-result.json> <guidelines-map.json> <sbom-url>
```

The script was trying to read the ARTIFACT_URL (which is a URL string) as a file path using `fs.readFileSync()`, causing the ENOENT error.

### Bug 2: Incorrect Guidelines Map Key  
The script was using `componentKey` (`group:name`) as the map key instead of `licenseId`, which is inconsistent with how guidelines are organized (by license, not by component).

## Solution

The fix has been implemented in `/tmp/oss-management-system` (branch: `fix-issue-creator-parameter-order`):

### Changes to `scripts/issue-creator.ts`:

1. **Import LicenseGuideProvider**:
   ```typescript
   import { LicenseGuideProvider } from './license-guide-provider';
   ```

2. **Update parameter order and processing**:
   ```typescript
   // New parameter order
   const version = args[1];
   const diffResultPath = args[2];
   const sbomUrl = args[3];           // Swapped with guidelinesYamlPath
   const guidelinesYamlPath = args[4]; // Swapped with sbomUrl
   
   // Build guidelines map from YAML file internally
   const guideProvider = new LicenseGuideProvider(guidelinesYamlPath);
   guideProvider.loadConfig();
   
   const guidelinesMap = new Map<string, Guideline[]>();
   for (const diff of diffs) {
     const licenseId = getLicenseId(diff.component);
     if (!guidelinesMap.has(licenseId)) {
       const guidelines = guideProvider.getGuidelines(licenseId);
       guidelinesMap.set(licenseId, guidelines);
     }
   }
   ```

3. **Fix guidelines map lookup**:
   ```typescript
   // OLD (wrong):
   const componentKey = `${diff.component.group || ''}:${diff.component.name}`;
   const guidelines = guidelinesMap.get(componentKey) || [];
   
   // NEW (correct):
   const licenseId = getLicenseId(diff.component);
   const guidelines = guidelinesMap.get(licenseId) || [];
   ```

4. **Update usage message**:
   ```typescript
   console.error('  Review Issue: node issue-creator.js review <version> <diff-result.json> <sbom-url> <guidelines-yaml> [assignee]');
   ```

## Applying the Fix

### Option 1: Wait for Upstream Fix
The fix needs to be merged in the `ryuuichiroh/oss-management-system` repository. Once merged, the workflow will automatically use the fixed version.

### Option 2: Use a Fixed Branch (Recommended)
Update `.github/workflows/tag-sbom-review.yml` to reference a branch with the fix:

```yaml
jobs:
  sbom-review:
    uses: ryuuichiroh/oss-management-system/.github/workflows/reusable-tag-sbom-review.yml@fix-issue-creator-parameter-order
    # ... rest of the configuration
```

### Option 3: Create Local Workflow
Copy the entire reusable workflow locally and apply the fix. (Not recommended due to maintenance overhead)

## Testing the Fix

The fix can be tested by:
1. Creating a new tag (e.g., `v1.0.1`)  
2. Pushing the tag to trigger the workflow
3. Verifying that the review issue is created successfully

## Files Modified in oss-management-system

- `scripts/issue-creator.ts` - Main fix
- `dist/scripts/issue-creator.js` - Compiled output
- `dist/scripts/issue-creator.d.ts.map` - Type declaration map
- `dist/scripts/issue-creator.js.map` - Source map

## Related Issues

This fix resolves the parameter order mismatch and makes the script more maintainable by:
- Eliminating the need for a separate guidelines map building step
- Using the correct key (license ID) for guidelines lookup
- Making the script self-contained
