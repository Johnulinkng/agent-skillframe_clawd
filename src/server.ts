import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { AgentEngine } from './agent/engine';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const port = process.env.PORT || 3000;
const workspaceRoot = process.cwd(); // Or specific path
const skillsDir = path.join(workspaceRoot, 'skills');

if (!process.env.OPENAI_API_KEY) {
    console.error("Markdown: ERROR: OPENAI_API_KEY is missing in .env");
    process.exit(1);
}

const agent = new AgentEngine(process.env.OPENAI_API_KEY, workspaceRoot, skillsDir);

app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        await agent.run(message, history || [], (chunk) => {
            res.write(chunk);
        }, req.body.context || {});
        res.end();
    } catch (err: any) {
        console.error(err);
        res.write(`\n[Error: ${err.message}]`);
        res.end();
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`- Skills dir: ${skillsDir}`);
});
