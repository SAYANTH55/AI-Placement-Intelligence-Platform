# Contributing to JobMode

First off, thank you for considering contributing to JobMode! It's people like you that make JobMode such a great platform.

## 1. Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](https://github.com/SAYANTH55/AI-Placement-Intelligence-Platform/issues) to see if it has already been reported. If not, open a new issue using our templates.

## 2. Fork & create a branch

If this is something you think you can fix, then fork JobMode and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-role-prediction-model
```

## 3. Implement your fix or feature

At this point, you're ready to make your changes. Feel free to ask for help; everyone is a beginner at first :smile:

### Coding Standards

- **Python**: Follow PEP 8 guidelines. Use type hints (`def get_user(user_id: int) -> User:`).
- **React**: Use functional components and hooks. Use PascalCase for component files.
- **CSS**: Use Tailwind utility classes primarily.

## 4. Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with JobMode's master branch:

```sh
git remote add upstream https://github.com/SAYANTH55/AI-Placement-Intelligence-Platform.git
git pull upstream main
```

Then update your feature branch from your local copy of master, and push it!

```sh
git checkout 325-add-role-prediction-model
git rebase main
git push --set-upstream origin 325-add-role-prediction-model
```

Finally, go to GitHub and make a Pull Request.

## 5. Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

Thank you!
