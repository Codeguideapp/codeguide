import { Octokit } from 'octokit';

export type File = {
  status: 'added' | 'modified' | 'deleted';
  path: string;
  oldVal: string;
  newVal: string;
};

export const getFile = async (path: string) => {
  // note: this can be invoked as user types, so it needs a caching layer
  const files = await getFiles(0);
  return files.find((f) => f.path === path);
};

const octokit = new Octokit({
  auth: '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',
});

export const getFiles = async (pr: number): Promise<File[]> => {
  // const files: File[] = [];

  // const owner = 'stoplightio';
  // const repo = 'elements';
  // const pull_number = 153;
  // const pull_number = 1693;

  // const prReq = await octokit.request(
  //   `GET /repos/${owner}/${repo}/pulls/${pull_number}`,
  //   {
  //     owner,
  //     repo,
  //     pull_number,
  //   }
  // );
  // const baseSha = prReq.data.base.sha;

  // const filesReq = await octokit.request(
  //   `GET /repos/${owner}/${repo}/pulls/${pull_number}/files`,
  //   {
  //     owner,
  //     repo,
  //     pull_number,
  //   }
  // );

  // for (const file of filesReq.data) {
  //   const oldVal = await fetch(
  //     `https://raw.githubusercontent.com/${owner}/${repo}/${baseSha}/${encodeURIComponent(
  //       file.filename
  //     )}`
  //   ).then((r) => r.text());

  //   //console.log(file);
  //   const newVal = await fetch(
  //     `https://raw.githubusercontent.com/${owner}/${repo}/${
  //       prReq.data.merge_commit_sha
  //     }/${encodeURIComponent(file.filename)}`
  //   ).then((r) => r.text());

  //   files.push({
  //     path: file.filename,
  //     status: file.status,
  //     oldVal,
  //     newVal,
  //   });
  // }

  // return files;

  return [
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
  ];
};
