## Git and GitHub (Student Workflow)
Simple flow focused on working with the stencil and making clean commits.

### 1) Get the stencil
Clone the repo:
```bash
git clone https://github.com/brown-cs1380/stencil.git
cd stencil
```

Add the class project as an upstream (optional if you want updates):
```bash
git remote add upstream https://github.com/brown-cs1380/project.git
```

Pull updates to the stencil:
```bash
git fetch upstream
git merge upstream/main
```

### 2) Work in small, atomic commits
Atomic commit = one idea or fix at a time.
```bash
git status
git add path/to/file.js
git commit -m "Implement local.routes.get error handling"
```

Tips:
- Avoid mixing unrelated changes in a single commit.
- Use clear, present-tense messages.

### 3) Check your changes
```bash
git diff
git diff --staged
```

### 4) Update from upstream safely
```bash
git fetch upstream
git merge upstream/main
```

If you hit conflicts, fix them and then:
```bash
git add .
git commit
```

### 5) Push your work
```bash
git push origin main
```

If your default branch is `master`:
```bash
git push origin master
```
