import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, IVpc, SubnetType } from 'aws-cdk-lib/aws-ec2'
import { CfnAddon, FargateCluster, KubernetesVersion, Cluster, FargateProfile } from 'aws-cdk-lib/aws-eks'
import { Role, AccountRootPrincipal, PolicyStatement, Effect, Policy } from 'aws-cdk-lib/aws-iam'
import * as fs from 'fs';

class {{project_name|to_camel}}EnvStack extends Stack {

  public readonly eksCluster: Cluster;

  constructor(scope: Construct, stackId: string, props: StackProps, stageData: any) {
    super(scope, stackId, props);
    const vpc = this.getVpc(this, stageData);
    {% if inputs.custom_namespace %}
    const namespace = '{{inputs.namespace}}';
    this.eksCluster = this.createCluster(this, vpc, namespace);
    stageData['cloud']['namespace'] = namespace;
    {% else %}
    this.eksCluster = this.createCluster(this, vpc);
    stageData['cloud']['namespace'] = 'default';
    {% endif %}
    this.createOutput(this, 'openId', this.eksCluster.openIdConnectProvider.openIdConnectProviderArn, stackId, stageData);
    this.createOutput(this, 'clusterName', this.eksCluster.clusterName, stackId, stageData);
    this.createOutput(this, 'kubectlRole', this.eksCluster.kubectlRole!.roleArn, stackId, stageData);
    this.createOutput(this, 'securityGroupId', this.eksCluster.clusterSecurityGroupId, stackId, stageData);
    this.writeValuesToStageFile(stageData);
  }

  private getVpc(scope: Construct, stageData: any): IVpc {
    const vpcId = stageData['cloud']['vpcId'];
    if(vpcId != undefined && vpcId != ''){
      return Vpc.fromLookup(scope, 'vpc', {
        vpcId: vpcId
      });
    } else {
      stageData['cloud']['vpcId'] = '{{inputs.vpc}}';
      return Vpc.fromLookup(scope, 'vpc', {
        vpcId: '{{inputs.vpc}}'
      });
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

  {% if inputs.custom_namespace %}
  private createCluster(scope: Construct, vpc: IVpc, namespace: string): Cluster{
  {% else %}
  private createCluster(scope: Construct, vpc: IVpc): Cluster{
  {% endif %}
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
        fargateProfileName: clusterName + '-DefaultFargateProfile'
      }
    });
    {% if inputs.custom_namespace %}
    const customFargateProfileName = clusterName + '-' + namespace + '-FargateProfile';
    new FargateProfile(scope, customFargateProfileName, {
      cluster,
      selectors: [ { namespace: namespace } ],
      fargateProfileName: customFargateProfileName
    });
    {% endif %}
    cluster.awsAuth.addMastersRole(clusterAdmin);
    const policy = new Policy(scope, clusterName + '-policy', {
      statements: [
        new PolicyStatement({
          resources: ['*'],
          actions: ['eks:*'],
          effect: Effect.ALLOW
        })
      ]
    });
    policy.attachToRole(cluster.kubectlRole!);
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