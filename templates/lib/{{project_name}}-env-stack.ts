import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, IVpc, SubnetType } from 'aws-cdk-lib/aws-ec2'
import { CfnAddon, FargateCluster, KubernetesVersion, Cluster } from 'aws-cdk-lib/aws-eks'
import { Role, AccountRootPrincipal } from 'aws-cdk-lib/aws-iam'
import * as fs from "fs";

class {{project_name|to_camel}}EnvStack extends Stack {
  constructor(scope: Construct, stackId: string, props: StackProps, stageData: any) {
    super(scope, stackId, props);
    const vpc = this.getVpc(this, stageData);
    const cluster = this.createCluster(this, vpc);
    this.createOutput(this, "openId", cluster.openIdConnectProvider.openIdConnectProviderArn, stackId, stageData);
    this.createOutput(this, "clusterName", cluster.clusterName, stackId, stageData);
    this.createOutput(this, "kubectlRole", cluster.kubectlRole!.roleArn, stackId, stageData);
    this.createOutput(this, "securityGroupId", cluster.clusterSecurityGroupId, stackId, stageData);
    this.writeValuesToStageFile(stageData);
  }

  private getVpc(scope: Construct, stageData: any): IVpc {
    const vpcId = stageData['cloud']['vpcId'];
    if(vpcId != undefined && vpcId != ''){
      return Vpc.fromLookup(scope, "vpc", {
        vpcId: vpcId
      });
    } else {
      {% if not inputs.stage_vpc_config %}
      stageData['cloud']['vpcId'] = '{{inputs.vpc}}';
      return Vpc.fromLookup(scope, "vpc", {
        vpcId: '{{inputs.vpc}}'
      });
      {% else %}
      throw Error('Could not find a vpcId data on the specified stage');
      {% endif %}
    }
  }

  private addAddons(scope: Construct, cluster: FargateCluster){
    new CfnAddon(scope, 'vpc-cni', {
      addonName: 'vpc-cni',
      resolveConflicts: 'OVERWRITE',
      clusterName: cluster.clusterName,
      addonVersion: scope.node.tryGetContext('eks-addon-vpc-cni-version'),
    });
    new CfnAddon(scope, 'kube-proxy', {
      addonName: 'kube-proxy',
      resolveConflicts: 'OVERWRITE',
      clusterName: cluster.clusterName,
      addonVersion: scope.node.tryGetContext('eks-addon-kube-proxy-version'),
    });
  }

  private createOutput(scope: Construct, variableName: string, value: string, stackId: string, stageData: any): CfnOutput{
    const outputName = stackId + variableName.charAt(0).toUpperCase() + variableName.substring(1);
    const output = new CfnOutput(scope, outputName, {
      value: value,
      description: 'Created resource',
      exportName: outputName
    });
    output.overrideLogicalId(outputName);
    stageData['outputs'][variableName] = outputName;
    return output;
  }

  private createCluster(scope: Construct, vpc: IVpc): Cluster{
    const clusterName = '{{project_name}}-eks'
    const clusterAdmin = new Role(this, 'AdminRole', {
      assumedBy: new AccountRootPrincipal()
    });
    const cluster = new FargateCluster(scope, clusterName, {
      clusterName: clusterName,
      version: KubernetesVersion.V1_21,
      mastersRole: clusterAdmin,
      outputClusterName: true,
      vpc: vpc,
      vpcSubnets: [{ subnetType: SubnetType.PRIVATE_ISOLATED, onePerAz: true }],
      defaultProfile: {
        selectors: [ { namespace: 'default' }, { namespace: 'kube-system' } ],
        fargateProfileName: clusterName + '-FargateProfile'
      }
    });
    cluster.awsAuth.addMastersRole(clusterAdmin);
    this.addAddons(scope, cluster);
    return cluster;
  }

  private writeValuesToStageFile(stageData: any){
    const path = stageData['path'];
    if (path != undefined){
      delete stageData['path'];
      fs.writeFile(path, JSON.stringify(stageData, null, '\t'), (err: any) => {
        if (err) {
          throw Error(err);
        }
      });
    }
  }
}

export default {{project_name|to_camel}}EnvStack;