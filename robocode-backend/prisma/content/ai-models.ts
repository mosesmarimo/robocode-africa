import { md, code, mermaid, callout, body, type CourseModule } from "./types";

// ---------------------------------------------------------------------------
// Lesson code snippets (kept as template literals for readability)
// ---------------------------------------------------------------------------

const CLAUDE_CODE = `# pip install anthropic
# export ANTHROPIC_API_KEY="your-key-here"

import anthropic

# Create a client — it reads ANTHROPIC_API_KEY from the environment automatically
client = anthropic.Anthropic()

# Send a message to Claude and get a reply
message = client.messages.create(
    model="claude-sonnet-4-5",   # or claude-opus-4-5 / claude-haiku-4-5
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Explain what a neural network is in two sentences, for a 14-year-old."
        }
    ]
)

# The reply text lives in message.content[0].text
print(message.content[0].text)
`;

const GPT_CODE = `# pip install openai
# export OPENAI_API_KEY="your-key-here"

from openai import OpenAI

# Create a client — reads OPENAI_API_KEY from the environment
client = OpenAI()

# Send a chat completion request
response = client.chat.completions.create(
    model="gpt-4o-mini",      # fast and cheap; swap for gpt-4o for harder tasks
    max_tokens=1024,
    messages=[
        {
            "role": "system",
            "content": "You are a helpful coding tutor for teenage programmers."
        },
        {
            "role": "user",
            "content": "What is the difference between a list and a tuple in Python?"
        }
    ]
)

# The reply is in the first choice
print(response.choices[0].message.content)
`;

const OLLAMA_CODE = `# 1. Install Ollama from https://ollama.com and run it in the background.
# 2. Pull a model once:  ollama pull llama3
# 3. pip install ollama

import ollama

# Ask a question — Ollama handles everything locally, no API key needed
response = ollama.chat(
    model="llama3",
    messages=[
        {
            "role": "user",
            "content": "Write a short poem about robots learning to paint."
        }
    ]
)

print(response["message"]["content"])

# ---- Alternative: plain HTTP (works with any language) ----
# import requests, json
#
# payload = {
#     "model": "llama3",
#     "messages": [{"role": "user", "content": "Hello, Llama!"}],
#     "stream": False
# }
# r = requests.post("http://localhost:11434/api/chat", json=payload)
# print(r.json()["message"]["content"])
`;

const LANGCHAIN_CODE = `# pip install langchain langchain-openai
# export OPENAI_API_KEY="your-key-here"

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# Create an LLM wrapper — LangChain normalises the API across providers
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

# Build a simple prompt and invoke the chain
messages = [
    SystemMessage(content="You are a friendly science teacher."),
    HumanMessage(content="What makes a robot 'intelligent'?"),
]

response = llm.invoke(messages)
print(response.content)

# ---- Chaining two steps with the pipe operator ----
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([
    ("system", "Summarise the following text in one sentence."),
    ("human", "{text}"),
])

chain = prompt | llm | StrOutputParser()

summary = chain.invoke({"text": "Artificial intelligence is the simulation of human intelligence processes by computer systems, including learning, reasoning, and self-correction."})
print(summary)
`;

const CLAUDE_AGENT_SDK_CODE = `# pip install anthropic
# The Claude Agent SDK is part of the 'anthropic' package.
# export ANTHROPIC_API_KEY="your-key-here"

import anthropic
import json

client = anthropic.Anthropic()

# --- Define a tool the agent can call ---
tools = [
    {
        "name": "get_weather",
        "description": "Return the current temperature for a given city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "The name of the city, e.g. Harare"
                }
            },
            "required": ["city"]
        }
    }
]

def get_weather(city: str) -> str:
    """Fake weather lookup — replace with a real API in production."""
    data = {"Harare": "24°C and sunny", "London": "12°C and cloudy", "Tokyo": "19°C and rainy"}
    return data.get(city, "Weather data not available for that city.")

# --- Agentic loop ---
messages = [{"role": "user", "content": "What is the weather like in Harare today?"}]

while True:
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        tools=tools,
        messages=messages,
    )

    # If Claude wants to use a tool, handle it
    if response.stop_reason == "tool_use":
        tool_uses = [b for b in response.content if b.type == "tool_use"]
        messages.append({"role": "assistant", "content": response.content})
        tool_results = []
        for tool_use in tool_uses:
            result = get_weather(**tool_use.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_use.id,
                "content": result,
            })
        messages.append({"role": "user", "content": tool_results})
    else:
        # Claude is done — print the final answer
        print(response.content[0].text)
        break
`;

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------

export const aiModels: CourseModule = {
  meta: {
    title: "Know Your Models",
    slug: "ai-models",
    track: "ai",
    level: "high",
    description:
      "AI models, agents and agent frameworks — what they are, real examples, and how to set each one up.",
    coverImage: "/covers/ai.svg",
    order: 40,
  },
  lessons: [
    // -------------------------------------------------------------------------
    // 1. What is a Model?
    // -------------------------------------------------------------------------
    {
      title: "What is a Model?",
      slug: "ai-models-what",
      estMinutes: 10,
      body: body(
        md(`## A program that learned from data

When people talk about an "AI model", they mean a computer program that was **trained** on a large collection of data so that it can make predictions or generate new content — without being given explicit rules for every situation.

Think of it like this: instead of a programmer writing *"if the photo contains pointy ears and whiskers, call it a cat"*, the programmer shows the model a million photos labelled "cat" or "not cat" and lets the model figure out the patterns on its own.

### Types of models

| Type | What it does | Examples |
|------|-------------|---------|
| **Classifier** | Puts input into a category | Spam filter, image tagger, sentiment analyser |
| **Large Language Model (LLM)** | Reads and generates human-like text | GPT, Claude, Gemini |
| **Image generation model** | Creates images from text prompts | DALL-E, Stable Diffusion, Midjourney |
| **Speech / audio model** | Transcribes or synthesises speech | Whisper, ElevenLabs |
| **Regression model** | Predicts a number | House price estimator, weather forecast |

### How training works

Training is the process of showing the model millions of examples and gradually adjusting its internal numbers — called **weights** — until it gets good at the task. Those weights are what get saved and shared as "the model". Running the model afterwards (making predictions) is called **inference**.

### Tokens and prompts

LLMs do not read text the way humans do. They first split text into small pieces called **tokens** — roughly a word, a word fragment, or a punctuation mark. The average English word is about 1.3 tokens. The chunk of text you send to the model is called a **prompt**; the model generates a reply one token at a time, always predicting the most sensible next token given everything that came before.`),
        mermaid(
          `flowchart LR
  A[Raw data\ne.g. text, images] --> B[Preprocessing\nclean & label]
  B --> C[Training\nadjust weights]
  C --> D{Good enough?}
  D -- No --> B
  D -- Yes --> E[Saved model\nweights file]
  E --> F[Inference\npredictions]`,
          "From raw data to a deployed model",
        ),
        callout(
          "info",
          "The weights file for a powerful LLM can be tens or hundreds of gigabytes. When you use Claude or GPT via an API, you are sending your prompt to a server that loads those weights and runs inference — you never download the model yourself.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // 2. What are Agents?
    // -------------------------------------------------------------------------
    {
      title: "What are Agents?",
      slug: "ai-models-agents",
      estMinutes: 10,
      body: body(
        md(`## Beyond chat: models that take action

A plain chatbot takes a prompt, produces a reply, and stops. That is useful, but it cannot browse the web, write and run code, or book a meeting. An **AI agent** can do all of those things, because it combines a model with extra capabilities:

| Component | What it provides |
|-----------|-----------------|
| **Model (LLM)** | The reasoning engine — reads context, decides what to do next |
| **Tools** | Functions the model can call — web search, code execution, file read/write, APIs |
| **Memory** | Stores past actions and results so the model can refer back to them |
| **Loop** | Keeps running until the goal is reached, not just until a single reply is produced |

### The agent loop

Every agent runs the same basic loop:

1. **Think** — the model reads the goal and its current context, and decides what to do next.
2. **Act** — the model either calls a tool (e.g. "search the web for X") or writes an answer.
3. **Observe** — the result of the tool call is fed back to the model as new context.
4. **Repeat** — steps 1–3 continue until the model decides the goal is complete.

This is sometimes called the **ReAct** pattern (Reason + Act).`),
        mermaid(
          `flowchart TD
  G([Goal / user request]) --> T[Think\nmodel decides next step]
  T --> D{Need a tool?}
  D -- Yes --> A[Act\ncall tool]
  A --> O[Observe\nread tool result]
  O --> T
  D -- No --> R([Reply / final answer])`,
          "The agent loop: think → act → observe → repeat",
        ),
        callout(
          "tip",
          "Agent vs chatbot: a chatbot answers questions in one shot. An agent pursues a multi-step goal, using tools and memory to take real actions in the world — like a junior assistant who can actually run errands, not just give advice.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // 3. Agent Frameworks
    // -------------------------------------------------------------------------
    {
      title: "What are Agent Frameworks?",
      slug: "ai-models-agent-frameworks",
      estMinutes: 10,
      body: body(
        md(`## Libraries that do the plumbing for you

Building an agent from scratch means wiring up the model, defining tools, implementing the loop, handling errors, storing memory, and orchestrating multiple agents if needed. That is a lot of boilerplate. **Agent frameworks** package all of that up so you can focus on what your agent actually does.

### What a framework gives you

- **Tool registry** — a standard way to define functions the model can call, with automatic schema generation.
- **Loop management** — runs the think → act → observe cycle and stops when the model says it is done.
- **Memory and context management** — decides what to keep in the prompt window as conversations grow long.
- **Orchestration** — coordinates multiple specialised agents working together on a bigger task.
- **Integrations** — pre-built connectors to databases, vector stores, search engines, and hundreds of APIs.

### Popular frameworks

| Framework | Made by | Strengths |
|-----------|---------|-----------|
| **LangChain** | LangChain, Inc. | Huge ecosystem; chains and agents; many integrations |
| **LlamaIndex** | LlamaIndex, Inc. | Specialised in retrieval-augmented generation (RAG) over your own documents |
| **CrewAI** | CrewAI, Inc. | Multi-agent "crews" with defined roles — great for complex pipelines |
| **Claude Agent SDK** | Anthropic | First-party SDK for building agents powered by Claude, with native tool-use |
| **OpenAI Agents SDK** | OpenAI | First-party SDK for agents powered by GPT models, with tracing and handoffs |

Frameworks are not magic — they all ultimately call an LLM API in a loop. But they save you weeks of work and give you battle-tested patterns for common problems.`),
        mermaid(
          `flowchart LR
  subgraph Framework
    direction TB
    TL[Tool registry] --> LP[Agent loop]
    MEM[Memory store] --> LP
    OR[Orchestrator] --> LP
  end
  U([Your code]) --> Framework
  Framework --> API[LLM API\nClaude / GPT / Gemini ...]
  API --> Framework`,
          "A framework sits between your code and the LLM API",
        ),
        callout(
          "info",
          "Which framework should you use? If you are new, start with the official SDK for the model you choose (Claude Agent SDK or OpenAI Agents SDK). Move to LangChain or CrewAI when you need richer integrations or multi-agent coordination.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // 4. Popular AI Models
    // -------------------------------------------------------------------------
    {
      title: "Popular AI Models",
      slug: "ai-models-popular",
      estMinutes: 8,
      body: body(
        md(`## The major model families

The AI landscape moves fast, but a handful of model families dominate in 2025–2026. Here is a quick map:

| Family | Creator | Open or Closed? | Strengths | Typical uses |
|--------|---------|----------------|-----------|-------------|
| **GPT** (GPT-4o, o1, o3) | OpenAI | Closed | Excellent reasoning; huge ecosystem; multimodal | Coding, writing, complex Q&A, agents |
| **Claude** (Opus, Sonnet, Haiku) | Anthropic | Closed | Long context; safe by design; strong code & analysis | Research, document analysis, agents |
| **Gemini** (Ultra, Pro, Flash) | Google | Closed | Deep Google integration; fast; multimodal | Search, productivity, mobile |
| **Llama** (Llama 3, Llama 3.1+) | Meta | **Open-weight** | Free to download and run; highly customisable | Self-hosted, fine-tuning, research |
| **Mistral** (7B, Mixtral, Large) | Mistral AI | Open-weight / Closed API | Efficient; strong for smaller models | Edge deployment, European data residency |

### Tiers within a family

Most providers offer a **family of tiers** rather than a single model:

- **Flagship / Opus** — most capable, slower, more expensive (e.g. Claude Opus, GPT-4o, Gemini Ultra)
- **Mid-tier / Sonnet** — good balance of speed and intelligence (e.g. Claude Sonnet, Gemini Pro)
- **Fast / Haiku / Flash / Mini** — quickest and cheapest, best for simple tasks (e.g. Claude Haiku, GPT-4o mini, Gemini Flash)

Choosing the right tier matters: using a flagship model for a simple task wastes money; using a fast model for complex reasoning may give poor results.`),
        callout(
          "info",
          "Open-weight vs closed: an open-weight model (like Llama) lets you download the weights and run it on your own hardware — no API key, no data sent to a third party. A closed model (like GPT or Claude) is only accessible through a paid API. Open-weight models are great for privacy and cost control; closed models are usually more powerful for the same compute budget.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // 5. Example: Using Claude (Anthropic)
    // -------------------------------------------------------------------------
    {
      title: "Example: Using Claude (Anthropic)",
      slug: "ai-models-claude",
      estMinutes: 12,
      body: body(
        md(`## Claude — Anthropic's AI assistant

**Claude** is Anthropic's family of large language models, designed with a focus on safety, helpfulness, and honesty. It handles very long documents (up to 200 000 tokens in a single request), excels at coding and analysis, and supports native tool-use for building agents.

### Model tiers (2025–2026)

| Model | Use for |
|-------|---------|
| **claude-opus-4-5** | Most capable; complex reasoning, research |
| **claude-sonnet-4-5** | Best balance of speed and intelligence |
| **claude-haiku-4-5** | Fastest and cheapest; simple tasks |

### Setup

\`\`\`bash
pip install anthropic
export ANTHROPIC_API_KEY="sk-ant-..."   # get yours at console.anthropic.com
\`\`\`

The client automatically reads \`ANTHROPIC_API_KEY\` from the environment, so you never have to hard-code a secret in your code.`),
        code("python", CLAUDE_CODE, { filename: "hello_claude.py", openInStudio: true }),
        md(`### Key points

- **\`model\`** — which Claude tier to use (see table above).
- **\`max_tokens\`** — the maximum number of tokens in the reply; set this to avoid runaway costs.
- **\`messages\`** — a list of role/content pairs. Add a \`"system"\` message before the user turn to give Claude a persona or instructions.
- The reply text lives at \`message.content[0].text\` for plain-text responses.`),
        callout(
          "tip",
          "Start with claude-sonnet-4-5 — it is a great all-rounder. Switch to claude-haiku-4-5 if you need faster, cheaper responses for simple tasks, or upgrade to claude-opus-4-5 for the hardest reasoning problems.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // 6. Example: Using GPT (OpenAI)
    // -------------------------------------------------------------------------
    {
      title: "Example: Using GPT (OpenAI)",
      slug: "ai-models-gpt",
      estMinutes: 12,
      body: body(
        md(`## GPT — OpenAI's model family

**GPT-4o** and its variants are OpenAI's flagship multimodal models. They accept text, images, and audio as input, making them suitable for a wide range of applications. The \`gpt-4o-mini\` tier is fast and affordable, ideal for learning and prototyping.

### Setup

\`\`\`bash
pip install openai
export OPENAI_API_KEY="sk-..."   # get yours at platform.openai.com
\`\`\`

### How the messages list works

Unlike a simple question-answer API, the OpenAI chat completion API keeps the full **conversation history** in the \`messages\` list:

| Role | Purpose |
|------|---------|
| \`system\` | Sets the assistant's persona and constraints |
| \`user\` | The human's message |
| \`assistant\` | A previous reply from the model (for multi-turn conversations) |

You can build a multi-turn chatbot by simply appending each new user message and each assistant reply to the list before calling the API again.`),
        code("python", GPT_CODE, { filename: "hello_gpt.py", openInStudio: true }),
        md(`### Key points

- **\`model\`** — \`"gpt-4o-mini"\` is cheap and fast; \`"gpt-4o"\` is more powerful.
- **\`max_tokens\`** — caps the reply length.
- **\`temperature\`** (0–2, default 1) — lower values make replies more focused and deterministic; higher values make them more creative.
- The reply text is at \`response.choices[0].message.content\`.`),
        callout(
          "tip",
          "OpenAI charges per token (input + output). Use max_tokens to avoid surprises, and prefer gpt-4o-mini for development and testing — it is typically 15× cheaper than gpt-4o for the same number of tokens.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // 7. Example: Running Llama locally with Ollama
    // -------------------------------------------------------------------------
    {
      title: "Example: Running Llama locally with Ollama",
      slug: "ai-models-ollama",
      estMinutes: 12,
      body: body(
        md(`## Llama + Ollama — AI that runs on your own machine

**Llama** is Meta's open-weight language model family. Because the weights are publicly released, anyone can download and run Llama on their own hardware — no API key, no internet connection, no per-token cost.

**Ollama** is a free desktop app (Mac, Windows, Linux) that makes running open-weight models as simple as a single command. It handles model downloads, GPU/CPU routing, and exposes a local HTTP API that is compatible with the OpenAI format.

### Setup

\`\`\`bash
# 1. Download and install Ollama from https://ollama.com
#    It runs as a background service automatically.

# 2. Pull the Llama 3 model (about 4 GB for the 8B version)
ollama pull llama3

# 3. Install the Python client
pip install ollama
\`\`\`

You can also chat directly in the terminal:

\`\`\`bash
ollama run llama3
\`\`\`

Type \`/bye\` to exit.`),
        code("python", OLLAMA_CODE, { filename: "hello_llama.py", openInStudio: true }),
        md(`### Choosing a model size

| Model | RAM needed | Speed | Quality |
|-------|-----------|-------|---------|
| Llama 3 8B | ~6 GB | Fast | Good for most tasks |
| Llama 3 70B | ~48 GB | Slow | Near GPT-4 quality |
| Mistral 7B | ~5 GB | Very fast | Great for coding |
| Phi-3 Mini | ~3 GB | Very fast | Good for simple tasks |

Most student laptops can run the 8B models comfortably.`),
        callout(
          "tip",
          "Running models locally means your data never leaves your computer — ideal for private documents or offline use. The trade-off is that local models are generally less capable than the best cloud models, and large models need a powerful GPU to run at a useful speed.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // 8. Example: LangChain
    // -------------------------------------------------------------------------
    {
      title: "Example: LangChain (agent framework)",
      slug: "ai-models-langchain",
      estMinutes: 14,
      body: body(
        md(`## LangChain — composable AI pipelines

**LangChain** is one of the most widely used AI frameworks. Its core idea is the **chain**: a sequence of steps where the output of one step becomes the input to the next. Chains can be simple (prompt → LLM → parse output) or complex (retrieve documents → summarise → translate → format as JSON).

LangChain also provides:

- **Agents** that use tools (web search, code execution, calculators) in a loop.
- **Retrievers** that search vector databases for relevant documents (RAG — Retrieval-Augmented Generation).
- **Memory** classes that store conversation history.
- **Integrations** with over 100 LLM providers, databases, and APIs.

### When to use LangChain

- You want to combine multiple LLM calls in a pipeline.
- You need to search your own documents before answering (RAG).
- You are building a chatbot that remembers past messages.
- You want to switch between LLM providers without rewriting your code.

### Setup

\`\`\`bash
pip install langchain langchain-openai
export OPENAI_API_KEY="sk-..."
\`\`\``),
        code("python", LANGCHAIN_CODE, { filename: "hello_langchain.py", openInStudio: true }),
        md(`### The pipe operator (\`|\`)

LangChain's modern interface uses the \`|\` operator to chain steps together, the same way Unix shell pipes work. Each component knows how to pass its output to the next one:

\`\`\`
prompt | llm | output_parser
\`\`\`

This makes it easy to read and rearrange pipelines.`),
        callout(
          "info",
          "LangChain is powerful but can feel complex at first. Its documentation has improved a lot — start with the LangChain Expression Language (LCEL) tutorials at python.langchain.com. For simple single-model scripts, the raw SDK (openai or anthropic) is often cleaner.",
        ),
      ),
    },

    // -------------------------------------------------------------------------
    // 9. Example: Claude Agent SDK
    // -------------------------------------------------------------------------
    {
      title: "Example: Claude Agent SDK",
      slug: "ai-models-claude-agent-sdk",
      estMinutes: 15,
      body: body(
        md(`## Claude Agent SDK — first-party agents with tools

Anthropic's **tool-use** feature (built into the \`anthropic\` Python package) is Anthropic's official way to build agents. Rather than a separate library, it extends the standard \`client.messages.create()\` call with a \`tools\` parameter.

You define each tool as a JSON schema (name, description, input parameters), and Claude decides when to call it. Your code runs the function and feeds the result back. The loop continues until Claude gives a final answer without requesting any more tools.

### When to use the Claude Agent SDK

- You want the simplest possible agent setup without a third-party framework.
- You need tight control over the agent loop (e.g. rate-limiting, logging every step).
- You are building on top of Claude specifically and do not need multi-provider flexibility.
- You want to use Anthropic's extended thinking or very long context windows.

### Setup

\`\`\`bash
pip install anthropic           # the Claude Agent SDK is part of this package
export ANTHROPIC_API_KEY="sk-ant-..."
\`\`\`

The example below implements a complete agentic loop: Claude decides to call the \`get_weather\` tool, your code runs it, the result is fed back, and Claude produces a final answer.`),
        code("python", CLAUDE_AGENT_SDK_CODE, { filename: "claude_agent.py", openInStudio: true }),
        md(`### How tool results flow back

After Claude returns a \`tool_use\` block, you append two messages to the conversation:

1. The assistant's message containing the \`tool_use\` block (so Claude knows what it asked for).
2. A user message containing a \`tool_result\` block with the actual output.

This pattern is explicit and easy to debug — you can print every message to see exactly what Claude is "thinking".`),
        callout(
          "tip",
          "Real-world tools include web search, running Python code, reading files, querying databases, and calling any REST API. Start simple — a single tool that does one thing clearly — then add more tools once the loop is working correctly.",
        ),
      ),
    },
  ],
};
