import os

IGNORED = {
    ".git",
    "__pycache__",
    ".vscode",
    "env",
    "venv",
    "migrations",
}

FILE_IGNORE_EXT = {
    ".pyc",
    ".pyo",
    ".swp",
    ".sqlite3-wal",
    ".sqlite3-shm",
}

def should_ignore(name):
    if name in IGNORED:
        return True
    ext = os.path.splitext(name)[1]
    return ext in FILE_IGNORE_EXT

def tree(path, prefix="", out_lines=None):
    if out_lines is None:
        out_lines = []

    items = []
    for item in sorted(os.listdir(path)):
        if should_ignore(item):
            continue
        items.append(item)

    for index, item in enumerate(items):
        full_path = os.path.join(path, item)
        connector = "├── " if index < len(items) - 1 else "└── "

        line = prefix + connector + item + ("/" if os.path.isdir(full_path) else "")
        # REMOVED: print(line) 
        out_lines.append(line)

        if os.path.isdir(full_path):
            # The 'migrations' check in the loop body is redundant because 'migrations' 
            # is already in IGNORED, so the 'continue' will not be hit here, 
            # but we can leave the original structure if you prefer:
            # if item == "migrations":
            #     continue
            
            new_prefix = prefix + ("│   " if index < len(items) - 1 else "    ")
            tree(full_path, new_prefix, out_lines)

    return out_lines


if __name__ == "__main__":
    output_file = "project-tree.txt"
    lines = tree(".")

    # Only print the final confirmation message, not the tree itself
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\nTree saved to {output_file}")