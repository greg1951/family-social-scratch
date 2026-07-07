- [Overview](#overview)
- [PM2 Installation And Configuration Summary](#pm2-installation-and-configuration-summary)
  - [Step 1: Install PM2 Under The EC2 User](#step-1-install-pm2-under-the-ec2-user)
  - [Step 2 Create PM2 App Config In Repo](#step-2-create-pm2-app-config-in-repo)
  - [Step 3: Configure Systemd To Manage PM2 At Boot](#step-3-configure-systemd-to-manage-pm2-at-boot)
  - [Step 4: Load Runtime Env From Parameter Store Output](#step-4-load-runtime-env-from-parameter-store-output)
  - [Step 5: Remove Bad Startup Flags And CWD Drift](#step-5-remove-bad-startup-flags-and-cwd-drift)
  - [Step 6: Stabilize On Single Worker First](#step-6-stabilize-on-single-worker-first)
- [Final Deploy Runbook](#final-deploy-runbook)
  - [Deploy](#deploy)
  - [Verify](#verify)
  - [Rollback](#rollback)
  - [Known-Good Baseline (Do Not Drift)](#known-good-baseline-do-not-drift)
    - [ecosystem.config.cjs](#ecosystemconfigcjs)
    - [/etc/systemd/system/pm2-ec2-user.service](#etcsystemdsystempm2-ec2-userservice)
    - [Post-edit apply/verify](#post-edit-applyverify)
  - [Operating Notes](#operating-notes)
- [Troubleshooting](#troubleshooting)
  - [Crashing PM2 Woker(s)](#crashing-pm2-wokers)
  - [Getting PM2 Error Logs](#getting-pm2-error-logs)
  - [The pm2-ec2-user.service Service](#the-pm2-ec2-userservice-service)

# Overview

PM2 is a production process manager for Node.js applications. When you host an app on an AWS EC2 instance, running node app.js is not enough because the application will crash if the server reboots or encounters an error. PM2 keeps applications alive 24/7, restarts them automatically if they crash, and reloads them without downtime.

**Key Functions of PM2 on EC2**

- Auto-Restart: Automatically brings your backend server back online if the Node.js process fails or the EC2 instance reboots.
- Zero-Downtime Reloads: Allows you to update your application code and restart the server without dropping active user requests.
- Clustering (Load Balancing): Uses "Cluster Mode" to scale a single instance across all available CPU cores, maximizing the traffic your EC2 server can handle.
- Centralized Logging: Aggregates error and standard output logs into unified files, which you can easily monitor using pm2 logs.

# PM2 Installation And Configuration Summary

This summarizes the final production setup reached in this session, including what changed and why.

## Step 1: Install PM2 Under The EC2 User

```bash
npm install -g pm2
pm2 -v
```

Why:
- Installs the process manager that keeps the app alive and restartable.
- Verifies PM2 is available in the active Node/NVM path.

## Step 2 Create PM2 App Config In Repo

File: `ecosystem.config.cjs`

Why:
- Keeps app startup behavior in source control.
- Prevents drift between manual starts and service starts.

Source:

```tsx
    module.exports = {
        apps: [
            {
                name: "family-social",
                cwd: "/home/ec2-user/projects/family-social",
                script: "node_modules/next/dist/bin/next",
                args: "start -p 3000 -H 0.0.0.0",
                instances: 1,
                kill_timeout: 120000,
                max_memory_restart: "1G",
                env: {
                NODE_ENV: "production"
                }
            }
        ]
    };
```

## Step 3: Configure Systemd To Manage PM2 At Boot

Service: `pm2-ec2-user.service`

Key behavior:
- Runs `ExecStartPre=/usr/local/bin/load-s3-master-key.sh`
- Starts PM2 runtime with the ecosystem config
- Enabled in `multi-user.target`

Why:
- App survives logout, reboot, and daemon restarts.
- Startup is repeatable and operationally consistent.

## Step 4: Load Runtime Env From Parameter Store Output

Runtime file: `/run/family-social.env`

Critical fixes applied:
- File must be readable by `ec2-user` (for PM2 process owner).
- Multiline secrets (Apple private key) must be written as one line with escaped `\\n`.

Why:
- Prevents shell parse failures and partial environment loads.
- Ensures PM2/systemd start with the same env as the old working service.

Source: 

Below is the source for the `/etc/systemd/system/pm2-ec2-user.service` that will persist the service during reboots.

```bash
    [Unit]
    Description=PM2 process manager
    After=network.target

    [Service]
    Type=simple
    User=ec2-user
    LimitNOFILE=infinity
    LimitNPROC=infinity
    LimitCORE=infinity
    PermissionsStartOnly=true

    # Rebuild env file at startup (as root, since /run is root-owned)
    ExecStartPre=+/usr/local/bin/load-s3-master-key.sh
    EnvironmentFile=/run/family-social.env

    Environment=PATH=/home/ec2-user/.nvm/versions/node/v25.2.1/bin:/usr/local/bin:/usr/bin:/bin
    Environment=PM2_HOME=/home/ec2-user/.pm2
    Restart=on-failure
    RestartSec=3

    # Prefer pm2-runtime to avoid resurrect/pid-file issues
    ExecStart=/home/ec2-user/.nvm/versions/node/v25.2.1/bin/pm2-runtime start /home/ec2-user/projects/family-social/ecosystem.config.cjs 
    ExecReload=/home/ec2-user/.nvm/versions/node/v25.2.1/bin/pm2 reload family-social --update-env
    ExecStop=/home/ec2-user/.nvm/versions/node/v25.2.1/bin/pm2 kill

    [Install]
    WantedBy=multi-user.target
```
Operations:

Commands below will restart this service, to also force a refresh of the Parameter Store parameters 
```bash
    sudo systemctl daemon-reload
    sudo systemctl restart pm2-ec2-user.service
    sudo systemctl status pm2-ec2-user.service --no-pager -l
    pm2 env 0 | egrep "FAMILY_SOCIAL_DATABASE_URL|DATABASE_URL|NODE_ENV"
```


## Step 5: Remove Bad Startup Flags And CWD Drift

Issues corrected during setup:
- Removed unsupported PM2 start flag usage that leaked to `next start`.
- Corrected process working directory so Next resolves `.next/BUILD_ID` and `.env*` paths from the project root.

Why:
- Prevents restart loops and `ENOTDIR` path errors.

## Step 6: Stabilize On Single Worker First

Observed final stable mode:
- PM2 app online in `fork` mode with stable uptime.
- `systemctl status pm2-ec2-user.service` active.
- `curl -I https://dev.my-family-social.com` returns `200`.

Why:
- Single-worker baseline reduces variables while validating env/service reliability.
- Scale-out can be added after a stable baseline window.

# Final Deploy Runbook

## Deploy
```bash
cd /home/ec2-user/projects/family-social
git pull origin main
npm ci
npm run build
sudo systemctl restart pm2-ec2-user.service
```

## Verify
```bash
sudo systemctl status pm2-ec2-user.service --no-pager -l
pm2 status
pm2 logs family-social --err --lines 60
curl -I --max-time 10 http://127.0.0.1:3000
curl -I --max-time 10 https://dev.my-family-social.com
```

## Rollback
```bash
cd /home/ec2-user/projects/family-social
git log --oneline -n 5
git reset --hard <previous-good-commit-sha>
npm ci
npm run build
sudo systemctl restart pm2-ec2-user.service
```
## Known-Good Baseline (Do Not Drift)

### [ecosystem.config.cjs](http://_vscodecontentref_/1)
    module.exports = {
      apps: [
        {
          name: "family-social",
          cwd: "/home/ec2-user/projects/family-social",
          script: "/home/ec2-user/projects/family-social/node_modules/next/dist/bin/next",
          args: "start -p 3000 -H 0.0.0.0",
          exec_mode: "fork",
          instances: 1,
          kill_timeout: 120000,
          max_memory_restart: "1G",
          env: { NODE_ENV: "production" }
        }
      ]
    };

### /etc/systemd/system/pm2-ec2-user.service
    [Unit]
    Description=PM2 process manager
    After=network.target

    [Service]
    Type=simple
    User=ec2-user
    LimitNOFILE=infinity
    LimitNPROC=infinity
    LimitCORE=infinity
    PermissionsStartOnly=true
    WorkingDirectory=/home/ec2-user/projects/family-social

    ExecStartPre=+/usr/local/bin/load-s3-master-key.sh
    EnvironmentFile=/run/family-social.env

    Environment=PATH=/home/ec2-user/.nvm/versions/node/v25.2.1/bin:/usr/local/bin:/usr/bin:/bin
    Environment=PM2_HOME=/home/ec2-user/.pm2
    Restart=on-failure
    RestartSec=3

    ExecStart=/home/ec2-user/.nvm/versions/node/v25.2.1/bin/pm2-runtime start /home/ec2-user/projects/family-social/ecosystem.config.cjs
    ExecReload=/home/ec2-user/.nvm/versions/node/v25.2.1/bin/pm2 reload family-social --update-env
    ExecStop=/home/ec2-user/.nvm/versions/node/v25.2.1/bin/pm2 kill

    [Install]
    WantedBy=multi-user.target

### Post-edit apply/verify
    sudo systemctl daemon-reload
    sudo systemctl reset-failed pm2-ec2-user.service
    sudo systemctl restart pm2-ec2-user.service
    sudo systemctl is-active pm2-ec2-user.service
    pm2 describe family-social


## Operating Notes

- Prefer `systemctl restart pm2-ec2-user.service` so env regeneration runs every deploy.
- Keep `npm ci` as default for deterministic installs; skip only when lock/deps are unchanged and speed is prioritized.
- Rotate any secret that appeared in shell output during troubleshooting.

# Troubleshooting

## Crashing PM2 Woker(s)

The following commands were run to troubleshoot PM2 workers crash-looping immediately after restart.

```bash
# stop the systemd wrapper
sudo systemctl stop pm2-ec2-user.service

# kill pm2 and remove saved process state
pm2 delete all || true
pm2 kill || true
rm -f ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.bak
rm -f ~/.pm2/rpc.sock ~/.pm2/pub.sock ~/.pm2/pm2.pid

# confirm the env file is present before startup
sudo ls -l /run/family-social.env
sudo grep -E "FAMILY_SOCIAL_DATABASE_URL|DATABASE_URL|NODE_ENV" /run/family-social.env

# start clean under systemd again
sudo systemctl start pm2-ec2-user.service
sudo systemctl status pm2-ec2-user.service --no-pager -l
pm2 status
```

## Getting PM2 Error Logs

```bash
pm2 logs family-social --err --lines 80
```

## The pm2-ec2-user.service Service

- Is the service running?
    ```bash
    sudo systemctl is-active pm2-ec2-user.service  
    ```
- Review the logs
    ```bash
    sudo systemctl cat pm2-ec2-user.service
    ```

Practical rule:

If you changed ecosystem.config.cjs, run:

```bash
    pm2 restart <app> --update-env or service restart path
    pm2 save (if you rely on saved PM2 process list)
```
If systemd starts with pm2-runtime start ecosystem.config.cjs, restarting the service is usually enough to re-read it.
