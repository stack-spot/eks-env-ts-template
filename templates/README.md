
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