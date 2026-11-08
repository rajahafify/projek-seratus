# Slots

Every claimed slot on the board is one file in this folder, named by its number (`001.md` to `100.md`).

To claim a slot, use the form at https://projek-seratus.artifisi.com/apply. It fills in the file for you and opens a pull request. You can also add the file by hand:

```markdown
---
project: Peta Banjir Komuniti
maker: Aisyah Rahman
github_user: aisyahr
repo: https://github.com/aisyahr/peta-banjir
website: https://peta-banjir.example.com   # optional
status: building                            # building or shipped
---
One or two sentences on what you're building and how it serves the cause.
```

When the pull request is merged, the slot shows up on the live board. When your project ships, open another pull request that changes `status` to `shipped`.
