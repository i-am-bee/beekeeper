# Contributing

Welcome! We're thrilled you want to contribute to the Beekeeper project. This guide will walk you through our process, tools, and expectations.

## Before You Start
- Make sure you've read our [Code of Conduct](/CODE_OF_CONDUCT.md).
- Familiarize yourself with our GitHub repository and issues list.
- If new to Beekeeper, we recommend starting by exploring our documentation and examples.

## Issues and Pull Requests

We welcome contributions through GitHub pull requests (PRs). When working on a new feature or fixing an issue:
- Open an issue to discuss the idea, gather feedback, and get community input.
- Create a PR when you're ready to share your code for review.

### Draft PRs

If you need help with your contribution or want initial feedback before completing it, open a Draft PR with the [WIP] tag (for Work In Progress). This indicates that the code isn't yet final and will change.

#### Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) to structure our commit messages. Please use the following format:

```
<type>(<scope>): <subject>
```

- Type: feat, fix, chore, docs, style, refactor, perf, test, etc.
- Scope: The area of the codebase your changes affect (optional). The allowed values are: adapters, agents, llms, tools, cache, emitter, internals, logger, memory, serializer, infra, deps, instrumentation
- Subject: A short description of the changes (required)

_Example:_

```
feat(llm): add streaming support for watsonx adapter

Ref: #15
```

## Legal

The following sections detail important legal information that should be viewed prior to contribution.

### License and Copyright

Distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).

SPDX-License-Identifier: [Apache-2.0](https://spdx.org/licenses/Apache-2.0)

If you would like to see the detailed LICENSE click [here](/LICENSE).

### Developer Certificate of Origin (DCO)

We have tried to make it as easy as possible to make contributions. This applies to how we handle the legal aspects of contribution. We use the same approach - the [Developer's Certificate of Origin 1.1 (DCO)](https://developercertificate.org/) - that the Linux® Kernel [community](https://docs.kernel.org/process/submitting-patches.html#sign-your-work-the-developer-s-certificate-of-origin) uses to manage code contributions.

We ask that when submitting a patch for review, the developer must include a sign-off statement in the commit message. If you set your `user.name` and `user.email` in your `git config` file, you can sign your commit automatically by using the following command:

```bash
git commit -s
```

If a commit has already been created but signoff was missed this can be remedied

```bash
git --amend -s
```

The following example includes a `Signed-off-by:` line, which indicates that the submitter has accepted the DCO:

```txt
Signed-off-by: John Doe <john.doe@example.com>
```

We automatically verify that all commit messages contain a `Signed-off-by:` line with your email address.

#### Useful tools for doing DCO signoffs

While the web ui natively supports this now, there are a number of tools that make it easier for developers to manage DCO signoffs if not using the web interface.

- DCO command line tool, which lets you do a single signoff for an entire repo ( <https://github.com/coderanger/dco> )
- GitHub UI integrations for adding the signoff automatically ( <https://github.com/scottrigby/dco-gh-ui> )
- Chrome - <https://chrome.google.com/webstore/detail/dco-github-ui/onhgmjhnaeipfgacbglaphlmllkpoijo>
- Firefox - <https://addons.mozilla.org/en-US/firefox/addon/scott-rigby/?src=search>
