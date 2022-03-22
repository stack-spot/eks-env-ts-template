#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {{project_name|to_camel}}EnvStack from '../lib/{{project_name}}-env-stack';
import * as path from 'path';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage');
if(stage == undefined){
  throw Error('Stage not found in CDK context. Either use stk deploy <stage> or cdk -c stage=<stage> option.');
}
const stageFilePath = path.join('stages', stage + '.json');
const stageData = require(path.join('..', stageFilePath));
const awsData = stageData['cloud']['account'];
const account = awsData['id'];
const region = awsData['region'];
stageData['path'] = stageFilePath;
stageData['stackName'] = '{{project_name|to_camel}}EnvStack';
stageData['outputs'] = {} as any;

const eksStack = new {{project_name|to_camel}}EnvStack(app, '{{project_name|to_camel}}EnvStack', {
  env: {
    account: account,
    region: region
  }
}, stageData);