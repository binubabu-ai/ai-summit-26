/**
 * Security Constraints Template
 * Generates security requirements and constraints document
 */

import { Template } from '../types';
import { DocumentType } from '@prisma/client';

export const securityConstraintsTemplate: Template = {
  id: 'security-constraints',
  name: 'Security Constraints & Requirements',
  category: 'constraint',
  docType: DocumentType.SECURITY,
  description: 'Security requirements, constraints, and compliance guidelines',
  priority: 90,

  template: (context) => {
    const securityConstraints = context.constraints.filter(c => c.type === 'security');
    const hasSecurityRequirements = securityConstraints.length > 0;

    return `# Security Constraints & Requirements

## Overview
Security constraints and requirements for ${context.projectName || 'the project'}.

**Constraint Level**: HARD (Must be enforced)
**Review Schedule**: Monthly

---

## Authentication & Authorization

${hasSecurityRequirements && securityConstraints.some(c => c.category.toLowerCase().includes('auth')) ?
securityConstraints
  .filter(c => c.category.toLowerCase().includes('auth'))
  .map(c => `
### ${c.category}

**Severity**: ${c.severity}

${c.rules.map(rule => `- ${rule}`).join('\n')}
`).join('\n') : `
### Authentication Requirements

- All API routes MUST require authentication except public endpoints
- Use ${context.techStack.auth || 'Supabase Auth'} for user authentication
- Implement refresh token rotation
- Set session timeout to 24 hours
- Support MFA for sensitive operations

### Authorization Requirements

- Implement role-based access control (RBAC)
- Verify user permissions before any data mutation
- Apply principle of least privilege
- Audit all permission changes
`}

---

## Data Protection

${hasSecurityRequirements && securityConstraints.some(c => c.category.toLowerCase().includes('data')) ?
securityConstraints
  .filter(c => c.category.toLowerCase().includes('data'))
  .map(c => `
### ${c.category}

**Severity**: ${c.severity}

${c.rules.map(rule => `- ${rule}`).join('\n')}
`).join('\n') : `
### Data Encryption

**At Rest**:
- Encrypt sensitive fields in database
- Use AES-256 encryption for PII
- Store encryption keys in secure vault (not in code)

**In Transit**:
- Enforce HTTPS for all connections
- Use TLS 1.3 minimum
- Implement certificate pinning for API clients

### Data Retention

- Define retention periods for different data types
- Implement automated data purging
- Ensure GDPR/compliance with right to erasure
`}

---

## Input Validation

${context.constraints
  .filter(c => c.type === 'validation')
  .map(c => `
### ${c.category}

${c.rules.map(rule => `- ${rule}`).join('\n')}
`).join('\n') || `
### Server-Side Validation

**CRITICAL**: ALWAYS validate on server, never trust client input

- Validate all user inputs using Zod schemas
- Sanitize HTML to prevent XSS
- Parameterize queries to prevent SQL injection (Prisma does this)
- Limit file upload sizes and types
- Rate limit form submissions

### Common Attack Vectors

**Must Protect Against**:
- Cross-Site Scripting (XSS)
- SQL Injection
- CSRF attacks
- Command Injection
- Path Traversal
- Server-Side Request Forgery (SSRF)
`}

---

## API Security

### Rate Limiting

\`\`\`typescript
// Implement rate limiting per user/IP
const RATE_LIMITS = {
  anonymous: 10,    // requests per minute
  authenticated: 100,
  premium: 1000
};
\`\`\`

### API Key Security

- Never expose API keys in client-side code
- Rotate API keys quarterly
- Implement API key scoping (read/write permissions)
- Log all API key usage
- Revoke compromised keys immediately

### CORS Configuration

\`\`\`typescript
// Only allow trusted origins
const allowedOrigins = [
  'https://yourdomain.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
].filter(Boolean);
\`\`\`

---

## Session Security

### Session Management

- Generate cryptographically secure session IDs
- Invalidate sessions on logout
- Implement concurrent session limits
- Detect and alert on suspicious session activity

### Cookie Security

\`\`\`typescript
// Cookie configuration
{
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}
\`\`\`

---

## Secret Management

### Environment Variables

**NEVER commit secrets to repository**

\`\`\`env
# .env.local (not committed)
DATABASE_URL=postgresql://...
API_SECRET_KEY=...
ENCRYPTION_KEY=...
\`\`\`

### Secret Rotation

- Rotate database credentials quarterly
- Rotate API keys after suspected compromise
- Maintain audit log of secret access

---

## Logging & Monitoring

### Security Event Logging

**Must Log**:
- Authentication attempts (success/failure)
- Authorization failures
- Data access to sensitive resources
- Configuration changes
- Admin actions

**Log Format**:
\`\`\`json
{
  "timestamp": "ISO8601",
  "event": "auth_failure",
  "userId": "user_id",
  "ip": "ip_address",
  "userAgent": "...",
  "details": {}
}
\`\`\`

### Alerting

**Immediate Alerts**:
- Multiple failed login attempts
- Unauthorized access attempts
- Unusual data access patterns
- System configuration changes

---

## Compliance

${hasSecurityRequirements && securityConstraints.some(c => c.category.toLowerCase().includes('compliance')) ?
securityConstraints
  .filter(c => c.category.toLowerCase().includes('compliance'))
  .map(c => `
### ${c.category}

${c.rules.map(rule => `- ${rule}`).join('\n')}
`).join('\n') : `
### GDPR Compliance (if applicable)

- Implement consent management
- Provide data export functionality
- Implement right to erasure
- Document data processing activities
- Appoint DPO if required

### SOC 2 / ISO 27001 (if applicable)

- Implement access controls
- Conduct regular security audits
- Maintain security documentation
- Employee security training
`}

---

## Code Security

### Dependency Management

- Run \`npm audit\` before every deployment
- Keep dependencies up to date
- Use Snyk or Dependabot for vulnerability scanning
- Review dependency licenses

### Secure Coding Practices

- Use TypeScript for type safety
- Enable strict mode in tsconfig.json
- Use ESLint security rules
- Conduct code reviews for security
- Never log sensitive data

---

## Incident Response

### Security Incident Process

1. **Detection**: Security event triggered
2. **Containment**: Isolate affected systems
3. **Investigation**: Determine scope and impact
4. **Remediation**: Fix vulnerability
5. **Recovery**: Restore normal operations
6. **Post-Mortem**: Document and improve

### Incident Response Team

- Security Lead: [TBD]
- Engineering Lead: [TBD]
- Compliance Officer: [TBD]

---

## Security Testing

### Required Tests

- [ ] Penetration testing (annual)
- [ ] Vulnerability scanning (quarterly)
- [ ] Security code review (before major releases)
- [ ] OWASP ZAP automated scanning (CI/CD)

### Testing Checklist

- [ ] SQL Injection testing
- [ ] XSS testing
- [ ] CSRF protection validation
- [ ] Authentication bypass attempts
- [ ] Authorization escalation attempts
- [ ] Session hijacking attempts
- [ ] File upload vulnerability testing

---

## Enforcement

**How these constraints are enforced**:

1. **Development**: ESLint security rules, pre-commit hooks
2. **Code Review**: Security checklist for all PRs
3. **CI/CD**: Automated security scanning
4. **Runtime**: Web Application Firewall (WAF)
5. **Monitoring**: Security event detection and alerting

---

## Review & Updates

- **Review Schedule**: Monthly
- **Owner**: Security Team
- **Next Review**: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

---

**Generated from**: ${context.sourcePath}
**Template**: security-constraints
**Generated on**: ${new Date().toISOString().split('T')[0]}

**CRITICAL**: These are HARD constraints and MUST be followed. Any deviation requires explicit security team approval.
`;
  }
};
