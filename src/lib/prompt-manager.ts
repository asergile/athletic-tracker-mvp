import { promises as fs } from 'fs';
import path from 'path';

// Prompt configuration and loader for Next.js
export class PromptManager {
  static async loadPrompt(category: string, version: string = 'current'): Promise<string> {
    // In Next.js, we need to resolve from the project root, not __dirname
    const promptPath = path.join(process.cwd(), 'prompts', category, `${version}.md`);
    
    try {
      const content = await fs.readFile(promptPath, 'utf8');
      return this.extractPromptFromMarkdown(content);
    } catch (error) {
      console.error(`Failed to load prompt: ${category}/${version}`);
      throw error;
    }
  }
  
  static extractPromptFromMarkdown(markdown: string): string {
    // Extract content between ```
    const match = markdown.match(/```\n([\s\S]*?)\n```/);
    return match ? match[1] : markdown;
  }
  
  static async listVersions(category: string): Promise<string[]> {
    const dir = path.join(process.cwd(), 'prompts', category);
    const files = await fs.readdir(dir);
    
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  }
}

// Usage in your app:
// const prompt = await PromptManager.loadPrompt('workout-processing');
// const versions = await PromptManager.listVersions('workout-processing');
