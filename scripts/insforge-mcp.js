// Helper script to call Insforge MCP tools directly
const { spawn } = require('child_process');

const API_KEY = 'ik_cd28dfa48f5d0b50871fafcf35959307';
const API_BASE_URL = 'https://97k43jb9.us-west.insforge.app';

function callMcp(toolName, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['-y', '@insforge/mcp@latest'], {
      env: { ...process.env, API_KEY, API_BASE_URL },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let out = '';
    let err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });

    // Wait for MCP to initialize, then send the tool call
    setTimeout(() => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: toolName, arguments: args }
      };
      proc.stdin.write(JSON.stringify(request) + '\n');
    }, 3000);

    setTimeout(() => {
      proc.kill();
      // Parse the JSON-RPC response from stdout
      try {
        const lines = out.split('\n').filter(l => l.trim().startsWith('{'));
        for (const line of lines) {
          const parsed = JSON.parse(line);
          if (parsed.result) {
            resolve(parsed.result);
            return;
          }
          if (parsed.error) {
            reject(new Error(JSON.stringify(parsed.error)));
            return;
          }
        }
        reject(new Error('No valid response. stdout: ' + out.substring(0, 500) + ' stderr: ' + err.substring(0, 500)));
      } catch (e) {
        reject(new Error('Parse error: ' + e.message + ' stdout: ' + out.substring(0, 500)));
      }
    }, 15000);
  });
}

// Run from command line: node insforge-mcp.js <tool> <json-args>
const tool = process.argv[2];
const args = process.argv[3] ? JSON.parse(process.argv[3]) : {};

callMcp(tool, args).then(result => {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
