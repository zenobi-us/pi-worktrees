#!/bin/bash

set -euo pipefail

# ============================================================================
# Bun Module Template Setup Script
# ============================================================================
# Pure bash replacement for plopfile.js with discrete functions, exit traps,
# and subcommand routing
#
# Environment Variable Support:
# Set PREFIX_VARIABLENAME to provide defaults for prompts
# Example: BUNMODULE_AUTHORNAME="John Doe" ./setup.sh
#
readonly PREFIX="BUNMODULE"

# Script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly TEMPLATE_DIR="${SCRIPT_DIR}/template"
readonly VERSION="1.0.0"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Exit trap for cleanup and error handling
trap 'on_exit' EXIT
trap 'on_error' ERR

# ============================================================================
# Exit Traps & Error Handling
# ============================================================================

on_exit() {
	local exit_code=$?
	if [[ $exit_code -ne 0 ]]; then
		echo -e "${RED}✗ Setup failed with exit code $exit_code${NC}" >&2
	fi
	return $exit_code
}

on_error() {
	local line_no=$1
	echo -e "${RED}✗ Error at line $line_no${NC}" >&2
	return 1
}

die() {
	local msg="$1"
	echo -e "${RED}✗ $msg${NC}" >&2
	exit 1
}

warn() {
	local msg="$1"
	echo -e "${YELLOW}ℹ️  $msg${NC}"
}

success() {
	local msg="$1"
	echo -e "${GREEN}✓ $msg${NC}"
}

info() {
	local msg="$1"
	echo -e "${BLUE}ℹ️  $msg${NC}"
}

# ============================================================================
# Helper Functions
# ============================================================================

# Convert string to kebab-case
kebab_case() {
	local input="$1"
	echo "$input" |
		tr '[:upper:]' '[:lower:]' |
		sed 's/[^a-z0-9\s-]//g' |
		sed 's/[[:space:]_]\+/-/g' |
		sed 's/^-\+\|-\+$//g'
}

# Get git remote URL with fallback
get_git_remote() {
	if git config --get remote.origin.url 2>/dev/null; then
		return 0
	fi
	echo ""
}

# Validate module name (kebab-case, non-empty)
validate_plugin_name() {
	local name="$1"
	if [[ -z "$name" ]]; then
		die "Module name cannot be empty"
	fi
	echo "$name"
}

# Get value from environment variable ${PREFIX}_${1}
env_input() {
	local var_name="${PREFIX}_${1}"
	echo "${!var_name:-}"
}

# Prompt user for input with default, checking environment variable first
prompt_input() {
	local prompt_text="$1"
	local default_value="$2"
	local env_var_name="${3:-}" # Optional environment variable name
	local input
	local env_value=""

	# Check for environment variable if name provided
	if [[ -n "$env_var_name" ]]; then
		env_value=$(env_input "$env_var_name")
		if [[ -n "$env_value" ]]; then
			echo "$env_value"
			return 0
		fi
	fi

	read -p "$(echo -ne '? ')$prompt_text [$default_value]: " input
	echo "${input:-$default_value}"
}

# ============================================================================
# Template Application
# ============================================================================

apply_template() {
	local dest_dir="$1"
	local plugin_name="$2"
	local description="$3"
	local author_name="$4"
	local author_email="$5"
	local repository_url="$6"
	local github_org="$7"

	info "Applying template to $dest_dir"

	# Copy template files
	cp -r "$TEMPLATE_DIR"/* "$dest_dir/" 2>/dev/null || die "Failed to copy template files"
	cp -r "$TEMPLATE_DIR"/.[!.]* "$dest_dir/" 2>/dev/null || true
	success "Copied template files"

	# Replace variables in all files
	local files_to_process
	files_to_process=$(find "$dest_dir" -type f \
		-not -path "*/node_modules/*" \
		-not -path "*/.git/*" \
		-not -path "*/.mise/*")

	while IFS= read -r file; do
		# Skip binary files
		if file "$file" | grep -q "text"; then
			sed -i.bak \
				-e "s|{{moduleName}}|$plugin_name|g" \
				-e "s|{{description}}|$description|g" \
				-e "s|{{authorName}}|$author_name|g" \
				-e "s|{{authorEmail}}|$author_email|g" \
				-e "s|{{repositoryUrl}}|$repository_url|g" \
				-e "s|{{githubOrg}}|$github_org|g" \
				"$file"
			rm -f "$file.bak"
		fi
	done <<<"$files_to_process"

	success "Applied template variables"
}

# ============================================================================
# Git Operations
# ============================================================================

cleanup_git() {
	local project_dir="$1"

	info "Cleaning up generator files"

	# Remove old git directory
	if [[ -d "$project_dir/.git" ]]; then
		rm -rf "$project_dir/.git"
		success "Removed old .git directory"
	fi

	# Remove generator files
	for item in "template" "setup.sh"; do
		local item_path="$project_dir/$item"
		if [[ -e "$item_path" ]]; then
			rm -rf "$item_path"
			success "Removed $item"
		fi
	done
}

init_git_repo() {
	local project_dir="$1"
	local plugin_name="$2"
	local repository_url="$3"

	info "Initializing new git repository"

	# Initialize git with main branch
	git -C "$project_dir" init -b main >/dev/null 2>&1
	success "Created new git repository with main branch"

	# Stage all files
	git -C "$project_dir" add . >/dev/null 2>&1
	success "Staged all files"

	# Create initial commit
	local commit_msg="chore: initialize $plugin_name from bun-module template"
	git -C "$project_dir" commit -m "$commit_msg" >/dev/null 2>&1
	success "Created initial commit"

	# Add remote
	if git -C "$project_dir" remote add origin "$repository_url" 2>/dev/null; then
		success "Added remote origin"
	fi

	# Try to push (may fail if repo doesn't exist)
	if git -C "$project_dir" push -u origin main >/dev/null 2>&1; then
		success "Pushed to remote"
	else
		warn "Could not push to remote (repository may not exist yet)"
		echo "   Run this manually when ready: git push -u origin main"
	fi
}

# ============================================================================
# Main Generator Command
# ============================================================================

cmd_generate() {
	# Validate current directory
	local current_dir
	current_dir=$(pwd)

	if [[ ! -d "$TEMPLATE_DIR" ]]; then
		die "Template directory not found at $TEMPLATE_DIR"
	fi

	echo ""
	echo -e "${BLUE}🎉 Bun Module Template Generator${NC}"
	echo ""

	# Get git remote URL for default
	local default_remote
	default_remote=$(get_git_remote)
	[[ -z "$default_remote" ]] && default_remote="https://github.com/username/my-bun-module"

	# Gather user inputs
	local plugin_name
	plugin_name=$(prompt_input "Module name (kebab-case)" "my-bun-module" "MODULENAME")
	plugin_name=$(kebab_case "$plugin_name")
	validate_plugin_name "$plugin_name" >/dev/null

	local description
	description=$(prompt_input "Module description" "A Bun module" "DESCRIPTION")

	local author_name
	author_name=$(prompt_input "Author name" "Your Name" "AUTHORNAME")

	local author_email
	author_email=$(prompt_input "Author email" "you@example.com" "AUTHOREMAIL")

	local repository_url
	repository_url=$(prompt_input "Repository URL" "$default_remote" "REPOSITORYURL")

	local github_org
	github_org=$(prompt_input "GitHub organization/username" "username" "GITHUBORG")

	echo ""

	# Apply template with variables
	apply_template \
		"$current_dir" \
		"$plugin_name" \
		"$description" \
		"$author_name" \
		"$author_email" \
		"$repository_url" \
		"$github_org"

	# Cleanup and initialize git
	cleanup_git "$current_dir"
	init_git_repo "$current_dir" "$plugin_name" "$repository_url"

	mise trust >/dev/null 2>&1 || warn "Could not run 'mise trust'. Please ensure mise is installed."

	# Print success message and next steps
	echo ""
	echo -e "${GREEN}✨ Module generated successfully!${NC}"
	echo ""
	echo -e "${BLUE}Next steps:${NC}"
	echo "  1. Review package.json and update name/version as needed"
	echo "  2. Update README.md with your module details"
	echo "  3. Implement your module in src/"
	echo "  4. Run: bun install"
	echo "  5. Run: mise run build"
	echo "  6. Commit as chore: implement module"
	echo "  7. Run: mise run publish --tag next"
	echo "  8. Follow Trusted Publisher instructions in ./RELEASE.md"
	echo ""
}

# ============================================================================
# Help & Version Commands
# ============================================================================

cmd_help() {
	cat <<EOF
${BLUE}Bun Module Template Setup${NC}

${BLUE}Usage:${NC}
  ./setup.sh [command]

${BLUE}Commands:${NC}
  generate    Generate a new Bun module (default)
  help        Show this help message
  version     Show version information

${BLUE}Environment Variables:${NC}
  Set ${PREFIX}_VARIABLENAME to skip prompts and provide defaults:
  
  ${PREFIX}_MODULENAME        Module name (kebab-case)
  ${PREFIX}_DESCRIPTION       Module description
  ${PREFIX}_AUTHORNAME        Author name
  ${PREFIX}_AUTHOREMAIL       Author email
  ${PREFIX}_REPOSITORYURL     Repository URL
  ${PREFIX}_GITHUBORG         GitHub organization/username

${BLUE}Examples:${NC}
  ./setup.sh generate
  
  # Non-interactive mode using environment variables:
  BUNMODULE_MODULENAME="my-awesome-module" \\
  BUNMODULE_AUTHORNAME="John Doe" \\
  BUNMODULE_AUTHOREMAIL="john@example.com" \\
  ./setup.sh generate

${BLUE}Documentation:${NC}
  https://github.com/zenobi-us/bun-module

EOF
}

cmd_version() {
	echo "Bun Module Template Setup v$VERSION"
}

# ============================================================================
# Subcommand Router
# ============================================================================

main() {
	local cmd="${1:-generate}"

	case "$cmd" in
	generate)
		cmd_generate
		;;
	help | -h | --help)
		cmd_help
		;;
	version | -v | --version)
		cmd_version
		;;
	*)
		die "Unknown command: $cmd. Run './setup.sh help' for usage."
		;;
	esac
}

# ============================================================================
# Script Entry Point
# ============================================================================

main "$@"
