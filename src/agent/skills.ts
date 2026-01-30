import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

export interface Skill {
    name: string;
    content: string;
    metadata: Record<string, any>;
}

export class SkillLoader {
    private skillsDir: string;
    private context: Record<string, any>;

    constructor(skillsDir: string, context: Record<string, any> = {}) {
        this.skillsDir = skillsDir;
        this.context = context;
    }

    async loadSkills(): Promise<Skill[]> {
        const skills: Skill[] = [];

        // Ensure directory exists
        if (!fs.existsSync(this.skillsDir)) {
            console.log(`Skills directory not found at ${this.skillsDir}, creating it...`);
            fs.mkdirSync(this.skillsDir, { recursive: true });
            return [];
        }

        // Find all markdown files in skills directory (recursive)
        const files = await glob('**/*.md', { cwd: this.skillsDir });

        for (const file of files) {
            const filePath = path.join(this.skillsDir, file);
            const rawContent = fs.readFileSync(filePath, 'utf-8');

            // Parse frontmatter
            const { content, data } = matter(rawContent);

            // Skip disabled skills
            if (data.disabled) continue;

            // Use the directory name or filename as the skill name
            // e.g. "payment_manager/SKILL.md" -> "payment_manager"
            const name = path.dirname(file) === '.' ? path.basename(file, '.md') : path.dirname(file);

            skills.push({
                name,
                content: this.injectContext(content),
                metadata: data
            });
        }

        return skills;
    }

    private injectContext(content: string): string {
        return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
            return this.context[key] !== undefined ? String(this.context[key]) : match;
        });
    }

    formatSkillsForSystemPrompt(skills: Skill[]): string {
        if (skills.length === 0) return "";

        return `
## AVAILABLE SKILLS
The following specific skills and procedures have been loaded into your memory. 
You should follow these instructions when the user's request matches the skill context.

${skills.map(skill => `
<skill name="${skill.name}" description="${skill.metadata.description || ''}">
${skill.content}
</skill>
`).join('\n')}
    `;
    }
}
