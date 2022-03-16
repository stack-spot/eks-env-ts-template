#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {{project_name|to_camel}}EnvStack from '../lib/{{project_name}}-env-stack';
import * as path from 'path';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage');
var account = process.env['AWS_ACCOUNT_ID'];
var region = process.env['AWS_REGION'];
var stageData = {} as any;
if(stage != undefined){
  const stageFilePath = path.join('stages', stage + '.json');
  stageData = require(path.join('..', stageFilePath));
  const awsData = stageData['cloud']['account'];
  account = awsData['id'];
  region = awsData['region'];
  stageData['path'] = stageFilePath;
  stageData['stackName'] = '{{project_name|to_camel}}EnvStack';
  stageData['outputs'] = {} as any;
  {% if not inputs.stage_vpc_config %}
  stageData['cloud']['vpcId'] = '{{inputs.vpc}}';
  {% endif %}
}
new {{project_name|to_camel}}EnvStack(app, '{{project_name|to_camel}}EnvStack', {
  env: {
    account: account,
    region: region
  }
}, stageData);