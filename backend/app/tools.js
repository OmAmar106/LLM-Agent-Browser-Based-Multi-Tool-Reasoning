import { llm_call,askToolChoice } from "./llmcall.js";
import { VM } from 'vm2';

export async function runSandboxedJS(code) {
    const logs = [];

    const vm = new VM({
        timeout: 2000,
        sandbox: {
            console: {
                log: (...args) => logs.push(args.join(' ')),
                warn: (...args) => logs.push(args.join(' ')),
                error: (...args) => logs.push(args.join(' ')),
                info: (...args) => logs.push(args.join(' ')),
            }
        }
    });

    try {
        await vm.run(`(async () => { ${code} })()`);
    } catch (err) {
        logs.push(`Error: ${err.message}`);
    }

    return logs.join('\n');
}


export async function GoogleSearch(message,googleApiKey,cx) {
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${cx}&q=${encodeURIComponent(message)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const results = data.items.slice(0, 3).map(item => {
            return `${item.title}\n${item.snippet}\n${item.link}`;
        });

        return results.join("\n\n");
    } catch (err) {
        console.error("GoogleSearch error:", err);
        return "Error fetching search results.";
    }

}

export async function generateAgentResponse(userMessage, apiKey, googleapi, model,cx) {
    // this.runSandboxedJS(userMessage).then(result => { return result }).catch(err => { console.error(err); return err; })
    // if i need a code execution output! -> provide runSandboxedJs, google search and llm call to the llm and ask which we should use.
    // add the calls used to final answer
    const tools = await askToolChoice(userMessage, model, { [model]: apiKey });
    // console.log(tools);

    const results = [];
    const toolsUsed = [];

    for (const step of tools) {
        let output;
        if (step.tool === "runSandboxedJS") {
            output = await runSandboxedJS(step.input);
        } else if (step.tool === "GoogleSearch") {
            output = await GoogleSearch(step.input, googleapi,cx);
        } else {
            output = await llm_call(step.input, model, { [model]: apiKey });
        }
        results.push(output);
        toolsUsed.push(step.tool);
    }

    // Combine all outputs first, then append tools used at the end
    // console.log(`${results.join('\n\n')}\n\nTools Used: `+JSON.stringify(toolsUsed))
    return `${results.join('\n\n')}\n\nTools Used: `+JSON.stringify(toolsUsed);
}
