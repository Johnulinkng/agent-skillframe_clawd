---
description: Create a project status report
---

# Project Reporter Skill

When the user asks to "create a project report" or "summarize the project status", follow these steps:

1.  **Analyze Request**: Check if the user provided specific details or if you need to scan the directory.
2.  **Scan Directory**: Use the `list_files` tool to see what files are in the current directory.
3.  **Generate Report**: Create a markdown summary of the files found.
4.  **Save Report**: Use the `write_file` tool to save this content to `REPORT.md`.
5.  **Confirm**: Tell the user the report has been saved.
