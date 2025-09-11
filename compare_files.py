import difflib
from pathlib import Path
from colorama import init, Fore, Style

# Initialize colorama for color output
init(autoreset=True)

# === Your file paths ===
file1_path = r"C:\Users\Angel\alexandria-app\screens\ResultsScreen.js"
file2_path = r"C:\Users\Angel\Desktop\guardian_ai\tools\resultsmess.py"

def read_file_strip(path):
    """Reads a file, strips leading/trailing whitespace, and ignores empty lines."""
    try:
        return [
            line.strip()
            for line in Path(path).read_text(encoding='utf-8').splitlines()
            if line.strip()  # Ignore blank lines
        ]
    except FileNotFoundError as e:
        print(f"{Fore.RED}❌ Error: {e}{Style.RESET_ALL}")
        return None

def compare_files(path1, path2):
    file1_lines = read_file_strip(path1)
    file2_lines = read_file_strip(path2)

    if file1_lines is None or file2_lines is None:
        return

    diff = difflib.unified_diff(
        file1_lines,
        file2_lines,
        fromfile=path1,
        tofile=path2,
        lineterm=''
    )

    diff_found = False
    for line in diff:
        diff_found = True
        if line.startswith('+') and not line.startswith('+++'):
            print(Fore.GREEN + line)
        elif line.startswith('-') and not line.startswith('---'):
            print(Fore.RED + line)
        elif line.startswith('@@'):
            print(Fore.CYAN + line)
        else:
            print(Style.RESET_ALL + line)

    if not diff_found:
        print(Fore.GREEN + "✅ The files are identical (ignoring whitespace/formatting).")

if __name__ == "__main__":
    compare_files(file1_path, file2_path)
