import subprocess
import json

prs_out = subprocess.check_output(
    ['gh', 'pr', 'list', '--repo', 'Avinash1905/WebOs', '--state', 'all', '--limit', '150'],
    text=True
).strip().splitlines()
print(f"Total Pull Requests on GitHub: {len(prs_out)}")

for pr_num in ['1', '25', '50', '75', '100']:
    out = subprocess.check_output(
        ['gh', 'pr', 'view', pr_num, '--repo', 'Avinash1905/WebOs', '--json', 'number,title,state,additions,files,url'],
        text=True
    )
    d = json.loads(out)
    print(f"PR #{d['number']:>3}: State={d['state']} | Additions={d['additions']:,} LOC | Files={len(d['files'])} | URL={d['url']}")

branches = subprocess.check_output(['git', 'ls-remote', '--heads', 'origin'], text=True).strip().splitlines()
print(f"Remote branches on origin: {len(branches)}")

status = subprocess.check_output(['git', 'status', '--short'], text=True).strip()
print("Local working tree clean:", "YES" if not status else f"Uncommitted items: {status}")
