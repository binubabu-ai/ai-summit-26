# Editor AI Styling Preservation Plan

**Status**: ✅ IMPLEMENTED (2026-01-25)

## Problem

When using AI features (Refine, Expand, Shorten) on selected text:
- Text with styling (blockquote, heading, list, etc.) loses formatting
- AI returns plain text/markdown syntax
- Inserted text shows markdown syntax instead of rendered formatting
- Example: Quote → Expand → Shows `> text` instead of rendered quote block

## Root Cause

Current implementation:
1. Gets selected text as **plain text** (no formatting info)
2. Sends to AI which returns **plain text/markdown**
3. Inserts using `insertContent()` which treats it as **plain text**
4. Original node type (blockquote, heading) is **lost**

## Solution

### Approach 1: Preserve Original Node Type (Recommended)

**Strategy**: Detect node type, improve content, reapply same formatting

```typescript
const handleAIAction = async (action: string) => {
  // 1. Get selection info with node type
  const { from, to } = editor.state.selection;
  const selectedNode = editor.state.doc.nodeAt(from);
  const nodeType = selectedNode?.type.name; // 'blockquote', 'heading', 'paragraph'

  // 2. Get plain text content
  const selectedText = editor.state.doc.textBetween(from, to, '\n');

  // 3. Call AI to improve text
  const { improvedText } = await improveTextAPI(selectedText, action);

  // 4. Replace text while preserving node type
  editor
    .chain()
    .focus()
    .deleteSelection()
    .insertContentAt(from, {
      type: nodeType,
      content: [{ type: 'text', text: improvedText }]
    })
    .run();
};
```

### Approach 2: Parse and Reapply Markdown Formatting

**Strategy**: If AI returns markdown, parse it and apply proper formatting

```typescript
const handleAIAction = async (action: string) => {
  // Get current formatting context
  const { $from } = editor.state.selection;
  const nodeAttrs = {
    isBlockquote: editor.isActive('blockquote'),
    isHeading: editor.isActive('heading'),
    headingLevel: $from.node().attrs?.level,
    isList: editor.isActive('bulletList') || editor.isActive('orderedList'),
  };

  // Get and improve text
  const selectedText = getSelectedText();
  const { improvedText } = await improveTextAPI(selectedText, action);

  // Replace with formatting
  editor.chain().focus().deleteSelection();

  if (nodeAttrs.isBlockquote) {
    editor.chain().setBlockquote().insertContent(improvedText).run();
  } else if (nodeAttrs.isHeading) {
    editor.chain().setHeading({ level: nodeAttrs.headingLevel }).insertContent(improvedText).run();
  } else {
    editor.chain().insertContent(improvedText).run();
  }
};
```

### Approach 3: Context-Aware AI Instructions

**Strategy**: Tell AI to preserve markdown formatting in output

```typescript
// Update API call to include formatting context
const response = await fetch('/api/ai/improve-text', {
  method: 'POST',
  body: JSON.stringify({
    text: selectedText,
    action,
    documentContext,
    formatting: {
      isBlockquote: editor.isActive('blockquote'),
      isHeading: editor.isActive('heading') ? {
        level: getCurrentHeadingLevel()
      } : null,
      isList: editor.isActive('bulletList') ? 'bullet' :
              editor.isActive('orderedList') ? 'ordered' : null,
    }
  }),
});

// AI preserves formatting in response
// Example: If blockquote, AI returns markdown with > prefix
```

## Recommended Implementation

**Hybrid Approach**: Combine 1 + 3

1. **Detect current formatting** before AI call
2. **Pass formatting context** to AI (so it understands context)
3. **Get plain text response** from AI (no markdown syntax)
4. **Reapply original formatting** after insertion

## Implementation Steps

### Step 1: Detect Node Context

```typescript
function getFormattingContext(editor: Editor) {
  const { $from, from } = editor.state.selection;

  return {
    nodeType: $from.parent.type.name,
    isBlockquote: editor.isActive('blockquote'),
    isHeading: editor.isActive('heading'),
    headingLevel: editor.getAttributes('heading').level,
    isBulletList: editor.isActive('bulletList'),
    isOrderedList: editor.isActive('orderedList'),
    isCodeBlock: editor.isActive('codeBlock'),
    isBold: editor.isActive('bold'),
    isItalic: editor.isActive('italic'),
  };
}
```

### Step 2: Update AI API

```typescript
// lib/ai/gemini.ts - improveText function
export async function improveText(
  text: string,
  action: string,
  documentContext: string,
  formatting?: FormattingContext
): Promise<{ improvedText: string }> {

  let systemContext = `You are a professional technical writer.
Return ONLY the improved text without any markdown syntax or formatting.
Do not add blockquote markers (>), heading markers (#), or list markers (-, *).
Return pure plain text that will be formatted by the editor.`;

  if (formatting?.isBlockquote) {
    systemContext += `\nThe text is in a blockquote. Maintain its quote-like tone.`;
  }

  if (formatting?.isHeading) {
    systemContext += `\nThis is a heading. Keep it concise and title-case.`;
  }

  // ... rest of implementation
}
```

### Step 3: Preserve Formatting on Insert

```typescript
const handleAIAction = async (action: string) => {
  if (!editor) return;

  setProcessing(true);
  setShowAiDropdown(false);
  setError(null);

  try {
    // Get selection and formatting context
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '\n');

    if (!selectedText?.trim()) {
      setError('Please select some text to improve');
      return;
    }

    // Capture current formatting
    const formatting = getFormattingContext(editor);
    const documentContext = editor.getText();

    // Call AI with formatting context
    const response = await fetch('/api/ai/improve-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: selectedText,
        action,
        documentContext,
        formatting,
      }),
    });

    if (!response.ok) throw new Error('Failed to improve text');

    const { improvedText } = await response.json();

    // Delete selection
    editor.chain().focus().deleteSelection().run();

    // Reapply formatting based on context
    let chain = editor.chain().focus();

    if (formatting.isBlockquote) {
      chain = chain.setBlockquote();
    } else if (formatting.isHeading) {
      chain = chain.setHeading({ level: formatting.headingLevel || 1 });
    } else if (formatting.isBulletList) {
      chain = chain.toggleBulletList();
    } else if (formatting.isOrderedList) {
      chain = chain.toggleOrderedList();
    } else if (formatting.isCodeBlock) {
      chain = chain.setCodeBlock();
    }

    // Insert improved text
    chain.insertContent(improvedText).run();

    // Reapply inline formatting
    if (formatting.isBold) {
      editor.chain().focus().toggleBold().run();
    }
    if (formatting.isItalic) {
      editor.chain().focus().toggleItalic().run();
    }

    setAiInstruction('');
  } catch (err) {
    console.error('AI action error:', err);
    setError(err instanceof Error ? err.message : 'Failed to improve text');
  } finally {
    setProcessing(false);
  }
};
```

## Testing Scenarios

### Test Cases:
1. **Blockquote**:
   - Select text in `> quote`
   - Click Expand
   - ✅ Result should remain formatted as blockquote

2. **Heading**:
   - Select text in `# Heading`
   - Click Refine
   - ✅ Result should remain as heading at same level

3. **List Item**:
   - Select text in `- list item`
   - Click Shorten
   - ✅ Result should remain as list item

4. **Bold Text**:
   - Select **bold text**
   - Click Expand
   - ✅ Result should remain bold

5. **Code Block**:
   - Select text in ``` code block ```
   - Click Refine
   - ✅ Result should remain in code block

6. **Nested Formatting**:
   - Select **bold text** inside blockquote
   - Click Expand
   - ✅ Both blockquote AND bold should be preserved

7. **Mixed Formatting**:
   - Select multiple paragraphs with different formatting
   - Should preserve each paragraph's formatting

## Edge Cases

1. **Multi-node Selection**: What if selection spans multiple node types?
   - Solution: Work on each node separately OR warn user to select single node

2. **Partial Node Selection**: What if only part of heading is selected?
   - Solution: Preserve heading format for improved text

3. **AI Returns Markdown**: What if AI ignores instructions and returns markdown?
   - Solution: Strip markdown syntax before insertion

4. **Empty Result**: What if AI returns empty string?
   - Solution: Don't replace, show error

## Performance Considerations

- Cache formatting context to avoid repeated calculations
- Use Tiptap's transaction system for atomic updates
- Debounce AI calls if multiple selections happen rapidly

## Future Enhancements

1. **Format Conversion**: Allow AI to suggest format changes
   - "This would work better as a list" → Convert to list
   - "This should be a heading" → Convert to heading

2. **Smart Formatting**: AI detects best format for content
   - Code snippets → Automatically format as code block
   - Questions → Automatically format as blockquote

3. **Formatting Templates**: Save/load formatting presets

4. **Visual Diff**: Show before/after with formatting preserved in preview

## Success Metrics

- ✅ 100% formatting preservation for single-node selections
- ✅ 90%+ user satisfaction with AI formatting behavior
- ✅ Zero markdown syntax leaking into visual editor
- ✅ No regression in AI quality due to formatting constraints

## Implementation Priority

**P0 - Critical** (This PR):
- Detect current node formatting
- Preserve blockquote, heading, lists
- Preserve bold/italic inline formatting

**P1 - Important** (Next PR):
- Handle multi-node selections
- Strip unwanted markdown from AI responses
- Better error messages

**P2 - Nice to Have**:
- Format suggestions
- Visual diff
- Formatting templates
