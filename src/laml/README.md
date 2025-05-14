# LAML – Lightweight **Approximate** Markup Language

> **LAML** is a YAML‑inspired, indentation‑based micro‑language designed to make
> structured outputs from Large Language Models (LLMs) _easy to prompt for and
> easy to parse_, while being tolerant of the kinds of “almost right” formatting
> mistakes that LLMs occasionally produce.

---

## ✨ Why LAML?

1. **LLM‑friendly** – LAML is concise enough to embed inside a system prompt
   without blowing out the token budget.
2. **Single‑source protocol** – Define your data contract once with the
   TypeScript `ProtocolBuilder`; the same definition is
   - rendered into a human‑readable prompt snippet _and_
   - used by the runtime `Parser` to turn model output into safe, typed objects.
3. **Forgiving by design** – Missing quotes, extra whitespace, or minor
   punctuation slips are automatically corrected by the parser so you get usable
   data instead of an error.

## 🚀 Quick start

```ts
import { ProtocolBuilder, Parser } from "laml";

// 1️⃣  Define the output contract once
const protocol = ProtocolBuilder.new()
  .text({
    name: "title",
    description: "Blog post title",
  })
  .array({
    name: "tags",
    type: "text",
    description: "List of tags",
  })
  .build();

// 2️⃣  Use it in your prompt
const prompt = `Please answer in this format:\n\n${protocol.toString()}`;

// …send the prompt to your favourite model…

// 3️⃣  Parse the model response
const parser = new Parser({ protocol });
const result = parser.parse(llmResponse);
console.log(result);
/*
{
  title: "Hello, world!",
  tags: ["typescript", "laml"]
}
*/
```
