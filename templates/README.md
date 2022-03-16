
# Install dependencies
```sh
npm i
```

# Commands using stk cli:

### Deploy
```sh
stk deploy <stage-name>
```


# Commands using cdk cli with stages:

### Deploy
```sh
npx cdk deploy -c stage=<stage-name>
```

### Destroy
```sh
npx cdk destroy -c stage=<stage-name>
```

# Commands using cdk cli without stages

### Setup cdk account configuration
```sh
export AWS_ACCOUNT_ID=<account-id>
export AWS_REGION=<region>
```

### Deploy
```sh
npx cdk deploy
```

### Destroy
```sh
npx cdk destroy
```