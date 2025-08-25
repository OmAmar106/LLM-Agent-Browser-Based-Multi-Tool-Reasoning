import { llm_call } from "./llmcall.js";

export function runSandboxedJS(code) {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.setAttribute("sandbox", "allow-scripts");
        document.body.appendChild(iframe);

        function cleanup() {
            window.removeEventListener("message", onMessage);
            document.body.removeChild(iframe);
        }

        function onMessage(event) {
            if (event.source !== iframe.contentWindow) return;
            const { type, value } = event.data;

            if (type === "log") {
                console.log("[sandbox]", ...value);
                return;
            }
            if (type === "error") {
                cleanup();
                reject(new Error(value));
            }
            if (type === "result") {
                cleanup();
                resolve(value);
            }
        }

        window.addEventListener("message", onMessage);

        const injected = `
            <script>
                (async () => {
                    const send = (type, value) => parent.postMessage({ type, value }, "*");

                    ["log","warn","error","info"].forEach(fn => {
                        console[fn] = (...args) => {
                            send("log", [fn, ...args]);
                        };
                    });

                    try {
                        const result = await (async function() {
                            ${code}
                        })();
                        send("result", result);
                    } catch (e) {
                        send("error", e.message);
                    }
                })();
            <\/script>
        `;

        iframe.srcdoc = injected;
    });
}

export function GoogleSearch(message){

}

export async function generateAgentResponse(userMessage,apiKey,googleapi,model) {
    console.log(model)
    // this.runSandboxedJS(userMessage).then(result => { return result }).catch(err => { console.error(err); return err; })
    // if i need a code execution output! -> provide runSandboxedJs, google search and llm call to the llm and ask which we should use.
    // add the calls used to final answer
    let arr = [];
    return "Tools Used: " + JSON.stringify(arr);
}