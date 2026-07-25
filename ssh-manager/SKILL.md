---
name: ssh-manager
description: Manage multiple SSH servers with key or password authentication. Generate SSH keys, deploy public keys, execute remote commands, and transfer files with SFTP.
runtime: node
entry: scripts/ssh-manager.ts
metadata:
  display_name: "SSH Manager"
  intent_patterns: "ssh, ssh connect, remote server, list servers, execute remote command, upload file, download file, sftp, ssh key, generate key, deploy public key"
  required_tools: "run_shell_command"
---

# SSH Manager

Manage named SSH servers through Scripting's native `SSHClient` API.

## Features

- Authenticate with an ED25519/RSA private key or password.
- Create local ED25519 key pairs and display public keys.
- Configure, edit, list, remove, and test named servers.
- Run remote commands, including commands using `sudo`.
- Upload and download files with SFTP.
- Get guided steps for deploying a public key through an existing password-authenticated server.

## Language Behavior

The configuration UI and script messages use `Device.systemLanguageCode`: Chinese for `zh`, English otherwise. Command names and JSON parameter keys are always English.

## Quick Start

### Configure servers

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"config"}' --timeout 10
```

Run the returned command to open the server management UI. Add or edit a server, choose key or password authentication, and provide the connection settings. Passwords are stored securely in Keychain.

### List servers

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"list"}' --timeout 10
```

Test every listed server:

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"list", "test":"true"}' --timeout 60
```

### Run a command

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"execute", "name":"web-server", "command":"df -h"}' --timeout 30
```

To run a command with `sudo`, configure `sudoPassword` in the server settings first:

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"execute-sudo", "name":"web-server", "command":"apt update"}' --timeout 60
```

## SSH Key Management

### Generate a key pair

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"generate-key"}' --timeout 30
```

When no key exists, the script returns commands similar to:

```bash
mkdir -p ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -q
cat ~/.ssh/id_ed25519.pub
```

### Read or create a key

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"get-key"}' --timeout 30
```

This reads the public key and creates the key pair if necessary.

### Show a public key

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"show-key"}' --timeout 10
```

### Deploy a public key

For a server already configured with password authentication:

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"deploy-key", "name":"my-server"}' --timeout 30
```

The returned instructions cover verifying the local key, connecting with password authentication, adding the key to `~/.ssh/authorized_keys`, and switching the server configuration to key authentication.

## Command Reference

| Command | Description | Parameters |
|---|---|---|
| `config` | Open the server management UI. | — |
| `list` | List configured servers. | `test` optional; set to `"true"` to test connectivity. |
| `remove` | Delete a server. | `name` required. |
| `status` | Get the server list. | — |
| `connect` | Test a connection. | `name` required. |
| `execute` | Run a command. | `name`, `command` |
| `execute-sudo` | Run a command with `sudo`. | `name`, `command` |
| `upload` | Upload a file. | `name`, `local_path`, `remote_path` |
| `download` | Download a file. | `name`, `remote_path`, `local_path` |
| `generate-key` | Generate an SSH key pair. | `key_name` optional; defaults to `id_ed25519`. |
| `get-key` | Read or create an SSH key. | `key_name` optional; defaults to `id_ed25519`. |
| `show-key` | Display a public key. | `key_name` optional. |
| `deploy-key` | Get public-key deployment steps for a password-authenticated server. | `name` required; `key_name` optional. |

## Examples

### Set up and test a password-authenticated server

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"config"}' --timeout 10
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"connect", "name":"my-server"}' --timeout 30
```

### Move a server to key authentication

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"generate-key"}' --timeout 30
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"deploy-key", "name":"my-server"}' --timeout 30
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{"action":"config"}' --timeout 10
```

### Run a command on a server

```bash
scripting-ts run <skill_dir>/scripts/ssh-manager.ts --queryparameters '{
  "action": "execute",
  "name": "web-server",
  "command": "df -h"
}' --timeout 30
```

## Agent Guidance

- To inspect configured servers, run `{"action":"list"}`; add `"test":"true"` when connectivity checks are needed.
- To set up key authentication, run `generate-key`, then `deploy-key` for the target server, and guide the user through updating its configuration.
- To execute a task, use `execute` with the configured server name and the requested command.

## Scripting SSH API

```ts
// Connect with a key
const ssh = await SSHClient.connect({
  host: "192.168.1.1",
  port: 22,
  authenticationMethod: SSHAuthenticationMethod.ed25519("root", keyData)
})

// Connect with a password
const ssh = await SSHClient.connect({
  host: "192.168.1.1",
  port: 22,
  authenticationMethod: SSHAuthenticationMethod.passwordBased("root", "password")
})

const result = await ssh.executeCommand("uname -a")

const sftp = await ssh.openSFTP()
const file = await sftp.openFile("/path", ["read"])
const data = await file.readAll()
await file.close()
await sftp.close()
await ssh.close()
```

## File Structure

```text
ssh-manager/
├── SKILL.md
├── skill.json
└── scripts/
    ├── ssh-manager.ts
    └── ssh-config-page.tsx
```

## Security Notes

- Passwords, sudo passwords, and private key content are stored in Keychain-backed storage.
- `Script.exit` returns only safe server metadata; it never returns passwords, sudo passwords, private keys, or `keyContent`.
- Helper-generated SSH keys are stored in `~/.ssh/`.
- Every connection is closed after its operation.
- Prefer key authentication for production servers. Use password authentication only for initial setup, then switch to keys.
