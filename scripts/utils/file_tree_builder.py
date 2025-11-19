import os

def build_file_tree(path: str) -> dict:
    """
    Recursively build a tree structure of files and folders from a given path.
    Returns a nested dict like:
    {
        'name': 'repo',
        'type': 'folder',
        'children': [
            {'name': 'src', 'type': 'folder', 'children': [...]},
            {'name': 'README.md', 'type': 'file'}
        ]
    }
    """
    tree = {
        "name": os.path.basename(path),
        "type": "folder",
        "children": [],
    }

    try:
        for entry in os.listdir(path):
            full_path = os.path.join(path, entry)
            if os.path.isdir(full_path):
                tree["children"].append(build_file_tree(full_path))
            else:
                tree["children"].append({
                    "name": entry,
                    "type": "file"
                })
    except Exception as e:
        print(f"Error reading {path}: {e}")
    return tree
