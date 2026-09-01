# Azure Static Web Apps deployment

This repository publishes the static site in `app/` with the workflow
`.github/workflows/azure-static-web-apps-icy-field-075bc3a10.yml`.

The production Azure Static Web App is `scp-test-gen` in resource group
`NetworkWatcherRG`, region `East US 2` (`eastus2`), on the `Free` SKU. Its
default hostname is `mango-glacier-0ae0aaa0f.3.azurestaticapps.net`. The resource is
deliberately **not linked to the GitHub repository** (`provider=None`,
`repositoryUrl=null`); deployment is performed by the repository workflow using
the SWA CLI and deployment token.

## Prerequisites and one-time setup

- A GitHub repository with Actions enabled and permission to add repository
  secrets.
- An Azure subscription and an Azure Static Web Apps resource. Create one in
  the Azure portal: **Create a resource → Static Web App**, choose the GitHub
  deployment source, repository, and `main` branch. If the resource is
  created without GitHub integration, open **Manage deployment token** in the
  resource and copy the token, or use the Azure CLI/portal deployment-token
  operation.
- Add that value as a GitHub Actions repository secret. The exact secret name
  required by this workflow is:

  `AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_FIELD_075BC3A10`

  Do not put the token in YAML, source files, issues, documentation, or logs.
  Pipe it directly to GitHub and never print or store the value; for example:

  `az staticwebapp secrets list --name scp-test-gen --resource-group NetworkWatcherRG -o tsv | tr -d '\r\n' | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_FIELD_075BC3A10 --repo Wizette/scp-test-gen`

  Stripping `\r` matters when the command is run on Windows. The production
  upload job references this secret; the pull-request-close job uses the Azure
  action for preview cleanup.

The workflow's production job runs `npx -y @azure/static-web-apps-cli@latest
 deploy ./app --env production`, with `SWA_CLI_DEPLOYMENT_TOKEN` populated from
the repository secret. No package installation or build command other than the
SWA CLI invocation runs in the deployment workflow. The close-pull-request job
still uses `Azure/static-web-apps-deploy@v1.0.0` to remove a preview.

## Local validation and URLs

From the repository root, run the exact app/tests checks:

```text
node scripts/validate-tests.mjs
node scripts/test-app.mjs
```

Serve `app/` over HTTP so its JSON fetches work. For example:

```text
app/serve.cmd
```

Then visit:

- `http://localhost:8080/?test=z17-test`
- Hilchot Tzitzit: `http://localhost:8080/?test=z18-test`
- `http://localhost:8080/stats.html?test=z17-test` (or `z18-test`) to select Z17 or Hilchot Tzitzit
  the stats bank

The live deployed URLs are:

- `https://mango-glacier-0ae0aaa0f.3.azurestaticapps.net/`
- `https://mango-glacier-0ae0aaa0f.3.azurestaticapps.net/?test=z17-test`
- `https://mango-glacier-0ae0aaa0f.3.azurestaticapps.net/?test=z18-test`
- `https://mango-glacier-0ae0aaa0f.3.azurestaticapps.net/stats.html?test=z18-test`

The GitHub Actions deployment secret is
`AZURE_STATIC_WEB_APPS_API_TOKEN_ICY_FIELD_075BC3A10`. The workflow file was
not renamed because it already references this exact secret name.

## Deployment behavior

- A push to `main` uploads the static app to the production environment.
- A manual run is available through **Actions → Azure Static Web Apps CI/CD →
  Run workflow**. Running it from the selected branch uploads that branch's
  checked-out `app/` contents to the production environment; use it for a
  manual redeploy after verifying the branch and validation checks.
- Opening, synchronizing, or reopening a pull request targeting `main` creates
  or updates its temporary SWA preview environment.
- Closing or merging that pull request invokes the close job and removes the
  preview environment. If a stale preview remains, close the PR again or
  remove it from the Static Web Apps environments/deployment view after
  confirming it is no longer needed.

Find the deployed URL in the Azure portal under the Static Web App's
**Overview** (Default domain), in the deployment details, or in the completed
GitHub Actions deployment summary. The workflow file itself does not contain
the site URL.

## Custom domain and DNS

In the Static Web App resource, open **Custom domains → Add**, enter the domain,
and follow Azure's displayed validation instructions. For an apex domain,
Azure commonly requires the shown A/ALIAS/ANAME record; for a subdomain it
commonly requires a CNAME to the SWA default hostname. Add the exact TXT or
other validation record Azure requests, wait for DNS propagation, then finish
validation and enable HTTPS. Do not guess records or delete existing DNS
entries; DNS hosting providers differ.

## Rollback

Revert the bad change in Git (`git revert <commit>`), push the revert to
`main`, and let the normal workflow redeploy it. For an emergency, use the
Azure deployment history to identify the last known-good deployment, but keep
Git as the source of truth and follow with a revert/redeploy or a manual
workflow run after selecting the known-good revision.

## Troubleshooting

- **Missing token/401:** verify the repository secret name matches exactly,
  that its value is the SWA deployment token for this resource, and that
  Actions can read repository secrets (fork PRs do not receive secrets).
- **OIDC/deployment-action authentication errors:** production intentionally
  does not use `Azure/static-web-apps-deploy@v1`. That action now mandates GitHub
  OIDC (`id-token: write`); without the permission it fails with `Unable to get
  ACTIONS_ID_TOKEN_REQUEST_URL env variable`, and with OIDC against this
  deliberately unlinked SWA it fails with `No matching Static Web App was found
  or the api key was invalid`. The alternative is linking the SWA to the GitHub
  repository, but that is intentionally avoided; the production job therefore
  uses the SWA CLI with `SWA_CLI_DEPLOYMENT_TOKEN`.
- **404 or missing JSON:** confirm the workflow's `app_location: app`, empty
  `output_location`, `skip_app_build: true`, and that `app/tests/*.json` is
  committed. Test through HTTP locally rather than opening `index.html`
  directly.
- **Preview unavailable:** check the pull request workflow run and ensure the
  close event was not intentionally skipped; a fork PR may need a trusted
  maintainer workflow because secrets are withheld.
- **Custom domain failure:** inspect DNS records, TTL/propagation, and the
  validation record shown in the Azure portal.
- **Unexpected content:** inspect the commit SHA and deployment status in the
  GitHub Actions run and Azure deployment history, then redeploy by reverting
  or rerunning the appropriate workflow.

The Azure Static Web App is live at the hostname and URLs documented above.
The deployment token is stored only in the GitHub Actions secret named above;
it is not stored in this repository or in the workflow.
