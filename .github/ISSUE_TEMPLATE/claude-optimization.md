---
name: Claude Performance/Optimization
about: Request performance improvements or code optimization
title: '[OPTIMIZATION] '
labels: ['performance', 'claude-task']
assignees: []
---

## Performance Issue
**What's slow or inefficient?**
Describe the performance problem you're experiencing.

## Current Metrics
**How bad is it currently?**
- Load time: [e.g. 3-4 seconds]
- Bundle size: [e.g. 2MB]
- Database query time: [e.g. 500ms]
- Memory usage: [e.g. high on mobile]

## Target Performance
**What's your performance goal?**
- Target load time: [e.g. <1 second]
- Target bundle size: [e.g. <1MB]
- Target query time: [e.g. <100ms]

## Suspected Areas
**Where do you think the problem might be?**
- [ ] Database queries (N+1, missing indexes)
- [ ] Large JavaScript bundles
- [ ] Inefficient React re-renders
- [ ] Heavy API calls
- [ ] Image/asset optimization
- [ ] CSS/styling performance
- [ ] Other: ___________

## Affected Areas
**Which parts of the app are affected?**
- Components: [e.g. Dashboard, WorkoutList]
- Pages: [e.g. /dashboard, /workouts]
- User flows: [e.g. login to dashboard]

## Device/Context
**Where is performance worst?**
- Mobile devices: [Y/N]
- Slow connections: [Y/N]  
- Specific browsers: [Y/N]
- Large datasets: [Y/N]

## Success Criteria
**How will we know it's fixed?**
- [ ] Lighthouse score improvement
- [ ] User-reported speed improvement
- [ ] Specific metric targets met
- [ ] Bundle analyzer shows reduction

---
@claude please analyze this performance issue systematically. Use analysis scratchpads to investigate the root causes, then implement optimizations with measurable improvements.