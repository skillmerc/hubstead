# Security policy

Hubstead is a maintained fork of MetaMCP, maintained by SKILLMERC (Pty) Ltd.

A gateway like this holds API keys and can start local processes for STDIO servers. We treat security reports as our first priority.

## Report a vulnerability

Do not open a public issue for a security problem.

- Use GitHub private vulnerability reporting on this repository ("Security" tab, "Report a vulnerability"), or
- email kyle@skillmerc.com with "Hubstead security" in the subject.

Please include the version or commit, the steps to reproduce, and the impact you see.

## What happens next

- We reply as soon as we can. We do not promise a fixed response time.
- We confirm the problem, fix it on a private branch, and publish a release with a GitHub security advisory.
- We credit the reporter in the advisory unless you ask us not to.

## Supported versions

| Version | Supported |
|---|---|
| Latest Hubstead release | Yes |
| Upstream MetaMCP releases (v2.4.22 and earlier) | No. Please move to the latest Hubstead release. |

Fixes land on the default branch first and ship in the next Hubstead release. Hubstead Docker images start at v2.6.1 (`ghcr.io/skillmerc/hubstead`); README.md has the steps, and how to build from source.

## Reports about upstream MetaMCP

The upstream repository (metatool-ai/metamcp) is archived and cannot take reports. If a problem also affects upstream MetaMCP, report it here and we will fix it in Hubstead. We do not post on the upstream repository.
