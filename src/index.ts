import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { componentCreationPrompt, stateManagementPrompt, accessibilityPrompt, codeQualityPrompt, performanceOptimizationPrompt } from "./prompt";

// Types for prompt categories
type PromptCategory = "react" | "fe" | "common";

// Prompt library structure
interface PromptLibrary {
	[category: string]: {
		[promptName: string]: string;
	};
}

// Define our MCP agent with prompt library tools
export class PromptLibraryMCP extends McpAgent {
	server = new McpServer({
		name: "Prompt Library",
		version: "1.0.0",
	});

	private promptLibrary: PromptLibrary = {};

	async init() {
		// Initialize the prompt library
		await this.loadPrompts();

		// Tool to get available categories
		this.server.tool(
			"get_categories",
			{},
			async () => ({
				content: [
					{
						type: "text",
						text: JSON.stringify({
							categories: Object.keys(this.promptLibrary),
							description: "Available prompt categories in the library"
						}, null, 2)
					}
				],
			}),
			{
				name: "get_categories",
				description: "Get all available prompt categories in the library. Use this when you need to discover what types of prompts are available (react, fe, common, etc.). This is useful for initial exploration or when you're unsure which category contains the prompts you need."
			}
		);

		// Tool to get prompts by category
		this.server.tool(
			"get_prompts_by_category",
			{
				category: z.enum(["react", "fe", "common"]),
			},
			async ({ category }) => {
				try {
					const categoryPrompts = this.promptLibrary[category];
					if (!categoryPrompts) {
						return {
							content: [
								{
									type: "text",
									text: `Error: Category '${category}' not found`
								}
							],
						};
					}

					const promptList = Object.keys(categoryPrompts).map(name => ({
						name,
						content: categoryPrompts[name]
					}));

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									category,
									prompts: promptList,
									count: promptList.length
								}, null, 2)
							}
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error retrieving prompts for category '${category}': ${error instanceof Error ? error.message : 'Unknown error'}`
							}
						],
					};
				}
			},
			{
				name: "get_prompts_by_category",
				description: "Retrieve all prompts from a specific category. Use this when you know the category you want (react, fe, or common) and want to see all available prompts in that category. This gives you an overview of what's available before selecting specific prompts."
			}
		);

		// Tool to get a specific prompt
		this.server.tool(
			"get_prompt",
			{
				category: z.enum(["react", "fe", "common"]),
				name: z.string(),
			},
			async ({ category, name }) => {
				try {
					const categoryPrompts = this.promptLibrary[category];
					if (!categoryPrompts) {
						return {
							content: [
								{
									type: "text",
									text: `Error: Category '${category}' not found`
								}
							],
						};
					}

					const prompt = categoryPrompts[name];
					if (!prompt) {
						return {
							content: [
								{
									type: "text",
									text: `Error: Prompt '${name}' not found in category '${category}'`
								}
							],
						};
					}

					return {
						content: [
							{
								type: "text",
								text: prompt
							}
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error retrieving prompt '${name}' from category '${category}': ${error instanceof Error ? error.message : 'Unknown error'}`
							}
						],
					};
				}
			},
			{
				name: "get_prompt",
				description: "Retrieve a specific prompt by its exact name and category. Use this when you know exactly which prompt you need (e.g., 'component-creation' from 'react' category). This returns the full prompt content ready to be used for code generation or guidance."
			}
		);

		// Tool to combine prompts from multiple categories
		this.server.tool(
			"combine_prompts",
			{
				categories: z.array(z.enum(["react", "fe", "common"])),
				separator: z.string().optional().default("\n\n---\n\n"),
			},
			async ({ categories, separator }) => {
				try {
					const combinedPrompts: string[] = [];
					const includedPrompts: { category: string; name: string }[] = [];

					for (const category of categories) {
						const categoryPrompts = this.promptLibrary[category];
						if (categoryPrompts) {
							for (const [name, content] of Object.entries(categoryPrompts)) {
								combinedPrompts.push(`# Category: ${category.toUpperCase()}\n# Prompt: ${name}\n\n${content}`);
								includedPrompts.push({ category, name });
							}
						}
					}

					if (combinedPrompts.length === 0) {
						return {
							content: [
								{
									type: "text",
									text: "No prompts found for the specified categories"
								}
							],
						};
					}

					const result = {
						combined_prompt: combinedPrompts.join(separator),
						included_prompts: includedPrompts,
						total_prompts: combinedPrompts.length,
						categories_processed: categories
					};

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result, null, 2)
							}
						],
					};
				} catch (error) {
							return {
								content: [
									{
										type: "text",
								text: `Error combining prompts: ${error instanceof Error ? error.message : 'Unknown error'}`
							}
						],
					};
				}
			},
			{
				name: "combine_prompts",
				description: "Combine multiple prompts from different categories into a single comprehensive prompt. Use this when you need guidance that spans multiple areas (e.g., React components + accessibility, or React + performance). This creates a unified prompt that covers all specified categories, perfect for complex coding tasks that require multiple types of expertise."
			}
		);

		// Tool to search prompts by keyword
		this.server.tool(
			"search_prompts",
			{
				keyword: z.string(),
				categories: z.array(z.enum(["react", "fe", "common"])).optional(),
			},
			async ({ keyword, categories }) => {
				try {
					const searchResults: { category: string; name: string; content: string; relevance: number }[] = [];
					const searchCategories = categories || Object.keys(this.promptLibrary) as PromptCategory[];

					for (const category of searchCategories) {
						const categoryPrompts = this.promptLibrary[category];
						if (categoryPrompts) {
							for (const [name, content] of Object.entries(categoryPrompts)) {
								const lowerKeyword = keyword.toLowerCase();
								const lowerContent = content.toLowerCase();
								const lowerName = name.toLowerCase();

								if (lowerContent.includes(lowerKeyword) || lowerName.includes(lowerKeyword)) {
									// Simple relevance scoring
									let relevance = 0;
									if (lowerName.includes(lowerKeyword)) relevance += 10;
									relevance += (content.toLowerCase().match(new RegExp(lowerKeyword, 'g')) || []).length;

									searchResults.push({ category, name, content, relevance });
								}
							}
						}
					}

					// Sort by relevance
					searchResults.sort((a, b) => b.relevance - a.relevance);

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									keyword,
									results: searchResults.map(({ category, name, content, relevance }) => ({
										category,
										name,
										relevance,
										snippet: content.substring(0, 200) + (content.length > 200 ? '...' : '')
									})),
									total_found: searchResults.length
								}, null, 2)
							}
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error searching prompts: ${error instanceof Error ? error.message : 'Unknown error'}`
							}
						],
					};
				}
			},
			{
				name: "search_prompts",
				description: "Search for prompts by keyword across all or specific categories. Use this when you have a topic in mind (e.g., 'performance', 'accessibility', 'hooks') but don't know exactly which prompt contains the information you need. This returns relevant prompts ranked by relevance, with snippets to help you choose the right one."
			}
		);
	}

	private async loadPrompts(): Promise<void> {
		try {
			// Use imported markdown content from the top of the file
			this.promptLibrary = {
				react: {
					"component-creation": componentCreationPrompt,
					"state-management": stateManagementPrompt
				},
				fe: {
					"performance-optimization": performanceOptimizationPrompt,
					"accessibility": accessibilityPrompt
				},
				common: {
					"code-quality": codeQualityPrompt
				}
			};
		} catch (error) {
			console.error("Error loading prompts:", error);
			this.promptLibrary = {};
		}
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return PromptLibraryMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return PromptLibraryMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
