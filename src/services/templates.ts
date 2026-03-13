import { homedir } from 'os';

export interface TemplateContext {
  path: string;
  name: string;
  branch: string;
  project: string;
  mainWorktree: string;
}

export function expandTemplate(template: string, ctx: TemplateContext): string {
  return template
    .replace(/\{\{path\}\}/g, ctx.path)
    .replace(/\{\{name\}\}/g, ctx.name)
    .replace(/\{\{branch\}\}/g, ctx.branch)
    .replace(/\{\{project\}\}/g, ctx.project)
    .replace(/\{\{mainWorktree\}\}/g, ctx.mainWorktree)
    .replace(/^~/, homedir());
}
