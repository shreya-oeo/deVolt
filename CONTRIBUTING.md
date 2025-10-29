# Contributing to DeVolt

Thank you for your interest in contributing to DeVolt! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git
- MongoDB Atlas account
- Solana wallet
- Basic knowledge of React, TypeScript, and blockchain concepts

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/devolt.git
   cd devolt
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Fill in your configuration
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## Development Process

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```bash
feat(auth): add Web3 wallet integration
fix(charging): resolve session timeout issue
docs(api): update endpoint documentation
```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` type - use proper typing
- Use meaningful variable and function names

```typescript
// Good
interface ChargingSession {
  id: string;
  stationId: string;
  startTime: Date;
  status: 'active' | 'completed' | 'cancelled';
}

// Bad
interface Session {
  id: any;
  station: string;
  time: any;
  status: string;
}
```

### React Components

- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript for prop types
- Follow single responsibility principle

```typescript
// Good
interface ChargingStationProps {
  station: ChargingStation;
  onSelect: (stationId: string) => void;
}

export const ChargingStationCard: React.FC<ChargingStationProps> = ({
  station,
  onSelect
}) => {
  return (
    <div className="station-card">
      {/* Component content */}
    </div>
  );
};
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use semantic class names for custom CSS
- Maintain consistent spacing and typography

```tsx
// Good
<div className="flex flex-col space-y-4 p-6 bg-gray-900 rounded-xl">
  <h2 className="text-xl font-bold text-white">Station Name</h2>
  <p className="text-gray-400">Station details</p>
</div>
```

### API Routes

- Use proper HTTP status codes
- Implement comprehensive error handling
- Validate input data with Zod schemas
- Follow RESTful conventions

```typescript
// Good
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    
    const result = await processData(validatedData);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Guidelines

### Unit Tests

- Write tests for all utility functions
- Test React components with React Testing Library
- Aim for >80% code coverage
- Use descriptive test names

```typescript
describe('calculateChargingCost', () => {
  it('should calculate correct cost for standard rate', () => {
    const result = calculateChargingCost(25, 0.28);
    expect(result).toBe(7.00);
  });

  it('should handle zero energy consumption', () => {
    const result = calculateChargingCost(0, 0.28);
    expect(result).toBe(0);
  });
});
```

### Integration Tests

- Test API endpoints with realistic data
- Mock external services (Solana, MongoDB)
- Test error scenarios and edge cases

### E2E Tests

- Test critical user flows
- Use Playwright or Cypress
- Test on multiple browsers and devices

## Pull Request Process

### Before Submitting

1. Ensure all tests pass:
   ```bash
   npm run test
   npm run type-check
   npm run lint
   ```

2. Update documentation if needed
3. Add tests for new functionality
4. Ensure code follows style guidelines

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
```

### Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. Address all review comments
4. Squash commits before merging

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## Development Guidelines

### Performance

- Optimize bundle size with code splitting
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets

### Security

- Validate all user inputs
- Use environment variables for secrets
- Implement proper error handling
- Follow Web3 security best practices

### Accessibility

- Use semantic HTML elements
- Implement proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers

### Blockchain Integration

- Handle network errors gracefully
- Implement proper transaction confirmation
- Use appropriate gas/fee estimation
- Provide clear transaction status

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)

### Tools
- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [React Developer Tools](https://reactjs.org/blog/2019/08/15/new-react-devtools.html)
- [Solana Explorer](https://explorer.solana.com/)
- [MongoDB Compass](https://www.mongodb.com/products/compass)

### Community
- [Discord](https://discord.gg/devolt) - Development discussions
- [GitHub Discussions](https://github.com/devolt/web/discussions) - Feature requests and ideas

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor appreciation posts

Thank you for contributing to DeVolt!