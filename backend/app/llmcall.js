
export async function llm_call(prompt, ty, keys) {
     const headers = {
        "Authorization": `Bearer ${keys[ty]}`,
        "Content-Type": "application/json"
    };

    const payload = {
        "model": "openai/gpt-4.1",
        "messages": [
            {
                "role": "system",
                "content": `You must reply to what the user has asked, the reply should be concise and relevant.`
            },
        ].concat({role:"user",content:prompt})
    };

    const res = await fetch("https://aipipe.org/openrouter/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

export let conversation = [
            {
                "role": "system",
                "content": `You are a tool selector. 
                            User will ask something. 
                            Decide which tools to use (one or more). 
                            Return ONLY JSON array like:
                            [
                                {"tool":"GoogleSearch","input":"bitcoin price"},
                                {"tool":"llm_call","input":"The Question the User Asked along with the context"}
                                {"tool":"runSandboxedJS","input":"console.log(1+1)"}
                            ]`
            },
        ]

export async function askToolChoice(prompt, ty, keys) {
    
    conversation.push({role:"user",content:prompt})

    const headers = {
        "Authorization": `Bearer ${keys[ty]}`,
        "Content-Type": "application/json"
    };

    const payload = {
        "model": "openai/gpt-4.1",
        "messages": conversation
    };

    const res = await fetch("https://aipipe.org/openrouter/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    // console.log(data);
    let tools;
    try {
        tools = JSON.parse(data.choices[0].message.content);
    } catch {
        tools = [{ tool: "llm_call", input: prompt }];
    }
    // console.log(tools)
    conversation.push({role:"assistant",content:data.choices[0].message.content})
    if(conversation.length > 12) conversation.splice(1,2);

    return tools;
}

// export async function generateAgentResponse(userMessage, ty, keys, googleapi) {
//     const tool = await askToolChoice(userMessage, ty, keys);

//     let result;
//     if (tool.tool === "runSandboxedJS") {
//         result = await runSandboxedJS(tool.input);
//     } else if (tool.tool === "GoogleSearch") {
//         result = await GoogleSearch(tool.input, googleapi);
//     } else {
//         result = await llm_call(tool.input); // your existing LLM call
//     }

//     return {
//         toolsUsed: tool.tool,
//         answer: result
//     };
// }
