/**
 * AI-Powered Audit System
 * Analyzes documentation quality, consistency, and completeness
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Types for audit findings
export interface AuditFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'security' | 'consistency' | 'quality' | 'freshness' | 'links' | 'grammar' | 'completeness';
  title: string;
  description: string;
  location?: {
    documentId?: string;
    documentPath?: string;
    lineNumber?: number;
    section?: string;
  };
  suggestion?: string;
  autoFixable: boolean;
}

export interface AuditResult {
  healthScore: number;
  consistencyScore?: number;
  freshnessScore?: number;
  qualityScore?: number;
  findings: AuditFinding[];
  duration: number;
  aiModel: string;
  cost: number;
}

export interface ReadabilityMetrics {
  gradeLevel: number;
  complexity: 'low' | 'medium' | 'high';
  score: string;
}

const AUDIT_SYSTEM_PROMPT = `You are an expert documentation auditor and technical writer.

Your role:
- Analyze documentation for quality, accuracy, and completeness
- Identify issues with different severity levels
- Provide actionable suggestions for improvement
- Check for consistency with best practices
- Detect outdated or inaccurate information
- Evaluate readability for target audience

Guidelines:
- Be thorough but concise in findings
- Prioritize by severity (critical > high > medium > low)
- Provide specific line numbers when possible
- Suggest auto-fixable solutions when applicable
- Consider technical accuracy and clarity
- Flag security issues immediately
- Return only valid JSON without any markdown formatting`;

/**
 * Audit a single document for quality and completeness
 */
export async function auditDocument(
  documentId: string,
  documentPath: string,
  content: string,
  lastUpdated: Date
): Promise<AuditResult> {
  const startTime = Date.now();

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',  // Best for complex reasoning
    systemInstruction: AUDIT_SYSTEM_PROMPT,
  });

  const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

  const prompt = `Audit this technical document for quality, accuracy, and completeness.

Document Path: ${documentPath}
Last Updated: ${lastUpdated.toISOString()} (${daysSinceUpdate} days ago)

Content:
\`\`\`markdown
${content}
\`\`\`

Analyze for:
1. Readability (grade level, complexity)
2. Completeness (missing sections, TODOs, placeholders)
3. Grammar & spelling errors
4. Consistency with project standards
5. Accuracy (fact-checking, technical correctness)
6. Freshness (outdated information, deprecated references)
7. Broken links (identify link patterns that may be broken)
8. Code examples (syntax errors, outdated patterns)
9. Security issues (exposed secrets, insecure patterns)

Return JSON in this exact format:
{
  "qualityScore": 85,
  "readability": {
    "gradeLevel": 9,
    "complexity": "medium",
    "score": "Good"
  },
  "findings": [
    {
      "id": "finding-1",
      "severity": "high",
      "category": "completeness",
      "title": "Missing API examples section",
      "description": "The document mentions API endpoints but doesn't provide usage examples",
      "lineNumber": 42,
      "section": "API Reference",
      "suggestion": "Add code examples showing how to call each endpoint with request/response samples",
      "autoFixable": false
    }
  ]
}

Return ONLY the JSON, no explanations or markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text().trim();

    // Remove markdown code blocks if present
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);

    const duration = Date.now() - startTime;
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const cost = calculateCost('gemini-2.5-pro', inputTokens, outputTokens);

    return {
      healthScore: parsed.qualityScore || 50,
      qualityScore: parsed.qualityScore || 50,
      findings: parsed.findings || [],
      duration,
      aiModel: 'gemini-2.5-pro',
      cost,
    };
  } catch (error) {
    console.error('Error auditing document:', error);
    throw new Error('Failed to audit document');
  }
}

/**
 * Audit a project (all documents)
 */
export async function auditProject(
  projectId: string,
  projectName: string,
  documents: Array<{ id: string; path: string; content: string; updatedAt: Date }>
): Promise<AuditResult> {
  const startTime = Date.now();

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: AUDIT_SYSTEM_PROMPT,
  });

  // Prepare document summaries (don't send full content to avoid token limits)
  const docSummaries = documents.map(doc => {
    const preview = doc.content.substring(0, 500);
    const daysSinceUpdate = Math.floor((Date.now() - doc.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    return {
      path: doc.path,
      preview,
      size: doc.content.length,
      daysSinceUpdate,
    };
  });

  const prompt = `Audit this documentation project for overall health, consistency, and completeness.

Project: ${projectName}
Total Documents: ${documents.length}

Document Summaries:
${JSON.stringify(docSummaries, null, 2)}

Analyze for:
1. Project Health Score (0-100)
2. Documentation Coverage (% of features documented)
3. Consistency Score (naming, formatting, structure across docs)
4. Freshness Score (outdated content detection)
5. Broken cross-references between documents
6. Conflicting information across docs
7. Technical debt (TODOs, FIXMEs, deprecated references)
8. Missing critical documentation (README, API docs, setup guides)
9. Team collaboration health (recent activity patterns)

Return JSON in this exact format:
{
  "healthScore": 88,
  "consistencyScore": 85,
  "freshnessScore": 75,
  "findings": [
    {
      "id": "finding-1",
      "severity": "high",
      "category": "consistency",
      "title": "Inconsistent API endpoint naming",
      "description": "Some docs use '/api/v1/users' while others use '/users'",
      "documentPath": "api/reference.md",
      "suggestion": "Standardize all endpoint paths to use '/api/v1/' prefix",
      "autoFixable": false
    }
  ]
}

Return ONLY the JSON, no explanations or markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text().trim();

    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);

    const duration = Date.now() - startTime;
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const cost = calculateCost('gemini-2.5-pro', inputTokens, outputTokens);

    return {
      healthScore: parsed.healthScore || 50,
      consistencyScore: parsed.consistencyScore,
      freshnessScore: parsed.freshnessScore,
      findings: parsed.findings || [],
      duration,
      aiModel: 'gemini-2.5-pro',
      cost,
    };
  } catch (error) {
    console.error('Error auditing project:', error);
    throw new Error('Failed to audit project');
  }
}

/**
 * Audit dashboard (all projects)
 */
export async function auditDashboard(
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    documentCount: number;
    lastUpdated: Date;
  }>
): Promise<AuditResult> {
  const startTime = Date.now();

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: AUDIT_SYSTEM_PROMPT,
  });

  const projectSummaries = projects.map(p => ({
    name: p.name,
    slug: p.slug,
    documentCount: p.documentCount,
    daysSinceUpdate: Math.floor((Date.now() - p.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  const prompt = `Audit this documentation portfolio for overall health and cross-project issues.

Total Projects: ${projects.length}

Project Summaries:
${JSON.stringify(projectSummaries, null, 2)}

Analyze for:
1. Portfolio Health Score (0-100)
2. Projects at Risk (outdated, low activity)
3. Cross-project consistency (naming conventions, structure)
4. Security issues (exposed secrets, permissions)
5. Team collaboration health (activity, responsiveness)
6. Documentation quality trends
7. Resource allocation (projects with too few/many docs)

Return JSON in this exact format:
{
  "healthScore": 85,
  "consistencyScore": 78,
  "findings": [
    {
      "id": "finding-1",
      "severity": "medium",
      "category": "freshness",
      "title": "2 projects haven't been updated in 30+ days",
      "description": "Projects 'Legacy API' and 'Old Docs' show no recent activity",
      "suggestion": "Review these projects for archival or update them with current information",
      "autoFixable": false
    }
  ]
}

Return ONLY the JSON, no explanations or markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text().trim();

    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);

    const duration = Date.now() - startTime;
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const cost = calculateCost('gemini-2.5-pro', inputTokens, outputTokens);

    return {
      healthScore: parsed.healthScore || 50,
      consistencyScore: parsed.consistencyScore,
      findings: parsed.findings || [],
      duration,
      aiModel: 'gemini-2.5-pro',
      cost,
    };
  } catch (error) {
    console.error('Error auditing dashboard:', error);
    throw new Error('Failed to audit dashboard');
  }
}

/**
 * Calculate cost for Gemini API usage
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gemini-2.5-pro': {
      input: 1.25,
      output: 5.0,
    },
    'gemini-2.5-flash': {
      input: 0.075,
      output: 0.3,
    },
  };

  const modelPricing = pricing[model] || pricing['gemini-2.5-pro'];
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}
