# Skills File Naming Convention Analysis

**Date:** 2026-01-27
**Issue:** What to do when `skills.md` already exists?

---

## The Problem

When running `docjays init` in a project that already has `skills.md`, we need to decide:
1. Should we append to existing file?
2. Should we create a different filename?
3. Should we prompt the user?
4. Should we skip creation?

---

## Research: Existing Conventions

### Claude Code / Skills Files

**Standard:** `skills.md` in project root

**Current State:**
- Claude Code looks for `skills.md` specifically
- No established convention for multiple skills files
- No native "merge" or "append" mechanism
- Users can have project-specific + tool-specific skills

### Other AI Tools

**Cursor:** Uses `.cursorrules` (single file)
**Windsurf:** Uses `.windsurfrules` (single file)
**Copilot:** No rules file (uses comments)

**Pattern:** Each tool has its own single file, no merging

---

## Options Analysis

### Option 1: Append to Existing File

**Implementation:**
```typescript
if (fs.existsSync('skills.md')) {
  const content = fs.readFileSync('skills.md', 'utf-8');

  // Check if Docjays skills already present
  if (content.includes('## Skill: Ground Responses with Docjays')) {
    logger.info('Docjays skills already in skills.md');
    return;
  }

  // Append Docjays skills
  const docjaysSkills = fs.readFileSync(templatePath, 'utf-8');
  const newContent = `${content}\n\n---\n\n# Docjays Skills\n\n${docjaysSkills}`;
  fs.writeFileSync('skills.md', newContent);
  logger.success('Appended Docjays skills to existing skills.md');
}
```

**Pros:**
- ✅ Single skills.md file
- ✅ Everything in one place
- ✅ Claude Code sees all skills

**Cons:**
- ❌ Risky: Could break existing format
- ❌ Merge conflicts possible
- ❌ Hard to update just Docjays section later
- ❌ User might not want auto-modification
- ❌ Complex logic to detect existing content

**Verdict:** ❌ Too risky

---

### Option 2: Create Tool-Specific File

**Implementation:**
```typescript
if (fs.existsSync('skills.md')) {
  // Create docjays-specific file
  const targetFile = 'skills-docjays.md';
  fs.copyFileSync(templatePath, targetFile);
  logger.success(`Created ${targetFile}`);
  logger.info('Tip: You can merge this into skills.md if desired');
} else {
  // Create standard skills.md
  fs.copyFileSync(templatePath, 'skills.md');
  logger.success('Created skills.md');
}
```

**Filename Options:**
- `skills-docjays.md`
- `docjays-skills.md`
- `docjays.skills.md`
- `.docjays-skills.md`

**Pros:**
- ✅ No risk of breaking existing file
- ✅ Clear separation
- ✅ Can coexist with other tools
- ✅ User can merge manually if wanted

**Cons:**
- ❌ Claude Code might not find `skills-docjays.md`
- ❌ Multiple files to maintain
- ❌ User needs to reference in main `skills.md`

**Verdict:** 🟡 Safe but not ideal for Claude Code

---

### Option 3: Prompt User for Action

**Implementation:**
```typescript
if (fs.existsSync('skills.md')) {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'skills.md already exists. What would you like to do?',
      choices: [
        { name: 'Skip (keep existing skills.md)', value: 'skip' },
        { name: 'Create docjays-skills.md (separate file)', value: 'separate' },
        { name: 'Overwrite skills.md (replace with Docjays template)', value: 'overwrite' },
        { name: 'Show instructions for manual merge', value: 'manual' }
      ]
    }
  ]);

  switch (action) {
    case 'skip':
      logger.info('Skipped skills creation');
      logger.info('Tip: See template at packages/docjays-cli/templates/skills.md');
      break;

    case 'separate':
      fs.copyFileSync(templatePath, 'docjays-skills.md');
      logger.success('Created docjays-skills.md');
      logger.info('Tip: Reference from your main skills.md:');
      logger.info('      See also: ./docjays-skills.md');
      break;

    case 'overwrite':
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'This will replace your existing skills.md. Are you sure?',
          default: false
        }
      ]);
      if (confirm) {
        fs.copyFileSync(templatePath, 'skills.md');
        logger.success('Replaced skills.md with Docjays template');
        logger.warn('Your old skills.md was overwritten');
      }
      break;

    case 'manual':
      logger.info('Manual merge instructions:');
      logger.info('1. Open your existing skills.md');
      logger.info('2. Add a section: # Docjays Skills');
      logger.info('3. Copy skills from: packages/docjays-cli/templates/skills.md');
      logger.info('4. Or reference: See also: ./docjays-skills.md');
      break;
  }
}
```

**Pros:**
- ✅ User has full control
- ✅ Clear options
- ✅ No assumptions
- ✅ Safe default (skip)

**Cons:**
- ❌ Extra interaction during init
- ❌ Slows down setup
- ❌ Might confuse new users

**Verdict:** 🟢 Good for flexibility, but verbose

---

### Option 4: Smart Detection + Recommendation

**Implementation:**
```typescript
if (fs.existsSync('skills.md')) {
  const content = fs.readFileSync('skills.md', 'utf-8');
  const hasDocjaysSkills = content.includes('Docjays') ||
                           content.includes('Ground Responses with Docjays');

  if (hasDocjaysSkills) {
    logger.info('✓ Docjays skills already in skills.md');
    return;
  }

  // Skills.md exists but no Docjays content
  logger.info('ℹ  skills.md already exists');
  logger.info('   To add Docjays skills:');
  logger.info('   1. Run: docjays create-skills --output docjays-skills.md');
  logger.info('   2. Reference in skills.md: See also: ./docjays-skills.md');
  logger.info('   OR');
  logger.info('   3. Run: docjays create-skills --merge');

  // Don't create automatically
  return;
} else {
  // No skills.md, create it
  fs.copyFileSync(templatePath, 'skills.md');
  logger.success('Created skills.md');
}
```

**Enhanced Command:**
```bash
# Create separate file
docjays create-skills --output docjays-skills.md

# Attempt smart merge
docjays create-skills --merge

# Force overwrite
docjays create-skills --force
```

**Pros:**
- ✅ Non-destructive by default
- ✅ Clear instructions
- ✅ Flexible with flags
- ✅ Users can choose method

**Cons:**
- ❌ Requires extra command
- ❌ Not automatic

**Verdict:** 🟢🟢 Best balance of safety and flexibility

---

## Naming Convention Research

### If Creating Separate File

**Option A: `docjays-skills.md`**
- Pros: Clear, descriptive, tool prefix
- Cons: Not standard format
- Pattern: `<tool>-skills.md`

**Option B: `skills/docjays.md`**
- Pros: Organized in directory
- Cons: Requires creating `skills/` directory
- Pattern: `skills/<tool>.md`

**Option C: `.docjays/skills.md`**
- Pros: With Docjays content
- Cons: Git-ignored, not in repo
- Pattern: Hidden folder

**Option D: `DOCJAYS_SKILLS.md`**
- Pros: Clear, uppercase stands out
- Cons: Not conventional
- Pattern: Uppercase for system files

**Recommendation:** `docjays-skills.md`
- Most straightforward
- Easy to reference
- Committed to repo
- No directory needed

---

## Recommended Strategy

### Default Behavior (init)

```typescript
async function maybeCreateSkills() {
  if (fs.existsSync('skills.md')) {
    // Check if Docjays content already there
    const content = fs.readFileSync('skills.md', 'utf-8');
    if (content.includes('# Docjays Skills') ||
        content.includes('Ground Responses with Docjays')) {
      logger.info('✓ Docjays skills already configured');
      return;
    }

    // Exists but no Docjays content
    logger.info('ℹ  skills.md exists. Use `docjays create-skills` to add Docjays skills');
    return;
  }

  // No skills.md, ask to create
  const { createSkills } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'createSkills',
      message: 'Create skills.md for AI agent instructions?',
      default: true
    }
  ]);

  if (createSkills) {
    fs.copyFileSync(templatePath, 'skills.md');
    logger.success('Created skills.md');
    logger.info('Tip: Customize for your project');
  }
}
```

### Explicit Command (create-skills)

```bash
# Basic: Create skills.md or warn if exists
docjays create-skills

# Output to specific file
docjays create-skills --output docjays-skills.md

# Force overwrite existing skills.md
docjays create-skills --force

# Smart merge (append section)
docjays create-skills --merge

# Show template without creating
docjays create-skills --print
```

**Implementation:**
```typescript
interface CreateSkillsOptions {
  output?: string;      // Custom filename
  force?: boolean;      // Overwrite if exists
  merge?: boolean;      // Append to existing
  print?: boolean;      // Just print template
}

async function createSkills(options: CreateSkillsOptions = {}) {
  const templatePath = path.join(__dirname, '../../../templates/skills.md');
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Just print template
  if (options.print) {
    console.log(template);
    return;
  }

  // Determine output file
  const outputFile = options.output || 'skills.md';

  // Check if file exists
  if (fs.existsSync(outputFile) && !options.force && !options.merge) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `${outputFile} already exists. What would you like to do?`,
        choices: [
          { name: 'Cancel (keep existing)', value: 'cancel' },
          { name: 'Create as docjays-skills.md instead', value: 'rename' },
          { name: 'Overwrite existing file', value: 'overwrite' },
          { name: 'Merge/append to existing', value: 'merge' }
        ]
      }
    ]);

    switch (action) {
      case 'cancel':
        logger.info('Cancelled');
        return;

      case 'rename':
        fs.writeFileSync('docjays-skills.md', template);
        logger.success('Created docjays-skills.md');
        logger.info('Tip: Reference in your main skills.md:');
        logger.info('     See also: [Docjays Skills](./docjays-skills.md)');
        return;

      case 'overwrite':
        // Fall through to force write
        break;

      case 'merge':
        options.merge = true;
        break;
    }
  }

  // Merge mode: append to existing
  if (options.merge && fs.existsSync(outputFile)) {
    const existing = fs.readFileSync(outputFile, 'utf-8');

    // Check if already has Docjays section
    if (existing.includes('# Docjays Skills') ||
        existing.includes('Ground Responses with Docjays')) {
      logger.info('Docjays skills already present in file');
      return;
    }

    // Append with separator
    const merged = `${existing}\n\n---\n\n# Docjays Skills\n\n${template}`;
    fs.writeFileSync(outputFile, merged);
    logger.success(`Merged Docjays skills into ${outputFile}`);
    return;
  }

  // Force or new file: just write
  fs.writeFileSync(outputFile, template);
  logger.success(`Created ${outputFile}`);

  if (outputFile !== 'skills.md') {
    logger.info('Tip: Reference from your main skills.md:');
    logger.info(`     See also: [Docjays Skills](./${outputFile})`);
  }
}
```

---

## Reference Strategy in Main skills.md

If Docjays creates `docjays-skills.md`, users can reference it:

```markdown
# Project Skills

## General Skills
[Your project skills here]

## Tool-Specific Skills

### Docjays
See [Docjays Skills](./docjays-skills.md) for documentation management workflows.

Key Docjays skills:
- Create feature specifications
- Ground responses with documentation
- Sync external sources
```

---

## Examples

### Scenario 1: New Project (no skills.md)

```bash
docjays init
? Create skills.md for AI agent instructions? (Y/n) y
✓ Created .docjays/
✓ Created skills.md
✓ Updated .gitignore

# Result: skills.md created with Docjays template
```

### Scenario 2: Existing skills.md (no Docjays content)

```bash
docjays init
ℹ  skills.md already exists
ℹ  To add Docjays skills, run: docjays create-skills
✓ Created .docjays/
✓ Updated .gitignore

# Later...
docjays create-skills
? skills.md already exists. What would you like to do?
  > Create as docjays-skills.md instead
✓ Created docjays-skills.md
ℹ  Tip: Reference in your main skills.md
```

### Scenario 3: Has Docjays Skills Already

```bash
docjays init
✓ Docjays skills already configured
✓ Created .docjays/
✓ Updated .gitignore

# Skips skills creation
```

### Scenario 4: Force Overwrite

```bash
docjays create-skills --force
⚠  This will overwrite your existing skills.md
? Are you sure? (y/N) y
✓ Created skills.md
⚠  Previous skills.md was overwritten
```

### Scenario 5: Merge Mode

```bash
docjays create-skills --merge
✓ Merged Docjays skills into skills.md
ℹ  Added "# Docjays Skills" section at end

# Appends to existing file
```

---

## Final Recommendation

### Implementation Priority

**Phase 1: Safe Default**
```typescript
// During init
if (fs.existsSync('skills.md')) {
  logger.info('ℹ  skills.md exists. Run `docjays create-skills` to add Docjays skills');
} else {
  // Prompt to create
  if (await confirm('Create skills.md?')) {
    createSkillsFile('skills.md');
  }
}
```

**Phase 2: Explicit Command**
```bash
docjays create-skills                    # Interactive
docjays create-skills --output <file>    # Custom filename
docjays create-skills --merge            # Append to existing
docjays create-skills --force            # Overwrite
```

### Naming Convention

**Primary:** `skills.md` (if doesn't exist)
**Fallback:** `docjays-skills.md` (if skills.md exists)
**Pattern:** `<tool>-skills.md` for tool-specific

### User Experience

```bash
# Ideal flow
docjays init
✓ Created .docjays/
✓ Created skills.md
✓ Everything ready!

# Has existing skills
docjays init
ℹ  skills.md exists. Run `docjays create-skills` for Docjays skills
✓ Created .docjays/

docjays create-skills
? skills.md exists. Create as docjays-skills.md? (Y/n) y
✓ Created docjays-skills.md
ℹ  Reference in main skills.md: See ./docjays-skills.md
```

---

## Decision Matrix

| Scenario | Action | Result |
|----------|--------|--------|
| No skills.md | Create skills.md | Standard setup |
| Has skills.md, no Docjays | Show tip, offer command | User decides |
| Has skills.md with Docjays | Skip | Already configured |
| User runs create-skills | Interactive prompt | User chooses method |
| User wants separate | Create docjays-skills.md | Coexists safely |
| User wants merge | Append to existing | All in one file |

---

**Status:** ✅ Strategy Defined
**Recommended:** Option 4 (Smart Detection) + Flexible Command
**Naming:** `docjays-skills.md` as fallback
