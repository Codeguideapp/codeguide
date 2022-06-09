import { File } from '../api/api';

export const mockFiles: File[] = [
  {
    path: 'some/path/old-tests.ts',
    status: 'modified',
    oldVal: `
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('root')
      )
      `,
    newVal: `
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
            </div>
          </React.StrictMode>,
        document.getElementById('root')
      )1
      `,
  },
  {
    path: 'indent-tabs.ts',
    status: 'modified',
    oldVal: `-
\t<P>
\t\t<D>
\t\t<T>
\t</P>
`,
    newVal: `-
{examplesSelect || (
\t\t\t<P>
\t\t\t\t<D>
\t\t\t\t<T>
\t\t\t</P>
)}
`,
  },
  {
    path: 'indent-123.ts',
    status: 'modified',
    oldVal: `-
\t<P>
\t\t<D>
\t\t<T>
\t</P>
`,
    newVal: `-
{examplesSelect || (
123\t<P>
123\t\t<D>
123\t\t<T>
123\t</P>
)}
`,
  },
  {
    path: 'indent-spaces.ts',
    status: 'modified',
    oldVal: `-
<Text color="body" role="heading">
  Example
  Second
</Text>
`,
    newVal: `-
{examplesSelect || (
  <Text color="body" role="heading">
    Example
    Second
  </Text>
)}
`,
  },
  {
    path: 'test.ts',
    status: 'modified',
    oldVal: `ggg
    const renderApp = () =>
      ReactDOM.render(
        <React.StrictMode>
          <div>
            <Editor />
            <App />
          </div>
        </React.StrictMode>,
      document.getElementById('root')
    )
    `,
    newVal: `bla
    const renderApp = () =>
      RaaeactDOM.render(
        <React.StrictMode>
          <div>
            <Editor />
            <Something />
          </div>
        </React.>,
      document.getElementById('hhhh')
    )
    `,
  },
  {
    path: 'onclick',
    status: 'modified',
    oldVal: `
      onClick={() => setIsFullScreen(!isFullScreen)}
      `,
    newVal: `
      onClick={() => {
        setIsFullScreen(!isFullScreen);

        if (visNetwork.current) {
          visNetwork.current.fit();
        }
      }}
      `,
  },
  {
    path: 'testbla.ts',
    status: 'modified',
    oldVal: `
    const renderApp = () =>
      ReactDOM.render(
        <React.StrictMode>
          <div>
            <Editor />
            <App />
          </div>
        </React.StrictMode>,
      document.getElementById('root')
    )
    `,
    newVal: `
    const renderApp = () =>
      ReactDOM.render(
        <Raaeact.StricttMode>
          <div>
          </div>
        </React.StrictMode>,
        kako smo
      document.getElementById('hhhh')
    )
    
    p`,
  },
  {
    path: 'added.ts',
    status: 'added',
    oldVal: '',
    newVal: `added file`,
  },
  {
    path: 'deleted.ts',
    status: 'deleted',
    oldVal: 'deleted file',
    newVal: ``,
  },
  {
    path: 'test2.ts',
    status: 'modified',
    oldVal: `protected _createMouseTarget(e: EditorMouseEvent, testEventTarget: boolean): IMouseTarget {
        return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), e.editorPos, e.pos, testEventTarget ? e.target : null);
      }`,
    newVal: `protected _createMouseTarget(e: EditorMouseEvent, testEventTarget: boolean): IMouseTarget {
        let target = e.target;
        if (!this.viewHelper.viewDomNode.contains(target)) {
          const shadowRoot = dom.getShadowRoot(this.viewHelper.viewDomNode);
          if (shadowRoot) {
            target = (<any>shadowRoot).elementsFromPoint(e.posx, e.posy).find(
              (el: Element) => this.viewHelper.viewDomNode.contains(el)
            );
          }
        }
        return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), e.editorPos, e.pos, testEventTarget ? target : null);
      }`,
  },
  {
    path: 'test3.ts',
    status: 'modified',
    oldVal: `        const changeTracker = textChanges.ChangeTracker.fromContext({ host, formatContext, preferences });

    const coalesceAndOrganizeImports = (importGroup: readonly ImportDeclaration[]) => stableSort(
        coalesceImports(removeUnusedImports(importGroup, sourceFile, program, skipDestructiveCodeActions)),
        (s1, s2) => compareImportsOrRequireStatements(s1, s2));

    // All of the old ImportDeclarations in the file, in syntactic order.
    const topLevelImportDecls = sourceFile.statements.filter(isImportDeclaration);
    organizeImportsWorker(topLevelImportDecls, coalesceAndOrganizeImports);

    // All of the old ExportDeclarations in the file, in syntactic order.
    const topLevelExportDecls = sourceFile.statements.filter(isExportDeclaration);`,
    newVal: `        const changeTracker = textChanges.ChangeTracker.fromContext({ host, formatContext, preferences });

    const coalesceAndOrganizeImports = (importGroup: readonly ImportDeclaration[]) => stableSort(
        coalesceImports(removeUnusedImports(importGroup, sourceFile, program, skipDestructiveCodeActions)),
        (s1, s2) => compareImportsOrRequireStatements(s1, s2));

    // All of the old ImportDeclarations in the file, in syntactic order.
    const topLevelImportGroupDecls = groupImportsByNewlineContiguous(sourceFile.statements.filter(isImportDeclaration), host, formatContext);
    topLevelImportGroupDecls.forEach(topLevelImportGroupDecl => organizeImportsWorker(topLevelImportGroupDecl, coalesceAndOrganizeImports));

    // All of the old ExportDeclarations in the file, in syntactic order.
    const topLevelExportDecls = sourceFile.statements.filter(isExportDeclaration);`,
  },
  {
    path: 'test4.ts',
    status: 'modified',
    oldVal: `{
      "name": "@stoplight/elements-dev-portal",
      "version": "1.6.14",
      "description": "UI components for composing beautiful developer documentation.",
      "keywords": [],
      "sideEffects": [
    
        [...devPortalCacheKeys.branchNode(projectId, branch, node), 'details'] as const,
    
      search: () => [...devPortalCacheKeys.all, 'search'],
      searchNodes: (filters: { projectIds?: string[]; workspaceId?: string; search?: string }) => [
        ...devPortalCacheKeys.search(),
        filters,
      ],
    
    });
    
    expect(fetchMock).toBeCalledWith(
      'https://stoplight.io/api/v1/workspaces/my%3Fworkspace/nodes?project_ids[0]=some%2Fslash&search=a%3Fspecial%26search&branchSlug=test%2Bbranch',
      {
        headers: expect.objectContaining({
          'Stoplight-Elements-Version': expect.any(String),
    
    
          if (branchSlug) {
            const encodedBranchSlug = encodeURIComponent(branchSlug);
            queryParams.push(branchSlug=encodedBranchSlug});
          }
        
          const query = queryParams.length ? ?queryParams.join('&')} : '';
    
          search,
          workspaceId,
          projectIds,
          pause,
        }: {
          search: string;
          workspaceId?: string;
          projectIds?: string[];
          pause?: boolean;
        }) {
          const { platformUrl, platformAuthToken } = React.useContext(PlatformContext);
          const [debounceSearch] = useDebounce(search, 500);
          return useQuery(
            [
              ...devPortalCacheKeys.searchNodes({ projectIds, workspaceId, search: debounceSearch }),
              platformUrl,
              platformAuthToken,
            ],
            () => getNodes({ workspaceId, projectIds, search: debounceSearch, platformUrl, platformAuthToken }),
            { enabled: !pause, keepPreviousData: true },
          );
        }`,
    newVal: `{
      "name": "@stoplight/elements-dev-portal",
      "version": "1.6.15",
      "description": "UI components for composing beautiful developer documentation.",
      "keywords": [],
      "sideEffects": [
    
        [...devPortalCacheKeys.branchNode(projectId, branch, node), 'details'] as const,
    
      search: () => [...devPortalCacheKeys.all, 'search'],
      searchNodes: (filters: { projectIds?: string[]; branchSlug?: string; workspaceId?: string; search?: string }) => [
        ...devPortalCacheKeys.search(),
        filters,
      ],
    
    });
    
    expect(fetchMock).toBeCalledWith(
      'https://stoplight.io/api/v1/workspaces/my%3Fworkspace/nodes?project_ids[0]=some%2Fslash&search=a%3Fspecial%26search&branch=test%2Bbranch',
      {
        headers: expect.objectContaining({
          'Stoplight-Elements-Version': expect.any(String),
    
    
          if (branchSlug) {
            const encodedBranchSlug = encodeURIComponent(branchSlug);
            queryParams.push(branch=encodedBranchSlug});
          }
        
          const query = queryParams.length ? ?queryParams.join('&')} : '';
    
          search,
          workspaceId,
          projectIds,
          branch,
          pause,
        }: {
          search: string;
          workspaceId?: string;
          projectIds?: string[];
          branch?: string;
          pause?: boolean;
        }) {
          const { platformUrl, platformAuthToken } = React.useContext(PlatformContext);
          const [debounceSearch] = useDebounce(search, 500);
          return useQuery(
            [
              ...devPortalCacheKeys.searchNodes({ projectIds, branchSlug: branch, workspaceId, search: debounceSearch }),
              platformUrl,
              platformAuthToken,
            ],
            () =>
              getNodes({ workspaceId, projectIds, branchSlug: branch, search: debounceSearch, platformUrl, platformAuthToken }),
            { enabled: !pause, keepPreviousData: true },
          );
        }`,
  },
  {
    path: 'lifecylclehooks.ts',
    status: 'modified',
    oldVal: `
import { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

class PubSubTracker {
    private _tracked: Record<string, number> = {};

    public track(name: string): void {
        if (!this._tracked[name]) {
            this._tracked[name] = 0;
        }
        this._tracked[name]++;
    }

    public reset(): void {
        this._tracked = {};
    }

    public isExecutedOnce(name: string): boolean {
        return this._tracked[name] === 1;
    }

    public getExecuted(name: string): number {
        return this._tracked[name] || 0;
    }
}

export const pubSubTracker = new PubSubTracker();

export const assignModelEvents = () => {
    return new ContextPlugin<CmsContext>(async context => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.models.onBeforeModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeCreate");
        });
        context.cms.models.onAfterModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterCreate");
        });
        context.cms.models.onBeforeModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeUpdate");
        });
        context.cms.models.onAfterModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterUpdate");
        });
        context.cms.models.onBeforeModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeDelete");
        });
        context.cms.models.onAfterModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:afterDelete");
        });
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.entries.onBeforeEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreate");
        });
        context.cms.entries.onAfterEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreate");
        });
        context.cms.entries.onBeforeEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
        });
        context.cms.entries.onAfterEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
        });
        context.cms.entries.onBeforeEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUpdate");
        });
        context.cms.entries.onAfterEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUpdate");
        });
        context.cms.entries.onBeforeEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDelete");
        });
        context.cms.entries.onAfterEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDelete");
        });
        context.cms.entries.onBeforeEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDeleteRevision");
        });
        context.cms.entries.onAfterEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDeleteRevision");
        });
        context.cms.entries.onBeforeEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforePublish");
        });
        context.cms.entries.onAfterEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterPublish");
        });
        context.cms.entries.onBeforeEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUnpublish");
        });
        context.cms.entries.onAfterEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUnpublish");
        });
        context.cms.entries.onBeforeEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestReview");
        });
        context.cms.entries.onAfterEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestReview");
        });
        context.cms.entries.onBeforeEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestChanges");
        });
        context.cms.entries.onAfterEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestChanges");
        });
    });
};
`,
    newVal: `
import { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

class PubSubTracker {
    private _tracked: Record<string, number> = {};

    public track(name: string): void {
        if (!this._tracked[name]) {
            this._tracked[name] = 0;
        }
        this._tracked[name]++;
    }

    public reset(): void {
        this._tracked = {};
    }

    public isExecutedOnce(name: string): boolean {
        return this._tracked[name] === 1;
    }

    public getExecuted(name: string): number {
        return this._tracked[name] || 0;
    }
}

export const pubSubTracker = new PubSubTracker();

export const assignModelEvents = () => {
    return new ContextPlugin<CmsContext>(async context => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.onBeforeModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeCreate");
        });
        context.cms.onAfterModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterCreate");
        });
        context.cms.onBeforeModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeUpdate");
        });
        context.cms.onAfterModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterUpdate");
        });
        context.cms.onBeforeModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeDelete");
        });
        context.cms.onAfterModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:afterDelete");
        });
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.onBeforeEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreate");
        });
        context.cms.onAfterEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreate");
        });
        context.cms.onBeforeEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
        });
        context.cms.onAfterEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
        });
        context.cms.onBeforeEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUpdate");
        });
        context.cms.onAfterEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUpdate");
        });
        context.cms.onBeforeEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDelete");
        });
        context.cms.onAfterEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDelete");
        });
        context.cms.onBeforeEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDeleteRevision");
        });
        context.cms.onAfterEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDeleteRevision");
        });
        context.cms.onBeforeEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforePublish");
        });
        context.cms.onAfterEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterPublish");
        });
        context.cms.onBeforeEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUnpublish");
        });
        context.cms.onAfterEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUnpublish");
        });
        context.cms.onBeforeEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestReview");
        });
        context.cms.onAfterEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestReview");
        });
        context.cms.onBeforeEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestChanges");
        });
        context.cms.onAfterEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestChanges");
        });
    });
};
`,
  },
  {
    path: 'diffLineChar.ts',
    status: 'modified',
    oldVal: `
import { get } from "https";
import { CloudFrontRequestEvent } from "~/lambdaEdge";
import { configPath } from "./common";
import { logDebug } from "./log";

// Config is locally cached within live lambda for a short time (1 minute).
// Config must be cached per domain.
// Otherwise cache will spill over different apps, because we may share this lambda.
const configCache = new Map<string, GatewayConfigCache>();

interface GatewayConfigCache {
    config: GatewayConfig;
    timestamp: number;
}

export interface VariantConfig {
    domain: string;
    weight: number;
}

export type GatewayConfig = Record<string, VariantConfig>;

/**
 * Loads traffic splitting config.
 * It will, however not call WCP directly, but serve it from a locally cached file,
 * as explained here https://www.notion.so/webiny/How-traffic-config-is-cached-2c8db57ca2b547a2b2fb1adf378cd191
 */
export async function loadTrafficSplittingConfig(event: CloudFrontRequestEvent) {
    // Retrieve domain of the CloudFront distribution.
    // We need it to make sure we cache config per application.
    // For example API and website could share the same lambda instance.
    // So we cache it separately for each domain (each CloudFront).
    const domain = event.Records[0].cf.config.distributionDomainName;

    let config = configCache.get(domain);
    if (!config || isCacheExpired(config.timestamp)) {
        logDebug("No config in cache");
        config = {
            config: await loadConfigCore(domain),
            timestamp: Date.now()
        };

        configCache.set(domain, config);
    }

    return config.config;
}

function loadConfigCore(domain: string) {
    return new Promise<GatewayConfig>((resolve, reject) => {
        let dataString = "";

        const req = get(
            {
                hostname: domain,
                port: 443,
                path: configPath
            },
            function (res) {
                res.on("data", chunk => {
                    dataString += chunk;
                });
                res.on("end", () => {
                    resolve(JSON.parse(dataString));
                });
            }
        );

        req.on("error", e => {
            reject({
                statusCode: 500,
                body: e.message
            });
        });
    });
}

function isCacheExpired(timestamp: number) {
    const ttl = 60 * 1000; // 1 minute
    return Date.now() - timestamp > ttl;
}`,
    newVal: `
import { get } from "https";
import { CloudFrontRequestEvent } from "~/lambdaEdge";
import { logDebug } from "./log";

// Config file has a fixed URL within CDN, so it can be properly cached.
// This way we achieve better performance, because CDN does not have to call WCP API for config every time,
// but it can use it's own cache for a lookup.
const configPath = "/_config";

// Config is locally cached within live lambda for a short time (1 minute).
// Config must be cached per domain.
// Otherwise cache will spill over different apps, because we may share this lambda.
const configCache = new Map<string, GatewayConfigCache>();

interface GatewayConfigCache {
    config: GatewayConfig;
    timestamp: number;
}

export interface VariantConfig {
    domain: string;
    weight: number;
}

export type GatewayConfig = Record<string, VariantConfig>;

/**
 * Loads traffic splitting config.
 * It will, however not call WCP directly, but serve it from a locally cached file,
 * as explained here https://www.notion.so/webiny/How-traffic-config-is-cached-2c8db57ca2b547a2b2fb1adf378cd191
 */
export async function loadTrafficSplittingConfig(event: CloudFrontRequestEvent) {
    // Retrieve domain of the CloudFront distribution.
    // We need it to make sure we cache config per application.
    // For example API and website could share the same lambda instance.
    // So we cache it separately for each domain (each CloudFront).
    const domain = event.Records[0].cf.config.distributionDomainName;

    let config = configCache.get(domain);
    if (!config || isCacheExpired(config.timestamp)) {
        logDebug("No config in cache");
        config = {
            config: await loadConfigCore(domain),
            timestamp: Date.now()
        };

        configCache.set(domain, config);
    }

    return config.config;
}

function loadConfigCore(domain: string) {
    return new Promise<GatewayConfig>((resolve, reject) => {
        let dataString = "";

        const req = get(
            {
                hostname: domain,
                port: 443,
                path: configPath
            },
            function (res) {
                res.on("data", chunk => {
                    dataString += chunk;
                });
                res.on("end", () => {
                    resolve(JSON.parse(dataString));
                });
            }
        );

        req.on("error", e => {
            reject({
                statusCode: 500,
                body: e.message
            });
        });
    });
}

 isCacheExpired(timestamp: numbers) {
    const ttl = 60 * 1000; // 1 minute
    return Date.now() - timestamp > ttl;
}`,
  },
  {
    path: 'diffLineChar2.ts',
    status: 'modified',
    oldVal: `
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
import { buildCloudFrontFunction, buildLambdaEdge } from "@webiny/project-utils";

export function createLambdas(app: PulumiApp) {
    const role = app.addResource(aws.iam.Role, {
        name: 'lambda-edge-role',
        config: {
            managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.LambdaPrincipal,
                        Effect: "Allow"
                    },
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.EdgeLambdaPrincipal,
                        Effect: "Allow"
                    }
                ]
            }
        }
    });

    const functions = app.addHandler(() => {
        // Some resources _must_ be put in us-east-1, such as Lambda at Edge,
        // so we need to pass provider to resource options.
        // The problem is, pulumi does not allow to pass provider as 'pulumi.Output',
        // it has to be a created instance.
        // This is why we run the code inside 'app.addHandler' wrapper.
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        const viewerRequest = createCloudfrontFunction("viewerRequest");
        const viewerResponse = createCloudfrontFunction("viewerResponse");
        const originRequest = createLambdaEdge("originRequest", awsUsEast1, role.output);
        const adminOriginRequest = createLambdaEdge("adminOriginRequest", awsUsEast1, role.output);

        return {
            viewerRequest,
            viewerResponse,
            originRequest,
            adminOriginRequest
        };
    });

    return {
        role,
        functions
    };
}

function createLambdaEdge(name: string, provider: aws.Provider, role: pulumi.Output<aws.iam.Role>) {
    const file = '@webiny/aws-helpers/stagedRollouts/functions/';
    const output = buildLambdaEdge(file);

    return new aws.lambda.Function(
        name,
        {
            publish: true,
            runtime: "nodejs14.x",
            handler: "index.default",
            role: role.arn,
            timeout: 5,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(output.then(o => o.code))
            })
        },
        { provider }
    );
}

function createCloudfrontFunction(name: string) {
    const file = '@webiny/aws-helpers/stagedRollouts/functions/';
    const output = buildCloudFrontFunction(file);

    return new aws.cloudfront.Function(name, {
        runtime: "cloudfront-js-1.0",
        code: output.then(o => o.code)
    });
}    
`,
    newVal: `
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
import { buildCloudFrontFunction, buildLambdaEdge } from "@webiny/project-utils";

export function createLambdas(app: PulumiApp) {
    const role = app.addResource(aws.iam.Role, {
        name: 'lambda-edge-role',
        config: {
            managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.LambdaPrincipal,
                        Effect: "Allow"
                    },
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.EdgeLambdaPrincipal,
                        Effect: "Allow"
                    }
                ]
            }
        }
    });

    const functions = app.addHandler(() => {
        // Some resources _must_ be put in us-east-1, such as Lambda at Edge,
        // so we need to pass provider to resource options.
        // The problem is, pulumi does not allow to pass provider as 'pulumi.Output',
        // it has to be a created instance.
        // This is why we run the code inside 'app.addHandler' wrapper.
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        const viewerRequest = createCloudfrontFunction("viewerRequest");
        const viewerResponse = createCloudfrontFunction("viewerResponse");
        const originRequest = createLambdaEdge("originRequest", awsUsEast1, role.output);
        const adminOriginRequest = createLambdaEdge("adminOriginRequest", awsUsEast1, role.output);
        // This lambda is responsible for fetching traffic splitting config from WCP
        // and caching it inside CloudFront cache.
        const configOriginRequest = createLambdaEdge(
            "configOriginRequest",
            awsUsEast1,
            role.output
        );

        return {
            viewerRequest,
            viewerResponse,
            originRequest,
            adminOriginRequest,
            configOriginRequest
        };
    });

    return {
        role,
        functions
    };
}

function createLambdaEdge(name: string, provider: aws.Provider, role: pulumi.Output<aws.iam.Role>) {
    const file = '@webiny/aws-helpers/stagedRollouts/functions/';
    const output = buildLambdaEdge(file);

    return new aws.lambda.Function(
        name,
        {
            publish: true,
            runtime: "nodejs14.x",
            handler: "index.default",
            role: role.arn,
            timeout: 5,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(output.then(o => o.code))
            })
        },
        { provider }
    );
}

function createCloudfrontFunction(name: string) {
    const file = '@webiny/aws-helpers/stagedRollouts/functions/';
    const output = buildCloudFrontFunction(file);

    return new aws.cloudfront.Function(name, {
        runtime: "cloudfront-js-1.0",
        code: output.then(o => o.code)
    });
}    
`,
  },
];
