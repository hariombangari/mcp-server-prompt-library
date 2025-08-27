# Prompt Library MCP Server

A Model Context Protocol (MCP) server that provides a comprehensive prompt library for frontend developers. This server specializes in React, frontend best practices, and general coding guidelines, designed to enhance developer productivity through AI-powered assistance.

## Features

- **Categorized Prompt Library**: Organized prompts for React, Frontend (FE), and Common development practices
- **Multiple Retrieval Methods**: Get prompts by category, search by keywords, or combine multiple prompts
- **Cloudflare Workers Deployment**: Serverless architecture for global edge distribution
- **MCP Compatible**: Seamless integration with MCP clients and IDEs
- **Clean Architecture**: Structured for easy maintenance and extensibility

## Available Categories

### React
- **Component Creation**: Best practices for React functional components with TypeScript
- **State Management**: Guidelines for useState, useReducer, and context management

### Frontend (FE)
- **Performance Optimization**: Core Web Vitals, loading strategies, and runtime performance
- **Accessibility**: WCAG 2.1 guidelines and a11y best practices

### Common
- **Code Quality**: Clean code principles, SOLID principles, and testing strategies

## MCP Tools

### `get_categories`
Returns all available prompt categories in the library.

**Parameters:** None

### `get_prompts_by_category`
Retrieves all prompts from a specific category.

**Parameters:**
- `category` (enum): "react" | "fe" | "common"

### `get_prompt`
Retrieves a specific prompt by name and category.

**Parameters:**
- `category` (enum): "react" | "fe" | "common"
- `name` (string): Name of the prompt

### `combine_prompts`
Combines prompts from multiple categories into a single response.

**Parameters:**
- `categories` (array): Array of category names
- `separator` (string, optional): Custom separator between prompts (default: "\n\n---\n\n")

### `search_prompts`
Searches prompts by keyword across all or specific categories.

**Parameters:**
- `keyword` (string): Search term
- `categories` (array, optional): Limit search to specific categories

## Getting Started

### Prerequisites

- Node.js 18+
- A Cloudflare account with Workers access
- pnpm (recommended package manager)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Run the development server:

```bash
pnpm run dev
```

This will start the Wrangler development server locally.

### Deployment

Deploy to Cloudflare Workers:

```bash
pnpm run deploy
```

## Usage

Once deployed, connect to your MCP server using any MCP-compatible client:

- **MCP Endpoint**: `https://your-worker.your-subdomain.workers.dev/mcp`
- **SSE Endpoint**: `https://your-worker.your-subdomain.workers.dev/sse`

### Example Usage in IDE

```javascript
// Get all React prompts
await mcpClient.callTool("get_prompts_by_category", { category: "react" });

// Combine React and FE prompts for comprehensive guidance
await mcpClient.callTool("combine_prompts", { 
  categories: ["react", "fe"] 
});

// Search for performance-related prompts
await mcpClient.callTool("search_prompts", { 
  keyword: "performance" 
});
```

## Connect to Claude Desktop

You can connect to your remote MCP server from Claude Desktop using [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote).

Update Claude Desktop configuration in Settings > Developer > Edit Config:

```json
{
  "mcpServers": {
    "prompt-library": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"  // or your-worker.your-account.workers.dev/sse
      ]
    }
  }
}
```

Restart Claude and the prompt library tools will become available.

## Connect to Cloudflare AI Playground

You can test your MCP server from the Cloudflare AI Playground:

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (`your-worker.your-subdomain.workers.dev/sse`)
3. Use the prompt library tools directly from the playground!

## Architecture

This project uses:
- **Cloudflare Workers**: Serverless edge deployment for global availability
- **MCP SDK**: Model Context Protocol implementation for seamless integration
- **TypeScript**: Type safety and enhanced developer experience
- **Zod**: Runtime type validation for tool parameters
- **Structured Prompt Management**: Organized, maintainable prompt library

## Adding New Prompts

To add new prompts:

1. Add the prompt content to the `loadPrompts()` method in `src/index.ts`
2. Follow the existing structure for consistency
3. Update the category enum in TypeScript types if adding new categories
4. Test locally before deploying

## Future Enhancements

- **Dynamic Prompt Loading**: Load prompts from external sources or databases
- **Gemini Integration**: Enhanced prompt processing with Google's Gemini API
- **Additional Categories**: Backend, Python, mobile development, etc.
- **Version Management**: Track and manage prompt versions
- **Analytics**: Usage tracking and prompt effectiveness metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add or modify prompts following the established patterns
4. Test locally with `pnpm run dev`
5. Deploy and test on Cloudflare Workers
6. Submit a pull request

## License

This project is private and proprietary. All rights reserved.