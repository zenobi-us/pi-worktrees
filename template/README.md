# {{moduleName}}

{{description}}

> A Bun module created from the [bun-module](https://github.com/zenobi-us/bun-module) template

## Features

- 🏗️ TypeScript-based module architecture
- 🔧 Mise task runner integration
- 📦 Bun/npm build tooling
- ✨ ESLint + Prettier formatting
- 🧪 Vitest testing setup
- 🚀 GitHub Actions CI/CD
- 📝 Release automation with release-please

## Getting Started

1. **Clone this template:**

   ```bash
   cp -r bun-module your-module-name
   cd your-module-name
   ```

2. **Update package.json:**
   - Change `name` to your module name
   - Update `description`
   - Update `repository.url`

3. **Install dependencies:**

   ```bash
   bun install
   ```

4. **Implement your module in `src/index.ts`:**

   ```typescript
   export function hello(name: string): string {
     return `Hello, ${name}!`;
   }
   ```

5. **Test your module:**
   ```bash
   mise run test
   ```

## Development

- `mise run build` - Build the module
- `mise run test` - Run tests
- `mise run lint` - Lint code
- `mise run lint:fix` - Fix linting issues
- `mise run format` - Format code with Prettier

## Author

{{authorName}} <{{authorEmail}}>

## Repository

{{repositoryUrl}}

## Contributing

Contributions are welcome! Please file issues or submit pull requests on the GitHub repository.

## License

MIT License. See the [LICENSE](LICENSE) file for details.
