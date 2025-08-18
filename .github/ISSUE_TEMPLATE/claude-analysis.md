---
name: Claude Code Analysis  
about: Request code analysis, refactoring, or architecture review
title: '[ANALYSIS] '
labels: ['analysis', 'claude-task', 'refactoring']
assignees: []
---

## Analysis Request
**What do you want analyzed?**
Describe the code, component, or system you want Claude to analyze.

## Analysis Type
**What kind of analysis do you need?**
- [ ] Performance analysis
- [ ] Security review
- [ ] Code quality assessment
- [ ] Architecture review
- [ ] Refactoring opportunities
- [ ] Technical debt assessment
- [ ] Best practices review
- [ ] Other: ___________

## Scope
**What should be included?**
- Files/components: [e.g. Dashboard.tsx, /api/workouts]
- Directories: [e.g. /src/components/dashboard]
- Features: [e.g. workout tracking system]
- Entire codebase: [Y/N]

## Specific Concerns
**Any particular issues you're worried about?**
- Performance bottlenecks
- Security vulnerabilities
- Maintainability problems
- Scalability issues
- Code duplication
- Complex logic that's hard to understand
- Other: ___________

## Context
**Background information:**
- Recent changes that might have introduced issues
- Known problems or user complaints
- Performance metrics or error reports
- Future plans that might affect this code

## Deliverables
**What do you want as output?**
- [ ] Detailed analysis report
- [ ] Prioritized list of improvements
- [ ] Refactoring plan with timeline
- [ ] Code examples of better approaches
- [ ] Implementation roadmap
- [ ] Risk assessment

## Timeline
**How urgent is this analysis?**
- [ ] Urgent - blocking other work
- [ ] Important - needed soon
- [ ] Nice to have - when time permits

---
@claude please conduct a thorough analysis using analysis scratchpads. Provide detailed findings with specific recommendations and implementation priorities.