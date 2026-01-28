---
name: docs-writer
description: Generates or updates documentation for code features in the RiceCall project. Use this skill when the user asks to write documentation for a specific feature, program, or module. It follows a strict 5-step workflow including analysis of git history and code structure.
---

# Docs Writer

## Overview

This skill guides the process of writing and updating documentation for the RiceCall project. It ensures that documentation is accurate, up-to-date with recent changes, and structured according to the project's documentation standards.

## Workflow

Follow these steps sequentially to create or update documentation.

### Step 1: Identify Target

Ask the user to specify which feature, program, or module they want to document.
- **Example:** "Which feature or module would you like me to document today?"

### Step 2: Establish Context & History

Ask the user to identify key git commits or a time range that represents the significant changes for this feature.
- **Goal:** To understand *what* changed and *why*.
- **Option:** If the user doesn't know, ask if they would like you to investigate the git log yourself.
- **Action:** Use `git log` and `git diff` to review the identified changes.

### Step 3: Analyze Context, Code & Existing Docs

Flexibly analyze the codebase and existing documentation to ensure accuracy.
1.  **Analyze Existing Docs:** Read relevant files in `docs/` to understand the current documentation baseline and spot inconsistencies.
2.  **Analyze Code:** Read source files to understand the actual implementation, architecture, and logic.
3.  **Synthesize:** Compare code vs. docs to identify what needs to be updated, added, or corrected.
4.  **Identify** key components, public interfaces, and configuration options.
5.  **Draft** a mental or scratchpad outline of the new documentation.

### Step 4: Write & Refactor Documentation

Update the documentation in the `docs/` directory.

**Conventions:**
- Follow the existing documentation style and structure.
- **Refactoring:** If a single Markdown file becomes too large or complex (e.g., covering multiple distinct sub-topics):
    - Convert the file into a directory of the same name.
    - Create an `index.md` (or `README.md`) in that directory for the main overview.
    - Split the sub-topics into independent `.md` files within that directory.
    - Ensure all links are updated.

**Action:**
- Use `read_file` to check existing docs.
- Use `write_file` or `replace` to update content.
- Use `run_shell_command` to move files if refactoring is needed.

### Step 5: Review

Notify the user that the documentation has been updated and request a review.
- **Example:** "I have updated the documentation for [Feature]. You can find it at [Path]. Please review it for accuracy."