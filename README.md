# Bun Module Generator

Generate a new Bun module in seconds!

This is a generator repository for creating new Bun modules. It provides a starter template with all the scaffolding you need to build and publish Bun modules.

## Quick Start

### 1. Use this template

Click "Use this template" on GitHub or clone it:

```bash
git clone https://github.com/zenobi-us/bun-module.git my-module
cd my-module
```

### 2. Run the generator

```bash
./setup.sh
```

### 3. Answer the prompts

The generator will ask for:

- **Module name** - kebab-case identifier (e.g., `my-awesome-module`)
- **Description** - What your module does
- **Author name** - Your name
- **Author email** - Your email
- **Repository URL** - GitHub repo URL
- **GitHub org/username** - For workflow configuration

### 4. Start developing!

```bash
cd my-module
bun install
mise run build
```

## What You Get

After running the generator, you'll have:

- ✅ TypeScript setup with modern tooling
- ✅ ESLint + Prettier configuration
- ✅ GitHub Actions workflows (build, lint, release)
- ✅ Bun module scaffolding
- ✅ Ready-to-use test setup
- ✅ Clean git history with initial commit

The generator cleans itself up - no template files or setup script left behind!

### 5. Setup publishing

This repo encouranges using [release-please](http://github.com/googleapis/release-please) for automated releases.

However, before you can rely on that, you need to set up a few things:

1. Manually publish the first version to npm:

   ```bash
   mise run publish
   ```

2. Follow the instructions in `./template/RELEASE.md` to set up this repository with npm trusted publishing.


## Usage

```bash
# Generate a new module (interactive prompts)
./setup.sh generate

# Show help
./setup.sh help

# Show version
./setup.sh version
```

### Non-Interactive Mode

You can skip prompts by setting environment variables with the `BUNMODULE_` prefix:

```bash
# Provide all values via environment variables
BUNMODULE_MODULENAME="my-awesome-module" \
BUNMODULE_DESCRIPTION="An awesome Bun module" \
BUNMODULE_AUTHORNAME="John Doe" \
BUNMODULE_AUTHOREMAIL="john@example.com" \
BUNMODULE_REPOSITORYURL="https://github.com/username/my-awesome-module" \
BUNMODULE_GITHUBORG="username" \
./setup.sh generate
```

**Available Environment Variables:**
- `BUNMODULE_MODULENAME` - Module name (kebab-case)
- `BUNMODULE_DESCRIPTION` - Module description
- `BUNMODULE_AUTHORNAME` - Author name
- `BUNMODULE_AUTHOREMAIL` - Author email
- `BUNMODULE_REPOSITORYURL` - Repository URL
- `BUNMODULE_GITHUBORG` - GitHub organization/username

This is useful for:
- CI/CD pipelines
- Automated module generation
- Scripted workflows

## Project Structure

Generated modules have this structure:

```
my-module/
├── src/
│   ├── index.ts          # Module entry point
│   └── something/else.ts # All the things! 
├── .github/
│   └── workflows/        # CI/CD workflows
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config
└── README.md             # Your module's documentation
```

## Development

### Available Scripts

```bash
bun install          # Install dependencies
mise run setup       # Initial setup
mise run build       # Build the module
mise run test        # Run tests
mise run lint        # Lint code
mise run lint:fix    # Fix linting issues
mise run format      # Format code with Prettier
mise run pkgjsonlint # Lint package.json
mise run prepare     # Prepare for release
mise run publish     # Publish the module
mise run version     # Manage version
```

### Publishing

See [RELEASE.md](template/RELEASE.md) for publishing and release management details.

**TL;DR:** Push single commits to main with [conventional commit format](https://www.conventionalcommits.org/). Release-please will accumulate changes in a release PR. When this release PR is merged, a new minor version is released and published to npm. Until then, all other commits on main result in patch builds being published.

## Learn More

- [Bun Documentation](https://bun.sh)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules)

## License

MIT

## Support

Need help?

- Check the [Bun documentation](https://bun.sh)
- Open an issue on [GitHub](https://github.com/zenobi-us/bun-module/issues)
- Review the [template documentation](template/README.md)
