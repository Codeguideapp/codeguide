import { File } from '../api/api';

export const mockFiles: File[] = [
  {
    path: 'old-tests.ts',
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
];
