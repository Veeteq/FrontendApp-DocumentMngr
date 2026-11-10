# Deploy application to local VM and integrate with Jenkins

## Step 1 - Create a bare Git repository
```
mkdir -p /root/git
cd /root/git
git init --bare fnt-authorization-app.git
```

## Step 2 - Add remote on Windows
```
git remote add vm ssh://root@192.168.56.104/root/git/fnt-authorization-app.git
```

## Step 3 - Configure SSH key (if needed)
## Step 4 - Create Dockerfile
## Step 5 - Push to VM
```shell
git push vm develop
```
## Step 6 - Create Jenkins Pipeline
## Step 7 - Verify deployment
```shell
curl http://192.168.56.104:8082/actuator/health
```
## Step 8 - Create API token
```shell
admin → Security → API Tokens
```

## Step 9 - Create post-receive hook
```shell
/root/git/authorization-app.git/hooks/post-receive
```